import api from './api';

interface PrintTemplate {
  type: 'ticket-b' | 'factura-a' | 'factura-b';
  data: any;
}

interface PrintOptions {
  template: string;
  data: any;
  copies?: number;
  printer?: string;
}

interface PrintResult {
  success: boolean;
  message: string;
  printJob?: string;
}

class PrinterService {
  private availablePrinters: string[] = [];
  private defaultPrinter: string = '';

  // Obtener impresoras disponibles
  async getAvailablePrinters(): Promise<string[]> {
    try {
      const response = await api.get('/impresoras/disponibles');
      this.availablePrinters = response.data.printers || [];
      return this.availablePrinters;
    } catch (error) {
      console.error('Error obteniendo impresoras:', error);
      return [];
    }
  }

  // Configurar impresora por defecto
  setDefaultPrinter(printer: string) {
    this.defaultPrinter = printer;
  }

  // Imprimir ticket no fiscal
  async printTicket(data: any, copies: number = 1): Promise<PrintResult> {
    return this.print({
      template: 'ticket-b',
      data,
      copies,
      printer: this.defaultPrinter
    });
  }

  // Imprimir factura A
  async printFacturaA(data: any, copies: number = 1): Promise<PrintResult> {
    return this.print({
      template: 'factura-a',
      data,
      copies,
      printer: this.defaultPrinter
    });
  }

  // Imprimir factura B
  async printFacturaB(data: any, copies: number = 1): Promise<PrintResult> {
    return this.print({
      template: 'factura-b',
      data,
      copies,
      printer: this.defaultPrinter
    });
  }

  // Función genérica de impresión
  async print(options: PrintOptions): Promise<PrintResult> {
    try {
      const response = await api.post('/impresoras/imprimir', {
        template: options.template,
        data: options.data,
        copies: options.copies || 1,
        printer: options.printer || this.defaultPrinter
      });

      return {
        success: true,
        message: 'Impresión enviada correctamente',
        printJob: response.data.printJob
      };
    } catch (error: any) {
      console.error('Error de impresión:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Error al imprimir'
      };
    }
  }

  // Simular impresión para desarrollo
  async simulatePrint(template: string, data: any): Promise<PrintResult> {
    console.log(`[SIMULACIÓN IMPRESIÓN] Plantilla: ${template}`);
    console.log('Datos:', data);
    
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: `Impresión simulada: ${template}`,
          printJob: `sim-${Date.now()}`
        });
      }, 1000);
    });
  }

  // Verificar estado de impresora
  async checkPrinterStatus(printer?: string): Promise<boolean> {
    try {
      const response = await api.get(`/impresoras/estado/${printer || this.defaultPrinter}`);
      return response.data.online;
    } catch (error) {
      console.error('Error verificando estado impresora:', error);
      return false;
    }
  }

  // Obtener configuración de impresión
  async getPrintConfig() {
    try {
      const response = await api.get('/impresoras/configuracion');
      return response.data;
    } catch (error) {
      console.error('Error obteniendo configuración impresoras:', error);
      return null;
    }
  }
}

export const printerService = new PrinterService();
export type { PrintTemplate, PrintOptions, PrintResult }; 