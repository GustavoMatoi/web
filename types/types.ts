interface ListaArquivosProps {
  dados: {
    envios: Arquivo[];
  };
}

interface CardArquivoProps {
  arquivo: Arquivo;
}

export interface Arquivo {
  plataforma: string;
  data_recebimento: string;
  nome_arquivo: string;
  tipo_arquivo: string;
}

export interface DadosArquivos {
  envios: Arquivo[];
}

export interface UploadResponse {
  message: string; 
  filename: string; 
  fileUrl: string;
}

export interface ErrorResponse {
  error: string;
}

export interface RouteParams {
  params: {
    filename: string
  }
}

export interface FilesResponse {
  files: Arquivo[]
}