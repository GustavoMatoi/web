"use client"
import { useEffect, useState } from 'react';
import ListaArquivos from '../../../components/clientComponents/CardFileHistory';


export default function PaginaArquivos() {
  const [dadosOriginais, setDadosOriginais] = useState<DadosArquivos | null>(null);
  const [dadosFiltrados, setDadosFiltrados] = useState<DadosArquivos | null>(null);
  const [plataformaSelecionada, setPlataformaSelecionada] = useState<string>('todas');
  const [termoPesquisa, setTermoPesquisa] = useState<string>('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const carregarDados = async () => {
      try {
        const resposta = await fetch('/history.json');
        if (!resposta.ok) {
          throw new Error('Falha ao carregar os dados');
        }
        const dadosJson = await resposta.json();
        setDadosOriginais(dadosJson);
        setDadosFiltrados(dadosJson);
      } catch (error) {
        setErro(`Erro: ${error}`);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, []);

  useEffect(() => {
    if (dadosOriginais) {
      let resultados = dadosOriginais.envios;
      if (plataformaSelecionada !== 'todas') {
        resultados = resultados.filter(
          (arquivo) => arquivo.plataforma.toLowerCase() === plataformaSelecionada.toLowerCase()
        );
      }
      if (termoPesquisa) {
        resultados = resultados.filter((arquivo) =>
          arquivo.nome_arquivo.toLowerCase().includes(termoPesquisa.toLowerCase())
        );
      }

      setDadosFiltrados({ envios: resultados });
    }
  }, [plataformaSelecionada, termoPesquisa, dadosOriginais]);

  const getPlataformasUnicas = () => {
    if (!dadosOriginais) return [];
    const plataformas = new Set(dadosOriginais.envios.map((arquivo) => arquivo.plataforma));
    return Array.from(plataformas);
  };

  const handlePesquisa = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (carregando) {
    return <div className="container mx-auto p-4">Carregando...</div>;
  }

  if (erro) {
    return <div className="container mx-auto p-4 text-red-500">Erro: {erro}</div>;
  }

  if (!dadosOriginais || !dadosFiltrados) {
    return <div className="container mx-auto p-4">Nenhum dado encontrado</div>;
  }


  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Arquivos Recebidos</h1>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <form onSubmit={handlePesquisa} className="flex">
            <input
              type="text"
              placeholder="Pesquisar por nome..."
              value={termoPesquisa}
              onChange={(e) => setTermoPesquisa(e.target.value)}
              className="block w-full rounded-l-md border-gray-300 py-2 pl-3 pr-3 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-r-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Buscar
            </button>
          </form>

          <select
            id="plataforma-filter"
            value={plataformaSelecionada}
            onChange={(e) => setPlataformaSelecionada(e.target.value)}
            className="block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          >
            <option value="todas">Todas as plataformas</option>
            {getPlataformasUnicas().map((plataforma) => (
              <option key={plataforma} value={plataforma}>
                {plataforma}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <ListaArquivos dados={dadosFiltrados} />
    </div>
  );
}