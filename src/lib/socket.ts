import { io, Socket } from 'socket.io-client';

const URL = 'http://localhost:8000'; // URL do seu backend

// Cria e exporta a instância do Socket.IO
export const socket = io("http://localhost:8000", {
  withCredentials: true,
  autoConnect: false, // Controle manual da conexão
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

// Eventos globais (opcional)
socket.on('connect', () => {
  console.log('🟢 Conectado ao servidor Socket.IO');
});

socket.on('disconnect', () => {
  console.log('🔴 Desconectado do servidor Socket.IO');
});