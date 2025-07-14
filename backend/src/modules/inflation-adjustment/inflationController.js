const { InflationRate, Product, Sale } = require('../../config/database');
const inflationService = require('../../services/inflationService');

class InflationController {
    // Obtener índices de inflación actuales
    async getCurrentInflationRates(req, res) {
        try {
            const rates = await inflationService.getCurrentRates();
            res.json({
                success: true,
                data: rates
            });
        } catch (error) {
            console.error('Error obteniendo índices de inflación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener índices de inflación',
                error: error.message
            });
        }
    }

    // Aplicar ajuste por inflación a productos
    async adjustProductPrices(req, res) {
        try {
            const { productIds, adjustmentType, customRate } = req.body;
            
            let adjustmentRate;
            if (adjustmentType === 'custom') {
                adjustmentRate = customRate;
            } else {
                const rates = await inflationService.getCurrentRates();
                adjustmentRate = rates[adjustmentType] || rates.monthly;
            }

            const adjustedProducts = await inflationService.adjustProductPrices(
                productIds, 
                adjustmentRate
            );

            res.json({
                success: true,
                data: {
                    adjustmentRate,
                    adjustedProducts,
                    message: `Se ajustaron ${adjustedProducts.length} productos con una tasa del ${adjustmentRate}%`
                }
            });
        } catch (error) {
            console.error('Error ajustando precios:', error);
            res.status(500).json({
                success: false,
                message: 'Error al ajustar precios por inflación',
                error: error.message
            });
        }
    }

    // Aplicar ajuste automático a todas las categorías
    async autoAdjustAllProducts(req, res) {
        try {
            const { excludeCategories = [] } = req.body;
            
            const rates = await inflationService.getCurrentRates();
            const monthlyRate = rates.monthly;

            const adjustedProducts = await inflationService.autoAdjustAllProducts(
                monthlyRate,
                excludeCategories
            );

            // Registrar el ajuste en historial
            await inflationService.recordAdjustment({
                type: 'auto_full',
                rate: monthlyRate,
                productCount: adjustedProducts.length,
                excludedCategories: excludeCategories,
                userId: req.user.id
            });

            res.json({
                success: true,
                data: {
                    adjustmentRate: monthlyRate,
                    adjustedProducts: adjustedProducts.length,
                    message: `Ajuste automático aplicado a ${adjustedProducts.length} productos`
                }
            });
        } catch (error) {
            console.error('Error en ajuste automático:', error);
            res.status(500).json({
                success: false,
                message: 'Error en ajuste automático por inflación',
                error: error.message
            });
        }
    }

    // Obtener historial de ajustes
    async getAdjustmentHistory(req, res) {
        try {
            const { page = 1, limit = 20, startDate, endDate } = req.query;
            
            const history = await inflationService.getAdjustmentHistory({
                page: parseInt(page),
                limit: parseInt(limit),
                startDate,
                endDate
            });

            res.json({
                success: true,
                data: history
            });
        } catch (error) {
            console.error('Error obteniendo historial:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener historial de ajustes',
                error: error.message
            });
        }
    }

    // Simular ajuste antes de aplicar
    async simulateAdjustment(req, res) {
        try {
            const { productIds, adjustmentRate } = req.body;
            
            const simulation = await inflationService.simulateAdjustment(
                productIds,
                adjustmentRate
            );

            res.json({
                success: true,
                data: simulation
            });
        } catch (error) {
            console.error('Error en simulación:', error);
            res.status(500).json({
                success: false,
                message: 'Error al simular ajuste',
                error: error.message
            });
        }
    }

    // Programar ajuste automático
    async scheduleAutoAdjustment(req, res) {
        try {
            const { frequency, categories, minThreshold } = req.body;
            
            const schedule = await inflationService.scheduleAutoAdjustment({
                frequency, // 'monthly', 'quarterly', 'weekly'
                categories,
                minThreshold,
                userId: req.user.id
            });

            res.json({
                success: true,
                data: schedule,
                message: 'Ajuste automático programado exitosamente'
            });
        } catch (error) {
            console.error('Error programando ajuste:', error);
            res.status(500).json({
                success: false,
                message: 'Error al programar ajuste automático',
                error: error.message
            });
        }
    }
}

module.exports = new InflationController(); 