const axios = require('axios');
const crypto = require('crypto');
const cron = require('node-cron');
const { BankAccount, BankTransaction, Sale, BankReconciliation } = require('../../config/database');

class BankingService {
    constructor() {
        // Configuración de APIs bancarias
        this.bankAPIs = {
            santander: {
                baseUrl: 'https://api.santander.com.ar/v1',
                clientId: process.env.SANTANDER_CLIENT_ID,
                clientSecret: process.env.SANTANDER_CLIENT_SECRET
            },
            galicia: {
                baseUrl: 'https://api.bancogalicia.com.ar/v1',
                clientId: process.env.GALICIA_CLIENT_ID,
                clientSecret: process.env.GALICIA_CLIENT_SECRET
            },
            bbva: {
                baseUrl: 'https://api.bbva.com.ar/v1',
                clientId: process.env.BBVA_CLIENT_ID,
                clientSecret: process.env.BBVA_CLIENT_SECRET
            },
            macro: {
                baseUrl: 'https://api.macro.com.ar/v1',
                clientId: process.env.MACRO_CLIENT_ID,
                clientSecret: process.env.MACRO_CLIENT_SECRET
            },
            nacion: {
                baseUrl: 'https://api.bna.com.ar/v1',
                clientId: process.env.BNA_CLIENT_ID,
                clientSecret: process.env.BNA_CLIENT_SECRET
            },
            interbanking: {
                baseUrl: 'https://api.interbanking.com.ar/v2',
                apiKey: process.env.INTERBANKING_API_KEY,
                secret: process.env.INTERBANKING_SECRET
            }
        };

        this.supportedBanks = [
            { code: 'santander', name: 'Banco Santander', logo: '/logos/santander.png' },
            { code: 'galicia', name: 'Banco Galicia', logo: '/logos/galicia.png' },
            { code: 'bbva', name: 'BBVA Argentina', logo: '/logos/bbva.png' },
            { code: 'macro', name: 'Banco Macro', logo: '/logos/macro.png' },
            { code: 'nacion', name: 'Banco Nación', logo: '/logos/bna.png' },
            { code: 'ciudad', name: 'Banco Ciudad', logo: '/logos/ciudad.png' },
            { code: 'provincia', name: 'Banco Provincia', logo: '/logos/provincia.png' },
            { code: 'icbc', name: 'ICBC', logo: '/logos/icbc.png' },
            { code: 'hsbc', name: 'HSBC', logo: '/logos/hsbc.png' },
            { code: 'itau', name: 'Banco Itaú', logo: '/logos/itau.png' }
        ];

        this.initializeScheduledTasks();
    }

    // Obtener bancos soportados
    getSupportedBanks() {
        return this.supportedBanks;
    }

