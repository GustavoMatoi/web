"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Arquivo } from "../types/types";

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
  handleUpload: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
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

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result: UploadResponse = await response.json();
        alert("Upload realizado com sucesso!");
        setSelectedFile(null);
        await loadFiles(); // Recarregar lista
      } else {
        alert("Erro no upload");
      }
    } catch (error) {
      alert("Erro no upload");
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

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
