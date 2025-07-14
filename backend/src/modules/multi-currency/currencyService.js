const axios = require('axios');
const cron = require('node-cron');
const { Currency, ExchangeRate, Sale, Product } = require('../../config/database');

class CurrencyService {
    constructor() {
        // APIs de cotizaciones
        this.exchangeAPIs = {
            bcra: 'https://api.estadisticasbcra.com/usd_of',
            dolarapi: 'https://api.dolarapi.com/v1/dolares',
            exchangerate: `https://v6.exchangerate-api.com/v6/${process.env.EXCHANGE_API_KEY}/latest/USD`,
            fixer: `https://api.fixer.io/latest?access_key=${process.env.FIXER_API_KEY}`,
            currencylayer: `https://api.currencylayer.com/live?access_key=${process.env.CURRENCYLAYER_API_KEY}`
        };

        this.supportedCurrencies = [
            { code: 'ARS', name: 'Peso Argentino', symbol: '$', isBase: true },
            { code: 'USD', name: 'Dólar Estadounidense', symbol: 'US$', isBase: false },
            { code: 'EUR', name: 'Euro', symbol: '€', isBase: false },
            { code: 'BRL', name: 'Real Brasileño', symbol: 'R$', isBase: false },
            { code: 'UYU', name: 'Peso Uruguayo', symbol: '$U', isBase: false },
            { code: 'CLP', name: 'Peso Chileno', symbol: 'CLP$', isBase: false }
        ];

        this.initializeCurrencies();
        this.scheduleRateUpdates();
    }

    // Inicializar monedas en la base de datos
    async initializeCurrencies() {
        try {
            for (const currency of this.supportedCurrencies) {
                await Currency.findOrCreate({
                    where: { code: currency.code },
                    defaults: {
                        code: currency.code,
                        name: currency.name,
                        symbol: currency.symbol,
                        is_base: currency.isBase,
                        is_active: true,
                        decimal_places: currency.code === 'CLP' ? 0 : 2
                    }
                });
            }
            console.log('Monedas inicializadas correctamente');
        } catch (error) {
            console.error('Error inicializando monedas:', error);
        }
    }

    // Obtener todas las monedas activas
    async getActiveCurrencies() {
        try {
            const currencies = await Currency.findAll({
                where: { is_active: true },
                order: [['is_base', 'DESC'], ['code', 'ASC']]
            });
            return currencies;
        } catch (error) {
            console.error('Error obteniendo monedas:', error);
            throw error;
        }
    }

