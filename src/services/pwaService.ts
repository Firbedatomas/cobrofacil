// Servicio PWA para CobroFacil
interface PWAInstallPrompt {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface CacheStatus {
  caches: number;
  static: number;
  dynamic: number;
  total: number;
}

class PWAService {
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private installPrompt: PWAInstallPrompt | null = null;
  private isInstalled: boolean = false;
  private isOnline: boolean = navigator.onLine;
  private updateAvailable: boolean = false;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializePWA();
    this.setupEventListeners();
  }

  /**
   * Inicializar PWA
   */
  private async initializePWA(): Promise<void> {
    try {
      // Verificar soporte para PWA
      if (!this.isPWASupported()) {
        console.warn('⚠️ PWA no soportado en este navegador');
        return;
      }

      // Registrar Service Worker
      await this.registerServiceWorker();

      // Verificar si ya está instalado
      this.checkIfInstalled();

      console.log('✅ PWA inicializado correctamente');
    } catch (error) {
      console.error('❌ Error inicializando PWA:', error);
    }
  }

  /**
   * Verificar soporte para PWA
   */
  private isPWASupported(): boolean {
    return (
      'serviceWorker' in navigator &&
      'caches' in window &&
      'PushManager' in window
    );
  }

  /**
   * Registrar Service Worker
   */
  private async registerServiceWorker(): Promise<void> {
    if (!('serviceWorker' in navigator)) {
      throw new Error('Service Worker no soportado');
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none'
      });

      this.serviceWorkerRegistration = registration;

      // Manejar actualizaciones
      registration.addEventListener('updatefound', () => {
        this.handleServiceWorkerUpdate(registration);
      });

      // Verificar actualizaciones periódicamente
      setInterval(() => {
        registration.update();
      }, 60000); // Cada minuto

