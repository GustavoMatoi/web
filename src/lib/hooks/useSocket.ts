import { useEffect } from 'react';
import { socket } from '../socket';


export function useSocket() {
  useEffect(() => {
    socket.connect();

    return () => {
      socket.disconnect();
    };
  }, []);

  // Função para upload de arquivo
  const uploadFile = (file: File) => {
    return new Promise((resolve, reject) => {
      if(!socket.connected){
        socket.connect()
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

  return { socket, uploadFile };
}