    // Obtener cotizaciones actuales
    async getCurrentRates() {
        try {
            const rates = await ExchangeRate.findAll({
                where: {
                    created_at: {
                        [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Últimas 24 horas
                    }
                },
                include: [
                    { model: Currency, as: 'fromCurrency' },
                    { model: Currency, as: 'toCurrency' }
                ],
                order: [['created_at', 'DESC']]
            });

            // Agrupar por par de monedas y obtener la más reciente
            const latestRates = {};
            rates.forEach(rate => {
                const key = `${rate.from_currency}_${rate.to_currency}`;
                if (!latestRates[key] || rate.created_at > latestRates[key].created_at) {
                    latestRates[key] = rate;
                }
            });

            return Object.values(latestRates);
        } catch (error) {
            console.error('Error obteniendo cotizaciones:', error);
            throw error;
        }
    }

    // Actualizar cotizaciones desde APIs externas
    async updateExchangeRates() {
        try {
            console.log('Actualizando cotizaciones...');
            
            // Obtener USD/ARS desde múltiples fuentes
            const usdArsRates = await this.getUSDARSRates();
            
            // Obtener otras monedas vs USD
            const otherRates = await this.getOtherCurrencyRates();
            
            // Guardar todas las cotizaciones
            const allRates = [...usdArsRates, ...otherRates];
            
            for (const rate of allRates) {
                await ExchangeRate.create({
                    from_currency: rate.from,
                    to_currency: rate.to,
                    rate: rate.rate,
                    source: rate.source,
                    created_at: new Date()
                });
            }
            
            console.log(`${allRates.length} cotizaciones actualizadas`);
            return { success: true, count: allRates.length };
        } catch (error) {
            console.error('Error actualizando cotizaciones:', error);
            return { success: false, error: error.message };
        }
    }

    // Obtener cotizaciones USD/ARS específicas para Argentina
    async getUSDARSRates() {
        const rates = [];
        
        try {
            // BCRA Oficial
            const bcraResponse = await axios.get(this.exchangeAPIs.bcra, { timeout: 10000 });
            if (bcraResponse.data && bcraResponse.data.length > 0) {
                const bcraRate = bcraResponse.data[bcraResponse.data.length - 1].v;
                rates.push({
                    from: 'USD',
                    to: 'ARS',
                    rate: bcraRate,
                    source: 'BCRA_OFICIAL'
                });
            }
        } catch (error) {
            console.error('Error obteniendo cotización BCRA:', error);
        }

        try {
            // DolarAPI - Múltiples cotizaciones
            const dolarResponse = await axios.get(this.exchangeAPIs.dolarapi, { timeout: 10000 });
            if (dolarResponse.data && Array.isArray(dolarResponse.data)) {
                for (const dolar of dolarResponse.data) {
                    rates.push({
                        from: 'USD',
                        to: 'ARS',
                        rate: dolar.venta || dolar.compra,
                        source: `DOLAR_${dolar.casa.toUpperCase()}`
                    });
                }
            }
        } catch (error) {
            console.error('Error obteniendo cotizaciones DolarAPI:', error);
        }

        return rates;
    }

    // Obtener cotizaciones de otras monedas
    async getOtherCurrencyRates() {
        const rates = [];
        
        try {
            // ExchangeRate-API
            if (process.env.EXCHANGE_API_KEY) {
                const response = await axios.get(this.exchangeAPIs.exchangerate, { timeout: 10000 });
                if (response.data && response.data.conversion_rates) {
                    const conversionRates = response.data.conversion_rates;
                    
                    // Convertir a ARS usando USD como base
                    const usdToArs = await this.getLatestRate('USD', 'ARS');
                    
                    for (const [currency, rate] of Object.entries(conversionRates)) {
                        if (['EUR', 'BRL', 'UYU', 'CLP'].includes(currency)) {
                            // Guardar cotización directa vs USD
                            rates.push({
                                from: 'USD',
                                to: currency,
                                rate: rate,
                                source: 'EXCHANGERATE_API'
                            });
                            
                            // Calcular cotización vs ARS
                            if (usdToArs) {
                                rates.push({
                                    from: currency,
                                    to: 'ARS',
                                    rate: rate * usdToArs,
                                    source: 'CALCULATED'
                                });
                            }
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error obteniendo cotizaciones ExchangeRate-API:', error);
        }

        return rates;
    }

    // Obtener cotización más reciente entre dos monedas
    async getLatestRate(fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) return 1;
            
            const rate = await ExchangeRate.findOne({
                where: {
                    from_currency: fromCurrency,
                    to_currency: toCurrency
                },
                order: [['created_at', 'DESC']]
            });
            
            if (rate) return rate.rate;
            
            // Intentar obtener la cotización inversa
            const inverseRate = await ExchangeRate.findOne({
                where: {
                    from_currency: toCurrency,
                    to_currency: fromCurrency
                },
                order: [['created_at', 'DESC']]
            });
            
            if (inverseRate) return 1 / inverseRate.rate;
            
            // Si no hay cotización directa, intentar conversión a través de USD
            if (fromCurrency !== 'USD' && toCurrency !== 'USD') {
                const fromUsdRate = await this.getLatestRate(fromCurrency, 'USD');
                const toUsdRate = await this.getLatestRate('USD', toCurrency);
                
                if (fromUsdRate && toUsdRate) {
                    return fromUsdRate * toUsdRate;
                }
            }
            
            return null;
        } catch (error) {
            console.error('Error obteniendo cotización:', error);
            return null;
        }
    }

    // Convertir monto entre monedas
    async convertAmount(amount, fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) {
                return {
                    success: true,
                    originalAmount: amount,
                    convertedAmount: amount,
                    rate: 1,
                    fromCurrency,
                    toCurrency
                };
            }
            
            const rate = await this.getLatestRate(fromCurrency, toCurrency);
            
            if (!rate) {
                return {
                    success: false,
                    error: `No se encontró cotización para ${fromCurrency}/${toCurrency}`
                };
            }
            
            const convertedAmount = amount * rate;
            
            return {
                success: true,
                originalAmount: amount,
                convertedAmount: parseFloat(convertedAmount.toFixed(4)),
                rate: rate,
                fromCurrency,
                toCurrency,
                timestamp: new Date()
            };
        } catch (error) {
            console.error('Error convirtiendo monto:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener historial de cotizaciones
    async getRateHistory(fromCurrency, toCurrency, days = 30) {
        try {
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - days);
            
            const rates = await ExchangeRate.findAll({
                where: {
                    from_currency: fromCurrency,
                    to_currency: toCurrency,
                    created_at: {
                        [Op.gte]: startDate
                    }
                },
                order: [['created_at', 'ASC']],
                attributes: ['rate', 'source', 'created_at']
            });
            
            return {
                success: true,
                data: rates,
                period: `${days} días`,
                fromCurrency,
                toCurrency
            };
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener mejores cotizaciones (compra/venta)
    async getBestRates(currency = 'USD') {
        try {
            const rates = await ExchangeRate.findAll({
                where: {
                    from_currency: currency,
                    to_currency: 'ARS',
                    created_at: {
                        [Op.gte]: new Date(Date.now() - 6 * 60 * 60 * 1000) // Últimas 6 horas
                    }
                },
                order: [['created_at', 'DESC']]
            });
            
            if (rates.length === 0) {
                return {
                    success: false,
                    error: 'No hay cotizaciones recientes disponibles'
                };
            }
            
            // Agrupar por fuente y obtener la más reciente de cada una
            const ratesBySource = {};
            rates.forEach(rate => {
                if (!ratesBySource[rate.source] || rate.created_at > ratesBySource[rate.source].created_at) {
                    ratesBySource[rate.source] = rate;
                }
            });
            
            const sortedRates = Object.values(ratesBySource).sort((a, b) => b.rate - a.rate);
            
            return {
                success: true,
                currency,
                bestBuy: sortedRates[0], // Mayor cotización (mejor para comprar pesos)
                bestSell: sortedRates[sortedRates.length - 1], // Menor cotización (mejor para vender pesos)
                allRates: sortedRates,
                lastUpdate: new Date()
            };
        } catch (error) {
            console.error('Error obteniendo mejores cotizaciones:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Calcular impuestos argentinos (PAÍS + Ganancias)
    calculateArgentineTaxes(usdAmount, includeCountryTax = true, includeIncomeTax = true) {
        const countryTaxRate = 0.30; // 30% Impuesto PAÍS
        const incomeTaxRate = 0.45; // 45% Percepción Ganancias
        
        let totalTaxRate = 0;
        let taxes = {
            base: usdAmount,
            countryTax: 0,
            incomeTax: 0,
            total: usdAmount
        };
        
        if (includeCountryTax) {
            taxes.countryTax = usdAmount * countryTaxRate;
            totalTaxRate += countryTaxRate;
        }
        
        if (includeIncomeTax) {
            taxes.incomeTax = usdAmount * incomeTaxRate;
            totalTaxRate += incomeTaxRate;
        }
        
        taxes.total = usdAmount * (1 + totalTaxRate);
        taxes.totalTaxRate = totalTaxRate;
        
        return taxes;
    }

    // Programar actualizaciones automáticas
    scheduleRateUpdates() {
        // Actualizar cada 30 minutos durante horario bancario (9-18 hs)
        cron.schedule('*/30 9-18 * * 1-5', async () => {
            console.log('Actualizando cotizaciones automáticamente...');
            await this.updateExchangeRates();
        });
        
        // Actualización cada 2 horas fuera del horario bancario
        cron.schedule('0 */2 * * *', async () => {
            console.log('Actualizando cotizaciones (horario extendido)...');
            await this.updateExchangeRates();
        });
        
        console.log('Actualizaciones automáticas de cotizaciones programadas');
    }

    // Formatear monto con símbolo de moneda
    formatAmount(amount, currencyCode) {
        const currency = this.supportedCurrencies.find(c => c.code === currencyCode);
        if (!currency) return amount.toString();
        
        const decimalPlaces = currency.code === 'CLP' ? 0 : 2;
        const formattedAmount = parseFloat(amount).toLocaleString('es-AR', {
            minimumFractionDigits: decimalPlaces,
            maximumFractionDigits: decimalPlaces
        });
        
        return `${currency.symbol} ${formattedAmount}`;
    }

    // Obtener resumen de cotizaciones para dashboard
    async getDashboardSummary() {
        try {
            const summary = {
                lastUpdate: new Date(),
                rates: {}
            };
            
            // Cotizaciones principales
            const mainCurrencies = ['USD', 'EUR', 'BRL'];
            
            for (const currency of mainCurrencies) {
                const rate = await this.getLatestRate(currency, 'ARS');
                const bestRates = await this.getBestRates(currency);
                
                summary.rates[currency] = {
                    official: rate,
                    best: bestRates.success ? bestRates.bestBuy : null,
                    spread: bestRates.success ? 
                        ((bestRates.bestBuy.rate - bestRates.bestSell.rate) / bestRates.bestSell.rate * 100) : 0
                };
            }
            
            return {
                success: true,
                data: summary
            };
        } catch (error) {
            console.error('Error obteniendo resumen de cotizaciones:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = new CurrencyService(); 