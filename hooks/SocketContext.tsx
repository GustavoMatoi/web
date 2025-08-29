// contexts/SocketContext.tsx
"use client"
import { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Corrigir a porta para 5000 (mesma do servidor)
    const socketInstance = io('http://localhost:5000', {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      transports: ['websocket'],
    });

    socketInstance.on('connect', () => {
      console.log('🟢 Conectado ao servidor Socket.IO');
      
      // Registrar a plataforma automaticamente ao conectar
      socketInstance.emit('register-platform', 
        { platformId: `web-client-${Date.now()}` }, 
        (response: any) => {
          console.log('Resposta do registro:', response);
        }
      );
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 Desconectado:', reason);
    });

    socketInstance.on('connect_error', (err) => {
      console.error('Erro de conexão:', err.message);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const socket = useContext(SocketContext);
  if (!socket) throw new Error('useSocket must be used within a SocketProvider');
  return socket;
}