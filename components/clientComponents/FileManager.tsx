"use client";

import React, { useState } from "react";
import {
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileAlt,
  FaFileVideo,
  FaFileImage,
  FaDownload,
  FaEye,
} from "react-icons/fa";
import { useTransfer } from "../../hooks/TransferContext";
import Modal from "./Modal";
import HandDetection from "./HandDetection";

function getFileIcon(filename: string) {
  const ext = filename.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "pdf":
      return <FaFilePdf size={40} color="#e74c3c" />;
    case "doc":
    case "docx":
      return <FaFileWord size={40} color="#2980b9" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FaFileExcel size={40} color="#27ae60" />;
    case "jpg":
    case "jpeg":
    case "png":
    case "gif":
    case "webp":
    case "svg":
      return <FaFileImage size={40} color="#f39c12" />;
    case "mp4":
    case "webm":
      return <FaFileVideo size={40} color="#8e44ad" />;
    default:
      return <FaFileAlt size={40} color="#7f8c8d" />;
  }
}

function isImage(filename: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(filename);
}

function isPdf(filename: string): boolean {
  return /\.pdf$/i.test(filename);
}

function isVideo(filename: string): boolean {
  return /\.(mp4|webm)$/i.test(filename);
}

interface FileInfo {
  filename: string;
  size: number;
  uploadDate: string;
  downloadUrl: string;
}

export default function FileManager() {
  const {
    files,
    uploading,
    selectedFile,
    handleUpload,
    handleFileChange,
    handleTransfer,
    loadFiles,
  } = useTransfer();

  const [modalVisibility, setModalVisibility] = useState(false);
  const [imageToShow, setImageToShow] = useState<string>("");

  // Para controlar quais arquivos estão com preview aberto (PDF/video)
  const [previewOpen, setPreviewOpen] = useState<Record<string, boolean>>({});

  function openModalWithImage(url: string) {
    setImageToShow(url);
    setModalVisibility(true);
  }

  function togglePreview(filename: string) {
    setPreviewOpen((prev) => ({
      ...prev,
      [filename]: !prev[filename],
    }));
  }

  function downloadFile(file: FileInfo) {
    const link = document.createElement("a");
    link.href = file.downloadUrl;
    link.download = file.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <h1>Gerenciador de Arquivos</h1>

      <div
        style={{
          marginBottom: "30px",
          padding: "20px",
          border: "1px solid #ccc",
          borderRadius: "5px",
        }}
      >
        <h2>Upload de Arquivo</h2>
        <form onSubmit={handleUpload}>
          <input
            type="file"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ marginRight: "10px" }}
          />
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            style={{
              padding: "5px 15px",
              backgroundColor: "#0070f3",
              color: "white",
              border: "none",
              borderRadius: "3px",
            }}
          >
            {uploading ? "Enviando..." : "Upload"}
          </button>
        </form>
      </div>

      {/* Lista de Arquivos */}
      <div>
        <h2>Arquivos Disponíveis</h2>

        {files.length === 0 ? (
          <p>Nenhum arquivo encontrado.</p>
        ) : (
          <div style={{ display: "grid", gap: "10px" }}>
            {files.map((file, index) => (
              <div
                key={index}
                style={{
                  padding: "15px",
                  border: "1px solid #eee",
                  borderRadius: "5px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "10px" }}
                >
                  {/* Preview */}
                  {isImage(file.filename) ? (
                    <img
                      src={file.downloadUrl}
                      alt={file.filename}
                      style={{
                        maxWidth: "50px",
                        maxHeight: "50px",
                        cursor: "pointer",
                        objectFit: "cover",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                      onClick={() => openModalWithImage(file.downloadUrl)}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : isPdf(file.filename) && previewOpen[file.filename] ? (
                    <iframe
                      src={file.downloadUrl}
                      title={file.filename}
                      style={{
                        width: "200px",
                        height: "250px",
                        border: "1px solid #ddd",
                        borderRadius: "4px",
                      }}
                    />
                  ) : isVideo(file.filename) && previewOpen[file.filename] ? (
                    <video
                      src={file.downloadUrl}
                      controls
                      style={{
                        width: "200px",
                        height: "150px",
                        borderRadius: "4px",
                      }}
                    />
                  ) : (
                    getFileIcon(file.filename)
                  )}

                  <div style={{ minWidth: 0 }}>
                    <strong>{file.filename}</strong>
                    <br />
                    <small>
                      {(file.size / 1024).toFixed(1)} KB |{" "}
                      {new Date(file.uploadDate).toLocaleString("pt-BR")}
                    </small>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {/* Botão para visualizar imagens (abre modal) */}
                  {isImage(file.filename) && (
                    <button
                      onClick={() => openModalWithImage(file.downloadUrl)}
                      style={{
                        padding: "5px 15px",
                        backgroundColor: "#17a2b8",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaEye /> Visualizar
                    </button>
                  )}

                  {/* Botão para pré-visualizar PDF e Vídeo inline */}
                  {(isPdf(file.filename) || isVideo(file.filename)) && (
                    <button
                      onClick={() => openModalWithImage(file.downloadUrl)}
                      style={{
                        padding: "5px 15px",
                        backgroundColor: previewOpen[file.filename]
                          ? "#c0392b"
                          : "#2980b9",
                        color: "white",
                        border: "none",
                        borderRadius: "3px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                      }}
                    >
                      <FaEye />
                      {previewOpen[file.filename]
                        ? " Fechar Prévia"
                        : " Visualizar"}
                    </button>
                  )}

                  {/* Botão para download */}
                  <button
                    onClick={() => downloadFile(file)}
                    style={{
                      padding: "5px 15px",
                      backgroundColor: "#28a745",
                      color: "white",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "5px",
                    }}
                  >
                    <FaDownload /> Download
                  </button>

                  {/* Botão para transferir */}
                  <button
                    onClick={() => handleTransfer(file.filename)}
                    style={{
                      padding: "5px 15px",
                      backgroundColor: "#ffc107",
                      color: "black",
                      border: "none",
                      borderRadius: "3px",
                      cursor: "pointer",
                    }}
                  >
                    Transferir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <button
          onClick={loadFiles}
          style={{
            marginTop: "15px",
            padding: "5px 15px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "3px",
          }}
        >
          Atualizar Lista
        </button>
      </div>

      {/* Modal para mostrar a imagem grande */}
      {modalVisibility && (
        <Modal onClose={() => setModalVisibility(false)} imageUrl={imageToShow} />
      )}
    </div>
  );
}