    // Conectar cuenta bancaria
    async connectBankAccount(bankData) {
        try {
            const { bankCode, accountNumber, accountType, credentials, userId } = bankData;
            
            // Validar que el banco esté soportado
            const bank = this.supportedBanks.find(b => b.code === bankCode);
            if (!bank) {
                throw new Error('Banco no soportado');
            }

            // Cifrar credenciales
            const encryptedCredentials = this.encryptCredentials(credentials);

            // Crear registro de cuenta bancaria
            const bankAccount = await BankAccount.create({
                user_id: userId,
                bank_code: bankCode,
                bank_name: bank.name,
                account_number: this.maskAccountNumber(accountNumber),
                account_type: accountType, // 'checking', 'savings', 'credit'
                encrypted_credentials: encryptedCredentials,
                is_active: true,
                last_sync: null,
                created_at: new Date()
            });

            // Realizar primera sincronización
            const syncResult = await this.syncBankAccount(bankAccount.id);

            return {
                success: true,
                data: {
                    accountId: bankAccount.id,
                    bankName: bank.name,
                    accountNumber: bankAccount.account_number,
                    syncResult
                }
            };
        } catch (error) {
            console.error('Error conectando cuenta bancaria:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Sincronizar cuenta bancaria
    async syncBankAccount(accountId) {
        try {
            const account = await BankAccount.findByPk(accountId);
            if (!account) {
                throw new Error('Cuenta bancaria no encontrada');
            }

            console.log(`Sincronizando cuenta ${account.bank_code} - ${account.account_number}`);

            // Desencriptar credenciales
            const credentials = this.decryptCredentials(account.encrypted_credentials);

            // Obtener transacciones según el banco
            let transactions = [];
            switch (account.bank_code) {
                case 'santander':
                    transactions = await this.getSantanderTransactions(credentials, account);
                    break;
                case 'galicia':
                    transactions = await this.getGaliciaTransactions(credentials, account);
                    break;
                case 'bbva':
                    transactions = await this.getBBVATransactions(credentials, account);
                    break;
                case 'interbanking':
                    transactions = await this.getInterbankingTransactions(credentials, account);
                    break;
                default:
                    transactions = await this.getGenericBankTransactions(credentials, account);
            }

            // Procesar y guardar transacciones
            let newTransactions = 0;
            for (const transaction of transactions) {
                const existing = await BankTransaction.findOne({
                    where: {
                        bank_account_id: account.id,
                        transaction_id: transaction.id,
                        transaction_date: transaction.date
                    }
                });

                if (!existing) {
                    await BankTransaction.create({
                        bank_account_id: account.id,
                        transaction_id: transaction.id,
                        transaction_date: transaction.date,
                        description: transaction.description,
                        amount: transaction.amount,
                        balance: transaction.balance,
                        transaction_type: transaction.type, // 'credit', 'debit'
                        category: transaction.category,
                        reference: transaction.reference,
                        raw_data: JSON.stringify(transaction.raw),
                        created_at: new Date()
                    });
                    newTransactions++;
                }
            }

            // Actualizar última sincronización
            await account.update({
                last_sync: new Date(),
                sync_status: 'success'
            });

            console.log(`Sincronización completa: ${newTransactions} nuevas transacciones`);

            // Ejecutar conciliación automática
            const reconciliationResult = await this.performAutoReconciliation(account.id);

            return {
                success: true,
                data: {
                    newTransactions,
                    totalTransactions: transactions.length,
                    reconciliationResult
                }
            };
        } catch (error) {
            console.error('Error sincronizando cuenta:', error);
            
            // Actualizar estado de error
            await BankAccount.update(
                { sync_status: 'error', sync_error: error.message },
                { where: { id: accountId } }
            );

            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener transacciones de Santander
    async getSantanderTransactions(credentials, account) {
        try {
            const auth = await this.authenticateSantander(credentials);
            const response = await axios.get(
                `${this.bankAPIs.santander.baseUrl}/accounts/${account.account_number}/transactions`,
                {
                    headers: {
                        'Authorization': `Bearer ${auth.access_token}`,
                        'Content-Type': 'application/json'
                    },
                    params: {
                        from: this.getDateDaysAgo(30),
                        to: new Date().toISOString().split('T')[0]
                    }
                }
            );

            return response.data.transactions.map(tx => ({
                id: tx.transactionId,
                date: new Date(tx.valueDate),
                description: tx.description,
                amount: parseFloat(tx.amount),
                balance: parseFloat(tx.balance),
                type: tx.amount > 0 ? 'credit' : 'debit',
                category: this.categorizeTransaction(tx.description),
                reference: tx.reference,
                raw: tx
            }));
        } catch (error) {
            console.error('Error obteniendo transacciones Santander:', error);
            throw error;
        }
    }

    // Obtener transacciones de Galicia
    async getGaliciaTransactions(credentials, account) {
        try {
            const auth = await this.authenticateGalicia(credentials);
            const response = await axios.get(
                `${this.bankAPIs.galicia.baseUrl}/accounts/${account.account_number}/movements`,
                {
                    headers: {
                        'Authorization': `Bearer ${auth.token}`,
                        'X-API-Key': this.bankAPIs.galicia.clientId
                    },
                    params: {
                        desde: this.getDateDaysAgo(30),
                        hasta: new Date().toISOString().split('T')[0]
                    }
                }
            );

            return response.data.movimientos.map(mov => ({
                id: mov.id,
                date: new Date(mov.fecha),
                description: mov.concepto,
                amount: parseFloat(mov.importe),
                balance: parseFloat(mov.saldo),
                type: mov.importe > 0 ? 'credit' : 'debit',
                category: this.categorizeTransaction(mov.concepto),
                reference: mov.referencia,
                raw: mov
            }));
        } catch (error) {
            console.error('Error obteniendo transacciones Galicia:', error);
            throw error;
        }
    }

    // Obtener transacciones vía Interbanking (agregador)
    async getInterbankingTransactions(credentials, account) {
        try {
            const signature = this.generateInterbankingSignature(credentials);
            const response = await axios.post(
                `${this.bankAPIs.interbanking.baseUrl}/accounts/transactions`,
                {
                    bank_code: account.bank_code,
                    account_number: account.account_number,
                    credentials: credentials,
                    date_from: this.getDateDaysAgo(30),
                    date_to: new Date().toISOString().split('T')[0]
                },
                {
                    headers: {
                        'X-API-Key': this.bankAPIs.interbanking.apiKey,
                        'X-Signature': signature,
                        'Content-Type': 'application/json'
                    }
                }
            );

            return response.data.transactions.map(tx => ({
                id: tx.id,
                date: new Date(tx.date),
                description: tx.description,
                amount: parseFloat(tx.amount),
                balance: parseFloat(tx.balance),
                type: tx.amount > 0 ? 'credit' : 'debit',
                category: this.categorizeTransaction(tx.description),
                reference: tx.reference,
                raw: tx
            }));
        } catch (error) {
            console.error('Error obteniendo transacciones Interbanking:', error);
            throw error;
        }
    }

    // Conciliación automática
    async performAutoReconciliation(accountId) {
        try {
            const account = await BankAccount.findByPk(accountId);
            if (!account) {
                throw new Error('Cuenta bancaria no encontrada');
            }

            // Obtener transacciones bancarias no conciliadas
            const bankTransactions = await BankTransaction.findAll({
                where: {
                    bank_account_id: accountId,
                    is_reconciled: false,
                    transaction_type: 'credit' // Solo ingresos
                },
                order: [['transaction_date', 'DESC']],
                limit: 100
            });

            // Obtener ventas no conciliadas
            const sales = await Sale.findAll({
                where: {
                    estado_pago: 'pendiente',
                    metodo_pago: ['transferencia', 'deposito', 'mercadopago']
                },
                order: [['fecha', 'DESC']],
                limit: 100
            });

            let reconciliations = [];
            let autoMatched = 0;

            // Algoritmo de conciliación
            for (const bankTx of bankTransactions) {
                const matchingSales = sales.filter(sale => {
                    const amountMatch = Math.abs(bankTx.amount - sale.total) < 0.01;
                    const dateMatch = this.isDateWithinRange(
                        bankTx.transaction_date,
                        sale.fecha,
                        3 // 3 días de tolerancia
                    );
                    const referenceMatch = this.checkReferenceMatch(
                        bankTx.description,
                        sale.id,
                        sale.cliente_nombre
                    );

                    return amountMatch && (dateMatch || referenceMatch);
                });

                if (matchingSales.length === 1) {
                    // Coincidencia exacta
                    const sale = matchingSales[0];
                    
                    const reconciliation = await BankReconciliation.create({
                        bank_account_id: accountId,
                        bank_transaction_id: bankTx.id,
                        sale_id: sale.id,
                        reconciliation_type: 'auto',
                        amount: bankTx.amount,
                        confidence_score: this.calculateConfidenceScore(bankTx, sale),
                        notes: 'Conciliación automática por monto y fecha',
                        created_at: new Date()
                    });

                    // Actualizar estado de transacción y venta
                    await bankTx.update({ is_reconciled: true });
                    await sale.update({ 
                        estado_pago: 'pagado',
                        fecha_pago: bankTx.transaction_date
                    });

                    reconciliations.push(reconciliation);
                    autoMatched++;
                } else if (matchingSales.length > 1) {
                    // Múltiples coincidencias - requiere revisión manual
                    console.log(`Múltiples coincidencias para transacción ${bankTx.id}`);
                }
            }

            console.log(`Conciliación automática completada: ${autoMatched} transacciones conciliadas`);

            return {
                success: true,
                data: {
                    autoMatched,
                    totalProcessed: bankTransactions.length,
                    reconciliations
                }
            };
        } catch (error) {
            console.error('Error en conciliación automática:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Obtener estado de conciliación
    async getReconciliationStatus(accountId) {
        try {
            const account = await BankAccount.findByPk(accountId);
            if (!account) {
                throw new Error('Cuenta bancaria no encontrada');
            }

            // Estadísticas de transacciones
            const totalTransactions = await BankTransaction.count({
                where: { bank_account_id: accountId }
            });

            const reconciledTransactions = await BankTransaction.count({
                where: { 
                    bank_account_id: accountId,
                    is_reconciled: true 
                }
            });

            const pendingTransactions = totalTransactions - reconciledTransactions;

            // Transacciones pendientes de conciliación
            const pendingList = await BankTransaction.findAll({
                where: {
                    bank_account_id: accountId,
                    is_reconciled: false
                },
                order: [['transaction_date', 'DESC']],
                limit: 50
            });

            // Conciliaciones recientes
            const recentReconciliations = await BankReconciliation.findAll({
                where: { bank_account_id: accountId },
                include: [
                    { model: BankTransaction, as: 'transaction' },
                    { model: Sale, as: 'sale' }
                ],
                order: [['created_at', 'DESC']],
                limit: 20
            });

            return {
                success: true,
                data: {
                    account: {
                        id: account.id,
                        bankName: account.bank_name,
                        accountNumber: account.account_number,
                        lastSync: account.last_sync
                    },
                    statistics: {
                        totalTransactions,
                        reconciledTransactions,
                        pendingTransactions,
                        reconciliationRate: totalTransactions > 0 ? 
                            (reconciledTransactions / totalTransactions * 100).toFixed(2) : 0
                    },
                    pendingTransactions: pendingList,
                    recentReconciliations
                }
            };
        } catch (error) {
            console.error('Error obteniendo estado de conciliación:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Conciliación manual
    async manualReconciliation(reconciliationData) {
        try {
            const { bankTransactionId, saleId, notes, userId } = reconciliationData;

            const bankTransaction = await BankTransaction.findByPk(bankTransactionId);
            const sale = await Sale.findByPk(saleId);

            if (!bankTransaction || !sale) {
                throw new Error('Transacción bancaria o venta no encontrada');
            }

            // Crear conciliación manual
            const reconciliation = await BankReconciliation.create({
                bank_account_id: bankTransaction.bank_account_id,
                bank_transaction_id: bankTransactionId,
                sale_id: saleId,
                reconciliation_type: 'manual',
                amount: bankTransaction.amount,
                confidence_score: 100, // Máxima confianza para conciliación manual
                notes: notes || 'Conciliación manual',
                created_by: userId,
                created_at: new Date()
            });

            // Actualizar estado de transacción y venta
            await bankTransaction.update({ is_reconciled: true });
            await sale.update({ 
                estado_pago: 'pagado',
                fecha_pago: bankTransaction.transaction_date
            });

            return {
                success: true,
                data: reconciliation,
                message: 'Conciliación manual completada'
            };
        } catch (error) {
            console.error('Error en conciliación manual:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Programar tareas automáticas
    initializeScheduledTasks() {
        // Sincronizar cuentas cada 2 horas durante horario comercial
        cron.schedule('0 */2 9-18 * * 1-5', async () => {
            console.log('Ejecutando sincronización automática de cuentas bancarias...');
            await this.syncAllAccounts();
        });

        // Conciliación automática cada 4 horas
        cron.schedule('0 */4 * * *', async () => {
            console.log('Ejecutando conciliación automática...');
            await this.runAutoReconciliationForAllAccounts();
        });

        console.log('Tareas automáticas de banking programadas');
    }

    // Sincronizar todas las cuentas activas
    async syncAllAccounts() {
        try {
            const accounts = await BankAccount.findAll({
                where: { is_active: true }
            });

            for (const account of accounts) {
                await this.syncBankAccount(account.id);
                // Esperar 2 segundos entre sincronizaciones para no sobrecargar APIs
                await new Promise(resolve => setTimeout(resolve, 2000));
            }

            console.log(`Sincronización completada para ${accounts.length} cuentas`);
        } catch (error) {
            console.error('Error sincronizando todas las cuentas:', error);
        }
    }

    // Ejecutar conciliación automática para todas las cuentas
    async runAutoReconciliationForAllAccounts() {
        try {
            const accounts = await BankAccount.findAll({
                where: { is_active: true }
            });

            for (const account of accounts) {
                await this.performAutoReconciliation(account.id);
            }

            console.log(`Conciliación automática completada para ${accounts.length} cuentas`);
        } catch (error) {
            console.error('Error ejecutando conciliación automática:', error);
        }
    }

    // Funciones auxiliares
    encryptCredentials(credentials) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipher(algorithm, key);
        
        let encrypted = cipher.update(JSON.stringify(credentials), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        
        return { encrypted, iv: iv.toString('hex') };
    }

    decryptCredentials(encryptedData) {
        const algorithm = 'aes-256-gcm';
        const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
        const decipher = crypto.createDecipher(algorithm, key);
        
        let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return JSON.parse(decrypted);
    }

    maskAccountNumber(accountNumber) {
        if (accountNumber.length <= 4) return accountNumber;
        return '****' + accountNumber.slice(-4);
    }

    getDateDaysAgo(days) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        return date.toISOString().split('T')[0];
    }

    categorizeTransaction(description) {
        const categories = {
            'transferencia': ['transf', 'transfer', 'envio'],
            'deposito': ['deposito', 'deposit', 'ingreso'],
            'pago': ['pago', 'payment', 'cobro'],
            'mercadopago': ['mercadopago', 'mp', 'mercado pago'],
            'comision': ['comision', 'fee', 'cargo'],
            'otros': []
        };

        const desc = description.toLowerCase();
        for (const [category, keywords] of Object.entries(categories)) {
            if (keywords.some(keyword => desc.includes(keyword))) {
                return category;
            }
        }
        return 'otros';
    }

    isDateWithinRange(date1, date2, days) {
        const diffTime = Math.abs(date1 - date2);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= days;
    }

    checkReferenceMatch(description, saleId, clientName) {
        const desc = description.toLowerCase();
        return desc.includes(saleId.toString()) || 
               (clientName && desc.includes(clientName.toLowerCase()));
    }

    calculateConfidenceScore(bankTx, sale) {
        let score = 0;
        
        // Coincidencia exacta de monto
        if (Math.abs(bankTx.amount - sale.total) < 0.01) score += 40;
        
        // Coincidencia de fecha (mismo día)
        if (bankTx.transaction_date.toDateString() === sale.fecha.toDateString()) score += 30;
        
        // Referencia en descripción
        if (this.checkReferenceMatch(bankTx.description, sale.id, sale.cliente_nombre)) score += 30;
        
        return Math.min(score, 100);
    }

    async authenticateSantander(credentials) {
        // Implementar autenticación OAuth2 específica de Santander
        const response = await axios.post(
            `${this.bankAPIs.santander.baseUrl}/oauth/token`,
            {
                grant_type: 'client_credentials',
                client_id: this.bankAPIs.santander.clientId,
                client_secret: this.bankAPIs.santander.clientSecret
            }
        );
        return response.data;
    }

    async authenticateGalicia(credentials) {
        // Implementar autenticación específica de Galicia
        const response = await axios.post(
            `${this.bankAPIs.galicia.baseUrl}/auth/login`,
            {
                username: credentials.username,
                password: credentials.password
            }
        );
        return response.data;
    }

    generateInterbankingSignature(data) {
        return crypto
            .createHmac('sha256', this.bankAPIs.interbanking.secret)
            .update(JSON.stringify(data))
            .digest('hex');
    }

    async getGenericBankTransactions(credentials, account) {
        // Implementación genérica para bancos sin API específica
        // Podría usar screen scraping o archivos CSV
        return [];
    }
}

module.exports = new BankingService();