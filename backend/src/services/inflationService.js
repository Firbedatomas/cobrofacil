const axios = require('axios');
const cron = require('node-cron');
const { Product, InflationRate, InflationAdjustment } = require('../config/database');

class InflationService {
    constructor() {
        this.facpceApiUrl = 'https://api.facpce.org.ar/v1/indices';
        this.indecApiUrl = 'https://apis.datos.gob.ar/series/api/series';
        this.scheduledJobs = new Map();
        
        // Inicializar actualización diaria de índices
        this.initDailyRateUpdate();
    }

    // Obtener tasas de inflación actuales desde APIs oficiales
    async getCurrentRates() {
        try {
            // Intentar obtener desde FACPCE primero
            const facpceRates = await this.getFacpceRates();
            if (facpceRates) return facpceRates;

            // Fallback a INDEC
            const indecRates = await this.getIndecRates();
            if (indecRates) return indecRates;

            // Fallback a base de datos local
            return await this.getStoredRates();
        } catch (error) {
            console.error('Error obteniendo tasas de inflación:', error);
            // Usar tasas almacenadas como último recurso
            return await this.getStoredRates();
        }
    }

    // Obtener datos de FACPCE
    async getFacpceRates() {
        try {
            const response = await axios.get(`${this.facpceApiUrl}/ipc`, {
                timeout: 10000,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'CobroFacil/1.0'
                }
            });

            const data = response.data;
            const rates = {
                monthly: data.variacion_mensual || 0,
                quarterly: data.variacion_trimestral || 0,
                annual: data.variacion_anual || 0,
                accumulated: data.variacion_acumulada || 0,
                source: 'FACPCE',
                updated: new Date(),
                period: data.periodo
            };

            // Guardar en base de datos
            await this.storeRates(rates);
            return rates;
        } catch (error) {
            console.error('Error obteniendo datos de FACPCE:', error);
            return null;
        }
    }

    // Obtener datos de INDEC como fallback
    async getIndecRates() {
        try {
            const response = await axios.get(
                `${this.indecApiUrl}/?ids=148.3_INIVELNAL_M_26:percent_change_a_year_ago,148.3_INIVELNAL_M_26:percent_change`,
                { timeout: 10000 }
            );

            const data = response.data.data;
            const rates = {
                monthly: data[1]?.value || 0,
                annual: data[0]?.value || 0,
                quarterly: (data[1]?.value || 0) * 3, // Aproximación
                accumulated: data[0]?.value || 0,
                source: 'INDEC',
                updated: new Date(),
                period: data[0]?.date
            };

            await this.storeRates(rates);
            return rates;
        } catch (error) {
            console.error('Error obteniendo datos de INDEC:', error);
            return null;
        }
    }

    // Obtener tasas almacenadas localmente
    async getStoredRates() {
        try {
            const latestRate = await InflationRate.findOne({
                order: [['createdAt', 'DESC']]
            });

            return latestRate ? latestRate.dataValues : {
                monthly: 0,
                quarterly: 0,
                annual: 0,
                accumulated: 0,
                source: 'LOCAL',
                updated: new Date(),
                period: 'N/A'
            };
        } catch (error) {
            console.error('Error obteniendo tasas almacenadas:', error);
            return {
                monthly: 0,
                quarterly: 0,
                annual: 0,
                accumulated: 0,
                source: 'DEFAULT',
                updated: new Date(),
                period: 'N/A'
            };
        }
    }

    // Almacenar tasas en la base de datos
    async storeRates(rates) {
        try {
            await InflationRate.create({
                monthly: rates.monthly,
                quarterly: rates.quarterly,
                annual: rates.annual,
                accumulated: rates.accumulated,
                source: rates.source,
                period: rates.period,
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Error almacenando tasas:', error);
        }
    }

    // Ajustar precios de productos específicos
    async adjustProductPrices(productIds, adjustmentRate) {
        try {
            const products = await Product.findAll({
                where: {
                    id: productIds
                }
            });

            const adjustedProducts = [];

            for (const product of products) {
                const oldPrice = parseFloat(product.precio);
                const newPrice = oldPrice * (1 + adjustmentRate / 100);
                
                await product.update({
                    precio: newPrice.toFixed(2),
                    updatedAt: new Date()
                });

                adjustedProducts.push({
                    id: product.id,
                    nombre: product.nombre,
                    oldPrice,
                    newPrice: parseFloat(newPrice.toFixed(2)),
                    adjustment: adjustmentRate
                });
            }

            return adjustedProducts;
        } catch (error) {
            console.error('Error ajustando precios de productos:', error);
            throw error;
        }
    }

    // Ajuste automático de todos los productos
    async autoAdjustAllProducts(adjustmentRate, excludeCategories = []) {
        try {
            let whereClause = {};
            if (excludeCategories.length > 0) {
                whereClause.categoria_id = {
                    [Op.notIn]: excludeCategories
                };
            }

            const products = await Product.findAll({
                where: whereClause
            });

            const adjustedProducts = [];

            for (const product of products) {
                const oldPrice = parseFloat(product.precio);
                const newPrice = oldPrice * (1 + adjustmentRate / 100);
                
                await product.update({
                    precio: newPrice.toFixed(2),
                    updatedAt: new Date()
                });

                adjustedProducts.push({
                    id: product.id,
                    nombre: product.nombre,
                    oldPrice,
                    newPrice: parseFloat(newPrice.toFixed(2)),
                    adjustment: adjustmentRate
                });
            }

            return adjustedProducts;
        } catch (error) {
            console.error('Error en ajuste automático:', error);
            throw error;
        }
    }

    // Simular ajuste sin aplicar cambios
    async simulateAdjustment(productIds, adjustmentRate) {
        try {
            const products = await Product.findAll({
                where: {
                    id: productIds
                }
            });

            const simulation = {
                adjustmentRate,
                products: [],
                summary: {
                    totalProducts: products.length,
                    totalOldValue: 0,
                    totalNewValue: 0,
                    totalIncrement: 0
                }
            };

            for (const product of products) {
                const oldPrice = parseFloat(product.precio);
                const newPrice = oldPrice * (1 + adjustmentRate / 100);
                const increment = newPrice - oldPrice;

                simulation.products.push({
                    id: product.id,
                    nombre: product.nombre,
                    codigo: product.codigo,
                    oldPrice,
                    newPrice: parseFloat(newPrice.toFixed(2)),
                    increment: parseFloat(increment.toFixed(2)),
                    percentageIncrease: adjustmentRate
                });

                simulation.summary.totalOldValue += oldPrice;
                simulation.summary.totalNewValue += newPrice;
                simulation.summary.totalIncrement += increment;
            }

            simulation.summary.totalOldValue = parseFloat(simulation.summary.totalOldValue.toFixed(2));
            simulation.summary.totalNewValue = parseFloat(simulation.summary.totalNewValue.toFixed(2));
            simulation.summary.totalIncrement = parseFloat(simulation.summary.totalIncrement.toFixed(2));

            return simulation;
        } catch (error) {
            console.error('Error simulando ajuste:', error);
            throw error;
        }
    }

    // Registrar ajuste en historial
    async recordAdjustment(adjustmentData) {
        try {
            await InflationAdjustment.create({
                type: adjustmentData.type,
                rate: adjustmentData.rate,
                productCount: adjustmentData.productCount,
                excludedCategories: JSON.stringify(adjustmentData.excludedCategories || []),
                userId: adjustmentData.userId,
                appliedAt: new Date()
            });
        } catch (error) {
            console.error('Error registrando ajuste:', error);
        }
    }

    // Obtener historial de ajustes
    async getAdjustmentHistory({ page = 1, limit = 20, startDate, endDate }) {
        try {
            let whereClause = {};
            
            if (startDate && endDate) {
                whereClause.appliedAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }

            const offset = (page - 1) * limit;
            
            const { count, rows } = await InflationAdjustment.findAndCountAll({
                where: whereClause,
                limit,
                offset,
                order: [['appliedAt', 'DESC']],
                include: [
                    {
                        model: User,
                        as: 'user',
                        attributes: ['nombre', 'email']
                    }
                ]
            });

            return {
                adjustments: rows,
                pagination: {
                    total: count,
                    page,
                    pages: Math.ceil(count / limit),
                    limit
                }
            };
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            throw error;
        }
    }

    // Programar ajuste automático
    async scheduleAutoAdjustment(scheduleData) {
        try {
            const { frequency, categories, minThreshold, userId } = scheduleData;
            
            // Convertir frecuencia a expresión cron
            let cronExpression;
            switch (frequency) {
                case 'weekly':
                    cronExpression = '0 9 * * 1'; // Lunes 9 AM
                    break;
                case 'monthly':
                    cronExpression = '0 9 1 * *'; // 1er día del mes 9 AM
                    break;
                case 'quarterly':
                    cronExpression = '0 9 1 */3 *'; // 1er día cada 3 meses 9 AM
                    break;
                default:
                    cronExpression = '0 9 1 * *'; // Mensual por defecto
            }

            // Cancelar trabajo anterior si existe
            const existingJobId = `auto-adjustment-${userId}`;
            if (this.scheduledJobs.has(existingJobId)) {
                this.scheduledJobs.get(existingJobId).destroy();
            }

            // Crear nuevo trabajo programado
            const job = cron.schedule(cronExpression, async () => {
                try {
                    console.log(`Ejecutando ajuste automático para usuario ${userId}`);
                    
                    const rates = await this.getCurrentRates();
                    const monthlyRate = rates.monthly;
                    
                    // Solo aplicar si supera el umbral mínimo
                    if (monthlyRate >= minThreshold) {
                        await this.autoAdjustAllProducts(monthlyRate, categories);
                        
                        await this.recordAdjustment({
                            type: 'auto_scheduled',
                            rate: monthlyRate,
                            productCount: 0, // Se actualizará después
                            excludedCategories: categories,
                            userId
                        });
                        
                        console.log(`Ajuste automático aplicado: ${monthlyRate}%`);
                    } else {
                        console.log(`Ajuste no aplicado: ${monthlyRate}% < ${minThreshold}%`);
                    }
                } catch (error) {
                    console.error('Error en ajuste automático programado:', error);
                }
            }, { scheduled: false });

            // Almacenar referencia del trabajo
            this.scheduledJobs.set(existingJobId, job);
            job.start();

            return {
                id: existingJobId,
                frequency,
                cronExpression,
                categories,
                minThreshold,
                status: 'active',
                nextRun: job.nextDate()
            };
        } catch (error) {
            console.error('Error programando ajuste automático:', error);
            throw error;
        }
    }

    // Inicializar actualización diaria de tasas
    initDailyRateUpdate() {
        // Actualizar tasas todos los días a las 6 AM
        cron.schedule('0 6 * * *', async () => {
            try {
                console.log('Actualizando tasas de inflación...');
                await this.getCurrentRates();
                console.log('Tasas de inflación actualizadas');
            } catch (error) {
                console.error('Error actualizando tasas diarias:', error);
            }
        });
    }
}

module.exports = new InflationService(); 