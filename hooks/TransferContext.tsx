"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, MouseEventHandler } from "react";
import { Arquivo } from "../types/types";
import { socket } from "@/lib/socket";
import { errorMonitor } from "events";

interface FileInfo {
  filename: string;
  size: number;
  uploadDate: string;
  downloadUrl: string;
}

interface FilesResponse {
  files: FileInfo[];
}

interface UploadResponse {
  message: string;
  filename: string;
  fileUrl: string;
}

interface TransferContextType {
  files: FileInfo[];
  uploading: boolean;
  selectedFile: File | null;
  setSelectedFile: (file: File | null) => void;
  loadFiles: () => Promise<void>;
  handleUpload: ( imageUrl: string) => Promise<unknown>;
  handleTransfer: (filename: string) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TransferContext = createContext<TransferContextType | undefined>(undefined);

export function TransferProvider({ children }: { children: ReactNode }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadFiles = async (): Promise<void> => {
    try {
      const response = await fetch("/api/files");
      const data: FilesResponse = await response.json();
      setFiles(data.files || []);
    } catch (error) {
      console.error("Erro ao carregar arquivos:", error);
    }
  };

  const handleUpload = (imageUrl : string ) : any =>{
    
  }
  const handleTransfer = (filename: string): void => {
    window.open(`/api/files/${filename}`, "_blank");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
  };

  // Carregar lista no início
  useEffect(() => {
    loadFiles();
  }, []);

  return (
    <TransferContext.Provider
      value={{
        files,
        uploading,
        selectedFile,
        setSelectedFile,
        loadFiles,
        handleUpload,
        handleTransfer,
        handleFileChange
      }}
    >
      {children}
    </TransferContext.Provider>
  );
}

export function useTransfer() {
  const context = useContext(TransferContext);
  if (!context) {
    throw new Error("useTransfer deve ser usado dentro de um TransferProvider");
  }
  return context;
}
