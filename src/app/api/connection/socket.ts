// src/hooks/useSocket.ts
import { socket } from '@/lib/socket';
import { useEffect } from 'react';

export function useSocket() {
  // Connect/disconnect automatically
  useEffect(() => {
    console.log("Initializing socket connection...");
    socket.connect();

    return () => {
      console.log("Cleaning up socket connection...");
      socket.disconnect();
    };
  }, []);

  const uploadFile = (file: File) => {
    return new Promise((resolve, reject) => {
      if (!socket.connected) {
        return reject("Socket not connected");
      }

      const reader = new FileReader();
      
      reader.onload = (event) => {
        socket.emit('upload', {
          name: file.name,
          data: event.target?.result as ArrayBuffer,
        }, (response: any) => {
          if (response.status === 'success') {
            resolve(response);
          } else {
            reject(response.message);
          }
        });
      };

      reader.onerror = () => reject('Erro ao ler arquivo');
      reader.readAsArrayBuffer(file);
    });
  };

  return { 
    socket, 
    uploadFile,
    isConnected: socket.connected 
  };
}