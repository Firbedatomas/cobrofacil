const mercadopago = require('mercadopago');
const { Payment, Sale, Product } = require('../../config/database');

class MercadoPagoService {
    constructor() {
        // Configurar MercadoPago
        mercadopago.configure({
            access_token: process.env.MERCADOPAGO_ACCESS_TOKEN,
            sandbox: process.env.NODE_ENV !== 'production'
        });
        
        this.webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET;
        this.publicKey = process.env.MERCADOPAGO_PUBLIC_KEY;
    }

    // Crear preferencia de pago para checkout
    async createPaymentPreference(orderData) {
        try {
            const { items, payer, backUrls, externalReference } = orderData;

            const preference = {
                items: items.map(item => ({
                    id: item.id,
                    title: item.title,
                    description: item.description || '',
                    category_id: item.category_id || 'others',
                    quantity: item.quantity,
                    currency_id: 'ARS',
                    unit_price: parseFloat(item.unit_price)
                })),
                payer: {
                    name: payer?.name || '',
                    surname: payer?.surname || '',
                    email: payer?.email || '',
                    phone: payer?.phone ? {
                        area_code: payer.phone.area_code || '',
                        number: payer.phone.number || ''
                    } : {},
                    identification: payer?.identification ? {
                        type: payer.identification.type || 'DNI',
                        number: payer.identification.number || ''
                    } : {},
                    address: payer?.address ? {
                        street_name: payer.address.street_name || '',
                        street_number: payer.address.street_number || '',
                        zip_code: payer.address.zip_code || ''
                    } : {}
                },
                back_urls: {
                    success: backUrls?.success || `${process.env.FRONTEND_URL}/payment/success`,
                    failure: backUrls?.failure || `${process.env.FRONTEND_URL}/payment/failure`,
                    pending: backUrls?.pending || `${process.env.FRONTEND_URL}/payment/pending`
                },
                auto_return: 'approved',
                external_reference: externalReference,
                notification_url: `${process.env.BACKEND_URL}/webhooks/mercadopago`,
                expires: true,
                expiration_date_from: new Date().toISOString(),
                expiration_date_to: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
                payment_methods: {
                    excluded_payment_methods: [],
                    excluded_payment_types: [],
                    installments: 12
                },
                shipments: {
                    mode: 'not_specified'
                }
            };

            const response = await mercadopago.preferences.create(preference);
            return {
                success: true,
                data: {
                    id: response.body.id,
                    init_point: response.body.init_point,
                    sandbox_init_point: response.body.sandbox_init_point,
                    external_reference: response.body.external_reference,
                    public_key: this.publicKey
                }
            };
        } catch (error) {
            console.error('Error creando preferencia MercadoPago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Crear pago directo (sin checkout)
    async createDirectPayment(paymentData) {
        try {
            const payment = {
                transaction_amount: parseFloat(paymentData.transaction_amount),
                token: paymentData.token,
                description: paymentData.description,
                installments: parseInt(paymentData.installments) || 1,
                payment_method_id: paymentData.payment_method_id,
                issuer_id: paymentData.issuer_id,
                payer: {
                    email: paymentData.payer.email,
                    identification: {
                        type: paymentData.payer.identification.type,
                        number: paymentData.payer.identification.number
                    }
                },
                external_reference: paymentData.external_reference,
                notification_url: `${process.env.BACKEND_URL}/webhooks/mercadopago`
            };

            const response = await mercadopago.payment.create(payment);
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error creando pago directo:', error);
            return {
                success: false,
                error: error.message,
                details: error.cause
            };
        }
    }

    // Obtener información de un pago
    async getPayment(paymentId) {
        try {
            const response = await mercadopago.payment.get(paymentId);
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error obteniendo pago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Procesar webhook de MercadoPago
    async processWebhook(webhookData, signature) {
        try {
            // Verificar firma del webhook si está configurada
            if (this.webhookSecret && signature) {
                const isValidSignature = this.verifyWebhookSignature(webhookData, signature);
                if (!isValidSignature) {
                    throw new Error('Firma del webhook inválida');
                }
            }

            const { type, data } = webhookData;

            switch (type) {
                case 'payment':
                    return await this.handlePaymentWebhook(data.id);
                case 'merchant_order':
                    return await this.handleMerchantOrderWebhook(data.id);
                default:
                    console.log('Tipo de webhook no manejado:', type);
                    return { success: true, message: 'Webhook recibido pero no procesado' };
            }
        } catch (error) {
            console.error('Error procesando webhook:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Manejar webhook de pago
    async handlePaymentWebhook(paymentId) {
        try {
            const paymentInfo = await this.getPayment(paymentId);
            if (!paymentInfo.success) {
                throw new Error('No se pudo obtener información del pago');
            }

            const payment = paymentInfo.data;
            const externalReference = payment.external_reference;

            // Buscar la venta en la base de datos
            const sale = await Sale.findOne({
                where: { external_reference: externalReference }
            });

            if (!sale) {
                console.log('Venta no encontrada para external_reference:', externalReference);
                return { success: true, message: 'Venta no encontrada' };
            }

            // Actualizar estado de la venta según el estado del pago
            let saleStatus;
            switch (payment.status) {
                case 'approved':
                    saleStatus = 'pagado';
                    break;
                case 'pending':
                case 'in_process':
                    saleStatus = 'pendiente';
                    break;
                case 'rejected':
                case 'cancelled':
                    saleStatus = 'cancelado';
                    break;
                default:
                    saleStatus = 'pendiente';
            }

            // Actualizar venta
            await sale.update({
                estado_pago: saleStatus,
                mercadopago_payment_id: payment.id,
                mercadopago_status: payment.status,
                mercadopago_status_detail: payment.status_detail,
                fecha_pago: payment.date_approved ? new Date(payment.date_approved) : null,
                metodo_pago: payment.payment_method_id,
                updated_at: new Date()
            });

            // Registrar el pago en la tabla de pagos
            await Payment.create({
                sale_id: sale.id,
                amount: payment.transaction_amount,
                currency: payment.currency_id,
                payment_method: payment.payment_method_id,
                status: payment.status,
                external_id: payment.id,
                provider: 'mercadopago',
                transaction_date: new Date(payment.date_created),
                approval_date: payment.date_approved ? new Date(payment.date_approved) : null,
                details: JSON.stringify({
                    status_detail: payment.status_detail,
                    installments: payment.installments,
                    card_info: payment.card ? {
                        first_six_digits: payment.card.first_six_digits,
                        last_four_digits: payment.card.last_four_digits,
                        cardholder: payment.card.cardholder
                    } : null
                })
            });

            console.log(`Pago procesado: ${payment.id} - Estado: ${payment.status}`);
            return {
                success: true,
                message: 'Pago procesado correctamente',
                data: {
                    payment_id: payment.id,
                    status: payment.status,
                    sale_id: sale.id
                }
            };
        } catch (error) {
            console.error('Error manejando webhook de pago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Manejar webhook de merchant order
    async handleMerchantOrderWebhook(orderId) {
        try {
            const response = await mercadopago.merchant_orders.get(orderId);
            const merchantOrder = response.body;

            console.log('Merchant Order recibida:', merchantOrder.id);
            
            // Procesar pagos asociados a la orden
            for (const payment of merchantOrder.payments || []) {
                await this.handlePaymentWebhook(payment.id);
            }

            return {
                success: true,
                message: 'Merchant order procesada'
            };
        } catch (error) {
            console.error('Error manejando merchant order:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Verificar firma del webhook
    verifyWebhookSignature(payload, signature) {
        try {
            const crypto = require('crypto');
            const expectedSignature = crypto
                .createHmac('sha256', this.webhookSecret)
                .update(JSON.stringify(payload))
                .digest('hex');
            
            return signature === expectedSignature;
        } catch (error) {
            console.error('Error verificando firma:', error);
            return false;
        }
    }

    // Obtener métodos de pago disponibles
    async getPaymentMethods() {
        try {
            const response = await mercadopago.payment_methods.list();
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error obteniendo métodos de pago:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener identificación de emisores para una tarjeta
    async getCardIssuers(paymentMethodId) {
        try {
            const response = await mercadopago.card_issuers.list({
                payment_method_id: paymentMethodId
            });
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error obteniendo emisores:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener cuotas disponibles
    async getInstallments(paymentMethodId, amount, issuerId) {
        try {
            const response = await mercadopago.installments.list({
                payment_method_id: paymentMethodId,
                amount: amount,
                issuer_id: issuerId
            });
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error obteniendo cuotas:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Refund de un pago
    async refundPayment(paymentId, amount = null) {
        try {
            const refundData = {
                payment_id: paymentId
            };
            
            if (amount) {
                refundData.amount = parseFloat(amount);
            }

            const response = await mercadopago.refund.create(refundData);
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error procesando refund:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener reportes de ventas
    async getSalesReport(startDate, endDate) {
        try {
            const filters = {
                begin_date: startDate,
                end_date: endDate
            };

            const response = await mercadopago.reports.list(filters);
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error obteniendo reporte:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Crear QR Code para pagos presenciales
    async createQRCode(storeId, pointOfSaleId, amount, description, externalReference) {
        try {
            const qrData = {
                store_id: storeId,
                point_of_sale_id: pointOfSaleId,
                order: {
                    amount: parseFloat(amount),
                    description: description,
                    external_reference: externalReference
                }
            };

            const response = await mercadopago.pos.create(qrData);
            return {
                success: true,
                data: response.body
            };
        } catch (error) {
            console.error('Error creando QR:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new MercadoPagoService(); 