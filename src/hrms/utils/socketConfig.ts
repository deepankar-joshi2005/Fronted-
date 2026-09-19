// Production-specific socket configuration
export const getSocketConfig = () => {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  if (isProduction) {
    return {
      // Production configuration - prioritize polling over websocket
      transports: ["polling", "websocket"],
      upgrade: false, // Start with polling, don't upgrade immediately
      rememberUpgrade: false,
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      path: "/socket.io/",
      autoConnect: true,
      multiplex: false,
      // Add additional production options
      forceNew: true,
      // Disable some features that might cause issues in production
      pingTimeout: 30000,
      pingInterval: 25000,
    };
  }
  
  // Development configuration
  return {
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
    timeout: 20000,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    path: "/socket.io/",
  };
};

// Test WebSocket connectivity
export const testWebSocketConnection = (url: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const testSocket = new WebSocket(url.replace('http', 'ws') + '/socket.io/?EIO=4&transport=websocket');
    
    const timeout = setTimeout(() => {
      testSocket.close();
      resolve(false);
    }, 5000);
    
    testSocket.onopen = () => {
      clearTimeout(timeout);
      testSocket.close();
      resolve(true);
    };
    
    testSocket.onerror = () => {
      clearTimeout(timeout);
      resolve(false);
    };
  });
};

// Get the best transport method for the current environment
export const getBestTransport = async (baseUrl: string): Promise<string[]> => {
  const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
  
  if (!isProduction) {
    return ["websocket", "polling"];
  }
  
  // Test WebSocket connectivity in production
  try {
    const wsSupported = await testWebSocketConnection(baseUrl);
    if (wsSupported) {
      return ["websocket", "polling"];
    }
  } catch (error) {
    console.warn("WebSocket test failed:", error);
  }
  
  // Fallback to polling only
  return ["polling"];
};
