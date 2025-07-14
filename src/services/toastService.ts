interface ToastOptions {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

interface ToastHandler {
  (options: ToastOptions): void;
}

class ToastService {
  private handler: ToastHandler | null = null;

  // Registrar el handler desde el componente que maneja las notificaciones
  setHandler(handler: ToastHandler) {
    this.handler = handler;
  }

  // Mostrar toast de éxito
  success(message: string, duration?: number) {
    this.show({
      message,
      type: 'success',
      duration: duration || 3000,
    });
  }

  // Mostrar toast de error
  error(message: string, duration?: number) {
    this.show({
      message,
      type: 'error',
      duration: duration || 5000,
    });
  }

  // Mostrar toast de warning
  warning(message: string, duration?: number) {
    this.show({
      message,
      type: 'warning',
      duration: duration || 4000,
    });
  }

  // Mostrar toast de info
  info(message: string, duration?: number) {
    this.show({
      message,
      type: 'info',
      duration: duration || 3000,
    });
  }

  // Mostrar toast genérico
  show(options: ToastOptions) {
    if (this.handler) {
      this.handler(options);
    } else {
      console.warn('ToastService: No handler registered');
      // Fallback a console para desarrollo
      console.log(`[${options.type?.toUpperCase()}] ${options.message}`);
    }
  }
}

export const toastService = new ToastService();
export type { ToastOptions, ToastHandler }; 