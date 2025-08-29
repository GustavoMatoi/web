import React, { useState } from "react";
import HandDetection from "./HandDetection";
import { useTransfer } from "../../hooks/TransferContext";
import { useSocket } from "../../hooks/SocketContext";

interface ModalProps {
  onClose: () => void;
  imageUrl: string;
}

export default function Modal({ onClose, imageUrl }: ModalProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [uploading, setUploading] = useState(false);

  const socket = useSocket();
  console.log("Modal renderizado com URL:", imageUrl);

  const handleUpload = async () => {
    if (uploading) return;
    setUploading(true);

    try {
      // 1. Verifica conexão
      if (!socket.connected) {
        console.log('Socket não conectado - reconectando...');
        socket.connect();
        // Aguarda um pouco para a conexão
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log("Iniciando upload da imagem:", imageUrl);

      // 2. Busca a imagem e converte para buffer
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const fileName = imageUrl.split('/').pop() || `upload-${Date.now()}.jpg`;

      console.log("Enviando arquivo:", fileName, "Tamanho:", arrayBuffer.byteLength);

      // 3. Envia via Socket.IO com timeout
      const uploadResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Servidor não respondeu em 30s'));
        }, 30000);

        socket.emit('upload', {
          name: fileName,
          data: arrayBuffer // Envia ArrayBuffer diretamente
        }, (response: any) => {
          clearTimeout(timeout);
          console.log("Resposta do servidor:", response);
          
          if (response?.status === 'success') {
            resolve(response);
          } else {
            reject(new Error(response?.message || 'Erro no servidor'));
          }
        });
      });

      console.log('Upload concluído:', uploadResult);
      alert('Upload realizado com sucesso!');
      
    } catch (error) {
      console.error('Erro no upload:', error);
      alert(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setUploading(false);
    }
  };

  // Função para testar transferência de arquivo
  const handleTransfer = async () => {
    try {
      const fileName = imageUrl.split('/').pop();
      if (!fileName) {
        alert('Nome do arquivo não encontrado');
        return;
      }

      console.log("Iniciando transferência do arquivo:", fileName);

      const transferResult = await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timeout: Servidor não respondeu'));
        }, 15000);

        socket.emit('transfer', { filename: fileName }, (response: any) => {
          clearTimeout(timeout);
          console.log("Resposta da transferência:", response);
          
          if (response?.status === 'success') {
            resolve(response);
          } else {
            reject(new Error(response?.message || 'Erro na transferência'));
          }
        });
      });

      console.log('Transferência concluída:', transferResult);
      alert('Transferência realizada com sucesso!');
      
    } catch (error) {
      console.error('Erro na transferência:', error);
      alert(`Erro na transferência: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-70 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="p-4 bg-white rounded shadow-lg max-w-[90vw] max-h-[90vh] overflow-auto relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "none" }}>
          <HandDetection arquivo={imageUrl}  transferirArquivo={() => handleTransfer()}/>
        </div>
        
        {/* Loading indicator */}
        {!imageLoaded && !imageError && (
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2">Carregando imagem...</span>
          </div>
        )}

        {/* Error message */}
        {imageError && (
          <div className="flex flex-col items-center justify-center p-8 text-red-500">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <p className="text-center">
              Erro ao carregar a imagem
              <br />
              <span className="text-sm text-gray-500">
                Verifique se o arquivo existe e a URL está correta
              </span>
            </p>
          </div>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt="Visualização da imagem"
          className={`max-w-full max-h-[80vh] object-contain transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          onLoad={() => {
            console.log("Imagem carregada com sucesso");
            setImageLoaded(true);
          }}
          onError={(e) => {
            console.error("Erro ao carregar imagem:", e);
            console.error("URL da imagem:", imageUrl);
            setImageError(true);
          }}
        />

        {/* Action buttons */}
        <div className="mt-4 flex gap-2 justify-end">
          {imageLoaded && !imageError && (
            <a
              href={imageUrl}
              download
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
            >
              Download
            </a>
          )}

          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleUpload}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : 'Enviar para Backend'}
          </button>

          <button
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
            onClick={handleTransfer}
          >
            Transferir Arquivo
          </button>

          <button
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            onClick={onClose}
          >
            Fechar
          </button>
        </div>

        {/* Debug info */}
        {process.env.NODE_ENV === "development" && (
          <details className="mt-2">
            <summary className="text-xs text-gray-500 cursor-pointer">
              Debug Info
            </summary>
            <div className="mt-1 p-2 bg-gray-100 rounded text-xs break-all">
              <strong>URL:</strong> {imageUrl}
              <br />
              <strong>Loaded:</strong> {imageLoaded ? "Sim" : "Não"}
              <br />
              <strong>Error:</strong> {imageError ? "Sim" : "Não"}
              <br />
              <strong>Socket Connected:</strong> {socket?.connected ? "Sim" : "Não"}
              <br />
              <strong>Uploading:</strong> {uploading ? "Sim" : "Não"}
            </div>
          </details>
        )}
      </div>
    </div>
  );
}