      console.log('✅ Service Worker registrado correctamente');
    } catch (error) {
      console.error('❌ Error registrando Service Worker:', error);
      throw error;
    }
  }

  /**
   * Manejar actualizaciones del Service Worker
   */
  private handleServiceWorkerUpdate(registration: ServiceWorkerRegistration): void {
    const newWorker = registration.installing;
    if (!newWorker) return;

    newWorker.addEventListener('statechange', () => {
      if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
        this.updateAvailable = true;
        this.emit('updateAvailable');
        console.log('🔄 Actualización disponible');
      }
    });
  }

  /**
   * Aplicar actualización
   */
  async applyUpdate(): Promise<void> {
    if (!this.serviceWorkerRegistration) return;

    const newWorker = this.serviceWorkerRegistration.waiting;
    if (!newWorker) return;

    // Solicitar al SW que se active
    newWorker.postMessage({ type: 'SKIP_WAITING' });

    // Recargar página cuando el nuevo SW tome control
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload();
    });
  }

  /**
   * Configurar event listeners
   */
  private setupEventListeners(): void {
    // Detectar prompt de instalación
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.installPrompt = e as any;
      this.emit('installPromptAvailable');
      console.log('📱 Prompt de instalación disponible');
    });

    // Detectar instalación
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true;
      this.installPrompt = null;
      this.emit('appInstalled');
      console.log('✅ Aplicación instalada');
    });

    // Detectar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.emit('connectivityChange', { online: true });
      console.log('🌐 Conexión restaurada');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.emit('connectivityChange', { online: false });
      console.log('🔌 Conexión perdida');
    });

    // Escuchar mensajes del Service Worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      this.handleServiceWorkerMessage(event);
    });
  }

  /**
   * Manejar mensajes del Service Worker
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'CONNECTIVITY_CHANGE':
        this.emit('connectivityChange', data);
        break;
      case 'CACHE_UPDATED':
        this.emit('cacheUpdated', data);
        break;
      default:
        console.log('📨 Mensaje del Service Worker:', event.data);
    }
  }

  /**
   * Verificar si la aplicación está instalada
   */
  private checkIfInstalled(): void {
    // Verificar si está ejecutándose como PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    const isIOSStandalone = (window.navigator as any).standalone === true;
    
    this.isInstalled = isStandalone || isIOSStandalone;
  }

  /**
   * Mostrar prompt de instalación
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('⚠️ Prompt de instalación no disponible');
      return false;
    }

    try {
      await this.installPrompt.prompt();
      const result = await this.installPrompt.userChoice;
      
      if (result.outcome === 'accepted') {
        console.log('✅ Usuario aceptó la instalación');
        return true;
      } else {
        console.log('❌ Usuario rechazó la instalación');
        return false;
      }
    } catch (error) {
      console.error('❌ Error mostrando prompt de instalación:', error);
      return false;
    }
  }

  /**
   * Obtener estado del cache
   */
  async getCacheStatus(): Promise<CacheStatus> {
    if (!this.serviceWorkerRegistration) {
      return { caches: 0, static: 0, dynamic: 0, total: 0 };
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        resolve(event.data);
      };

      this.serviceWorkerRegistration?.active?.postMessage(
        { type: 'GET_CACHE_STATUS' },
        [channel.port2]
      );
    });
  }

  /**
   * Limpiar cache
   */
  async clearCache(): Promise<boolean> {
    if (!this.serviceWorkerRegistration) {
      return false;
    }

    return new Promise((resolve) => {
      const channel = new MessageChannel();
      
      channel.port1.onmessage = (event) => {
        resolve(event.data.success);
      };

      this.serviceWorkerRegistration?.active?.postMessage(
        { type: 'CLEAR_CACHE' },
        [channel.port2]
      );
    });
  }

  /**
   * Agregar al home screen (iOS)
   */
  showIOSInstallInstructions(): void {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isIOSStandalone = (window.navigator as any).standalone === true;

    if (isIOS && !isIOSStandalone) {
      this.emit('showIOSInstructions');
    }
  }

  /**
   * Compartir contenido
   */
  async shareContent(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (!('share' in navigator)) {
      console.warn('⚠️ Web Share API no soportada');
      return false;
    }

    try {
      await navigator.share({
        title: data.title || 'CobroFacil POS',
        text: data.text || 'Sistema de punto de venta intuitivo',
        url: data.url || window.location.href
      });

      return true;
    } catch (error) {
      console.error('❌ Error compartiendo:', error);
      return false;
    }
  }

  /**
   * Notificar actualizaciones
   */
  async requestNotificationPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('⚠️ Notificaciones no soportadas');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  /**
   * Mostrar notificación
   */
  async showNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (!await this.requestNotificationPermission()) {
      console.warn('⚠️ Permiso de notificaciones denegado');
      return;
    }

    if (this.serviceWorkerRegistration) {
      await this.serviceWorkerRegistration.showNotification(title, {
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-96x96.png',
        ...options
      });
    }
  }

  /**
   * Sistema de eventos
   */
  private emit(event: string, data?: any): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.forEach(listener => listener(data));
  }

  on(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event) || [];
    eventListeners.push(listener);
    this.listeners.set(event, eventListeners);
  }

  off(event: string, listener: Function): void {
    const eventListeners = this.listeners.get(event) || [];
    const index = eventListeners.indexOf(listener);
    if (index > -1) {
      eventListeners.splice(index, 1);
      this.listeners.set(event, eventListeners);
    }
  }

  /**
   * Getters públicos
   */
  get isAppInstalled(): boolean {
    return this.isInstalled;
  }

  get isAppOnline(): boolean {
    return this.isOnline;
  }

  get isUpdateAvailable(): boolean {
    return this.updateAvailable;
  }

  get isInstallPromptAvailable(): boolean {
    return this.installPrompt !== null;
  }

  get isServiceWorkerSupported(): boolean {
    return 'serviceWorker' in navigator;
  }

  get isPushSupported(): boolean {
    return 'PushManager' in window;
  }

  get isShareSupported(): boolean {
    return 'share' in navigator;
  }

  /**
   * Información del PWA
   */
  getInfo(): object {
    return {
      installed: this.isInstalled,
      online: this.isOnline,
      updateAvailable: this.updateAvailable,
      installPromptAvailable: this.isInstallPromptAvailable,
      serviceWorkerSupported: this.isServiceWorkerSupported,
      pushSupported: this.isPushSupported,
      shareSupported: this.isShareSupported,
      registration: !!this.serviceWorkerRegistration
    };
  }
}

// Instancia singleton
const pwaService = new PWAService();

export default pwaService;
export type { CacheStatus }; 