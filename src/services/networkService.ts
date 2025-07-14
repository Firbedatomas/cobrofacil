import axios from 'axios';

// Configuración de red
interface NetworkInfo {
  ipLocal: string;
  hostname: string;
  platform: string;
  arch: string;
  puerto: number;
  urlsAcceso: string[];
  interfaces: Record<string, {
    ip: string;
    netmask: string;
    mac: string;
  }>;
}

interface ConnectivityTest {
  conectividad: boolean;
  ipLocal: string;
  puerto: number;
  status: string;
  error?: string;
}

class NetworkService {
  private baseURL: string;
  private serverIP: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectInterval: number = 5000; // 5 segundos

  constructor() {
    // Detectar URL base automáticamente
    this.baseURL = this.detectBaseURL();
    this.initializeConnection();
  }

  /**
   * Detectar URL base del servidor
   */
  private detectBaseURL(): string {
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    
    // Si estamos en localhost, usar configuración por defecto
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Si estamos en otra IP, asumir que el backend está en puerto 3000
    return `${protocol}//${hostname}:3000`;
  }

  /**
   * Inicializar conexión con el servidor
   */
  private async initializeConnection(): Promise<void> {
    try {
      await this.ping();
      this.isConnected = true;
      console.log('✅ Conexión con servidor establecida');
    } catch (error) {
      console.warn('⚠️ No se pudo conectar con el servidor inicialmente');
      this.startReconnectionLoop();
    }
  }

  /**
   * Ping al servidor para verificar conectividad
   */
  async ping(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseURL}/api/network/ping`, {
        timeout: 5000
      });
      
      if (response.data.success) {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        return true;
      }
      
      return false;
    } catch (error) {
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Obtener información de red del servidor
   */
  async getNetworkInfo(): Promise<NetworkInfo> {
    try {
      const response = await axios.get(`${this.baseURL}/api/network/info`, {
        timeout: 10000
      });
      
      if (response.data.success) {
        this.serverIP = response.data.data.ipLocal;
        return response.data.data;
      }
      
      throw new Error('No se pudo obtener información de red');
    } catch (error) {
      console.error('Error obteniendo información de red:', error);
      throw error;
    }
  }

  /**
   * Probar conectividad con el servidor
   */
  async testConnectivity(): Promise<ConnectivityTest> {
    try {
      const response = await axios.get(`${this.baseURL}/api/network/connectivity`, {
        timeout: 10000
      });
      
      return response.data.data;
    } catch (error) {
      console.error('Error probando conectividad:', error);
      throw error;
    }
  }

  /**
   * Enviar test de conectividad desde el cliente
   */
  async sendConnectivityTest(): Promise<any> {
    try {
      const clientInfo = {
        clientIP: this.getClientIP(),
        clientPort: window.location.port || '3002',
        timestamp: new Date().toISOString()
      };

      const response = await axios.post(
        `${this.baseURL}/api/network/test`, 
        clientInfo,
        { timeout: 10000 }
      );
      
      return response.data.data;
    } catch (error) {
      console.error('Error enviando test de conectividad:', error);
      throw error;
    }
  }

  /**
   * Obtener IP del cliente (estimación)
   */
  private getClientIP(): string {
    // En un navegador, no podemos obtener la IP directamente
    // Devolvemos la IP del hostname actual
    return window.location.hostname;
  }

  /**
   * Iniciar loop de reconexión
   */
  private startReconnectionLoop(): void {
    const attemptReconnection = async () => {
      if (this.reconnectAttempts >= this.maxReconnectAttempts) {
        console.error('❌ Máximo número de intentos de reconexión alcanzado');
        return;
      }

      this.reconnectAttempts++;
      console.log(`🔄 Intento de reconexión ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

      try {
        await this.ping();
        console.log('✅ Reconexión exitosa');
        this.isConnected = true;
        this.reconnectAttempts = 0;
      } catch (error) {
        console.warn(`⚠️ Reconexión fallida. Reintentando en ${this.reconnectInterval / 1000} segundos...`);
        setTimeout(attemptReconnection, this.reconnectInterval);
      }
    };

    setTimeout(attemptReconnection, this.reconnectInterval);
  }

  /**
   * Configurar axios para usar la URL base detectada
   */
  configureAxiosDefaults(): void {
    axios.defaults.baseURL = this.baseURL;
    axios.defaults.timeout = 10000;
    axios.defaults.headers.common['Content-Type'] = 'application/json';
    
    // Interceptor para manejar errores de red
    axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
          console.warn('⚠️ Error de red detectado, iniciando reconexión...');
          this.isConnected = false;
          this.startReconnectionLoop();
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Obtener estado de conexión
   */
  getConnectionStatus(): {
    connected: boolean;
    serverIP: string | null;
    baseURL: string;
    reconnectAttempts: number;
  } {
    return {
      connected: this.isConnected,
      serverIP: this.serverIP,
      baseURL: this.baseURL,
      reconnectAttempts: this.reconnectAttempts
    };
  }

  /**
   * Actualizar URL base del servidor
   */
  updateBaseURL(newBaseURL: string): void {
    this.baseURL = newBaseURL;
    this.configureAxiosDefaults();
    console.log(`🔄 URL base actualizada a: ${newBaseURL}`);
  }

  /**
   * Configurar para servidor específico
   */
  async configureForServer(serverIP: string, serverPort: number = 3000): Promise<boolean> {
    const newBaseURL = `http://${serverIP}:${serverPort}`;
    
    try {
      // Probar conectividad con el nuevo servidor
      const testURL = `${newBaseURL}/api/network/ping`;
      await axios.get(testURL, { timeout: 5000 });
      
      // Si funciona, actualizar configuración
      this.updateBaseURL(newBaseURL);
      this.serverIP = serverIP;
      this.isConnected = true;
      
      console.log(`✅ Configurado para servidor: ${serverIP}:${serverPort}`);
      return true;
    } catch (error) {
      console.error(`❌ No se pudo conectar al servidor: ${serverIP}:${serverPort}`, error);
      return false;
    }
  }

  /**
   * Escanear red local en busca del servidor
   */
  async scanLocalNetwork(): Promise<string[]> {
    const foundServers: string[] = [];
    const clientIP = this.getClientIP();
    
    // Obtener base de IP (ej: 192.168.1.x)
    const ipParts = clientIP.split('.');
    if (ipParts.length !== 4) {
      console.warn('No se pudo determinar la base de IP para escaneo');
      return foundServers;
    }
    
    const ipBase = `${ipParts[0]}.${ipParts[1]}.${ipParts[2]}`;
    
    // Escanear IPs comunes (1-254)
    const promises = [];
    for (let i = 1; i <= 254; i++) {
      const targetIP = `${ipBase}.${i}`;
      promises.push(this.testServerAt(targetIP));
    }
    
    const results = await Promise.allSettled(promises);
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        foundServers.push(`${ipBase}.${index + 1}`);
      }
    });
    
    return foundServers;
  }

  /**
   * Probar servidor en IP específica
   */
  private async testServerAt(ip: string): Promise<boolean> {
    try {
      const testURL = `http://${ip}:3000/api/network/ping`;
      await axios.get(testURL, { timeout: 2000 });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instancia singleton del servicio de red
const networkService = new NetworkService();

export default networkService;
export type { NetworkInfo, ConnectivityTest }; 