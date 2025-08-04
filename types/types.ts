
interface Arquivo {
  plataforma: string;
  data_recebimento: string;
  nome_arquivo: string;
  tipo_arquivo: string;
}

interface ListaArquivosProps {
  dados: {
    envios: Arquivo[];
  };
}

interface CardArquivoProps {
  arquivo: Arquivo;
}

interface Arquivo {
  plataforma: string;
  data_recebimento: string;
  nome_arquivo: string;
  tipo_arquivo: string;
}

interface DadosArquivos {
  envios: Arquivo[];
}

