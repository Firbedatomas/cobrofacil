const express = require('express');
const router = express.Router();
const inflationController = require('./inflationController');
const auth = require('../../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(auth);

/**
 * @route GET /inflation/rates
 * @desc Obtener tasas de inflación actuales
 * @access Private
 */
router.get('/rates', inflationController.getCurrentInflationRates);

/**
 * @route POST /inflation/adjust
 * @desc Aplicar ajuste por inflación a productos específicos
 * @access Private
 * @body {
 *   productIds: number[],
 *   adjustmentType: 'monthly' | 'quarterly' | 'annual' | 'custom',
 *   customRate?: number
 * }
 */
router.post('/adjust', inflationController.adjustProductPrices);

/**
 * @route POST /inflation/adjust/all
 * @desc Aplicar ajuste automático a todos los productos
 * @access Private
 * @body {
 *   excludeCategories?: number[]
 * }
 */
router.post('/adjust/all', inflationController.autoAdjustAllProducts);

/**
 * @route GET /inflation/history
 * @desc Obtener historial de ajustes por inflación
 * @access Private
 * @query {
 *   page?: number,
 *   limit?: number,
 *   startDate?: string,
 *   endDate?: string
 * }
 */
router.get('/history', inflationController.getAdjustmentHistory);

/**
 * @route POST /inflation/simulate
 * @desc Simular ajuste por inflación sin aplicar cambios
 * @access Private
 * @body {
 *   productIds: number[],
 *   adjustmentRate: number
 * }
 */
router.post('/simulate', inflationController.simulateAdjustment);

/**
 * @route POST /inflation/schedule
 * @desc Programar ajuste automático por inflación
 * @access Private
 * @body {
 *   frequency: 'weekly' | 'monthly' | 'quarterly',
 *   categories?: number[],
 *   minThreshold: number
 * }
 */
router.post('/schedule', inflationController.scheduleAutoAdjustment);

module.exports = router; 