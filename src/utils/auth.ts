// Utilidades para manejo de autenticación MEJORADAS

// Función para limpiar completamente la autenticación
export const clearAllAuth = (): void => {
  // Limpiar localStorage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('authTimestamp');
  
  // Limpiar sessionStorage también por si acaso
  sessionStorage.removeItem('authToken');
  sessionStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('currentUser');
  sessionStorage.removeItem('authTimestamp');
  
  // Limpiar cualquier cookie de autenticación
  document.cookie.split(";").forEach((c) => {
    const eqPos = c.indexOf("=");
    const name = eqPos > -1 ? c.substr(0, eqPos) : c;
    document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
  });
  
  console.log('🧹 Todas las sesiones han sido limpiadas');
};

// Función para forzar logout completo
export const forceLogout = (): void => {
  clearAllAuth();
  
  // Recargar la página para asegurar que se reinicie el estado
  window.location.reload();
};

// Función para verificar el estado de autenticación básico
export const checkAuthStatus = (): boolean => {
  const token = localStorage.getItem('authToken');
  const user = localStorage.getItem('user');
  
  return !!(token && user);
};

// Función para verificar si el token está próximo a expirar
export const isTokenExpiring = (): boolean => {
  const timestamp = localStorage.getItem('authTimestamp');
  if (!timestamp) return true;
  
  const loginTime = parseInt(timestamp);
  const now = Date.now();
  const sevenHours = 7 * 60 * 60 * 1000; // 7 horas en ms
  
  return (now - loginTime) > sevenHours;
};

// Función para obtener información del usuario actual
export const getCurrentUserInfo = (): any => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error parsing user info:', error);
    return null;
  }
};

// Función para verificar si el usuario tiene un rol específico
export const hasRole = (requiredRole: string): boolean => {
  const user = getCurrentUserInfo();
  if (!user) return false;
  
  const roleHierarchy: { [key: string]: number } = {
    'ADMIN': 3,
    'SUPERVISOR': 2,
    'CAJERO': 1
  };
  
  const userLevel = roleHierarchy[user.rol] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;
  
  return userLevel >= requiredLevel;
};

// Función para debug del estado de autenticación
export const debugAuthState = (): void => {
  console.log('=== 🔍 ESTADO DE AUTENTICACIÓN ===');
  console.log('📦 localStorage authToken:', localStorage.getItem('authToken'));
  console.log('👤 localStorage user:', localStorage.getItem('user'));
  console.log('⏰ localStorage authTimestamp:', localStorage.getItem('authTimestamp'));
  console.log('🔄 sessionStorage authToken:', sessionStorage.getItem('authToken'));
  console.log('🍪 Cookies:', document.cookie);
  console.log('✅ Auth Status:', checkAuthStatus());
  console.log('⚠️ Token Expiring:', isTokenExpiring());
  console.log('🎭 Current User:', getCurrentUserInfo());
  console.log('==============================');
};

// Función para detectar múltiples pestañas
export const handleMultipleTabsAuth = (): void => {
  // Escuchar cambios en localStorage para sincronizar entre pestañas
  window.addEventListener('storage', (e) => {
    if (e.key === 'authToken') {
      if (e.newValue === null) {
        // Token fue removido en otra pestaña
        console.log('🔄 Sesión cerrada en otra pestaña, sincronizando...');
        window.location.reload();
      } else if (e.oldValue === null && e.newValue) {
        // Token fue agregado en otra pestaña
        console.log('🔄 Sesión iniciada en otra pestaña, sincronizando...');
        window.location.reload();
      }
    }
  });
};

// Función para manejar reconexión automática
export const handleReconnection = (): void => {
  // Escuchar cuando la conexión se recupera
  window.addEventListener('online', () => {
    console.log('🌐 Conexión restaurada, verificando autenticación...');
    // Dar tiempo para que la conexión se estabilice
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  });
  
  // Escuchar cuando se pierde la conexión
  window.addEventListener('offline', () => {
    console.log('📡 Conexión perdida, modo offline');
  });
};

// Función para inicializar utilidades de autenticación
export const initAuthUtils = (): void => {
  handleMultipleTabsAuth();
  handleReconnection();
  
  // Limpiar tokens expirados al inicio
  if (checkAuthStatus() && isTokenExpiring()) {
    console.log('⚠️ Token expirado detectado al iniciar, limpiando...');
    clearAllAuth();
  }
};

// Función para validar la estructura del token
export const validateTokenStructure = (token: string): boolean => {
  try {
    // Un JWT debe tener 3 partes separadas por puntos
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Verificar que cada parte sea base64 válida
    for (const part of parts) {
      if (!part || part.length === 0) return false;
    }
    
    return true;
  } catch (error) {
    return false;
  }
};

// Función para obtener la expiración del token (sin verificar signature)
export const getTokenExpiration = (token: string): Date | null => {
  try {
    if (!validateTokenStructure(token)) return null;
    
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (!payload.exp) return null;
    
    return new Date(payload.exp * 1000);
  } catch (error) {
    return null;
  }
};

// Función para verificar si el token está expirado (sin verificar signature)
export const isTokenExpiredLocally = (token: string): boolean => {
  const expiration = getTokenExpiration(token);
  if (!expiration) return true;
  
  return expiration.getTime() < Date.now();
}; 