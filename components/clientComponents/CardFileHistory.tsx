import React from "react";

const CardArquivo: React.FC<CardArquivoProps> = ({ arquivo }) => {
  const formatarData = (dataString: string) => {
    const data = new Date(dataString);
    return data.toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getIcone = (tipo: string) => {
    switch (tipo.toLowerCase()) {
      case "pdf":
        return "📄";
      case "imagem":
        return "🖼️";
      case "compactado":
        return "🔒";
      case "documento":
        return "📝";
      default:
        return "📁";
    }
  };

  const getPlataformaCor = (plataforma: string) => {
    switch (plataforma.toLowerCase()) {
      case "web":
        return "bg-blue-100 text-blue-800";
      case "mobile":
        return "bg-green-100 text-green-800";
      case "desktop":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{getIcone(arquivo.tipo_arquivo)}</div>

        <div className="flex-1">
          <h3 className="font-medium text-lg truncate">
            {arquivo.nome_arquivo}
          </h3>
          <p className="text-sm text-gray-500">
            {formatarData(arquivo.data_recebimento)}
          </p>

          <div className="mt-2 flex gap-2">
            <span
              className={`text-xs px-2 py-1 rounded-full ${getPlataformaCor(
                arquivo.plataforma
              )}`}
            >
              {arquivo.plataforma}
            </span>
            <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-800">
              {arquivo.tipo_arquivo}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ListaArquivos: React.FC<ListaArquivosProps> = ({ dados }) => {
  if (dados.envios.length === 0) {
    return <div className="container mx-auto p-4">Nenhum dado encontrado</div>;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {dados.envios.map((arquivo, index) => (
        <CardArquivo key={index} arquivo={arquivo} />
      ))}
    </div>
  );
};

export default ListaArquivos;
