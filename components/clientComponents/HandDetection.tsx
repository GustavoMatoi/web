"use client"; // Diretiva do Next.js para indicar que este é um componente client-side
import { useEffect, useRef, useState } from "react"; // Importa hooks do React para efeitos, referências e estado
import { Arquivo } from "../../types/types";

// Tipos para as bibliotecas externas
interface Point { // Interface que define um ponto 2D
  x: number; // Coordenada X do ponto
  y: number; // Coordenada Y do ponto
}

interface Keypoint extends Point { // Interface que estende Point para representar pontos-chave da mão
  score?: number; // Pontuação de confiança da detecção (opcional)
  name?: string; // Nome do ponto-chave (opcional)
}

interface Hand { // Interface que representa uma mão detectada
  keypoints: Keypoint[]; // Array de pontos-chave da mão
  handedness: string; // Indica se é mão esquerda ou direita
  score: number; // Pontuação de confiança da detecção da mão
}

interface TensorFlow { // Interface para a biblioteca TensorFlow.js
  setBackend: (backend: string) => Promise<void>; // Método para definir o backend de processamento
}

interface HandPoseDetection { // Interface para a biblioteca de detecção de poses de mão
  SupportedModels: { // Modelos suportados pela biblioteca
    MediaPipeHands: string; // Modelo MediaPipe Hands
  };
  createDetector: ( // Método para criar um detector
    model: string, // Nome do modelo a ser usado
    config: DetectorConfig // Configuração do detector
  ) => Promise<HandDetector>; // Retorna uma Promise com o detector criado
}

interface DetectorConfig { // Interface para configuração do detector
  runtime: string; // Runtime a ser usado (mediapipe, tfjs, etc.)
  modelType: string; // Tipo do modelo (lite, full, etc.)
  solutionPath: string; // Caminho para os arquivos da solução
}

interface HandDetector { // Interface para o detector de mãos
  estimateHands: (video: HTMLVideoElement) => Promise<Hand[]>; // Método que estima as mãos em um vídeo
}

// Extensão da interface Window para incluir as bibliotecas
declare global { // Declaração global para estender tipos existentes
  interface Window { // Estende a interface Window do navegador
    tf: TensorFlow; // Adiciona a propriedade tf (TensorFlow.js)
    handPoseDetection: HandPoseDetection; // Adiciona a propriedade handPoseDetection
  }
}

// Tipos para o componente
interface FingertipPoints { // Interface para mapear índices de pontas dos dedos para cores
  [key: number]: string; // Chave numérica (índice do dedo) para valor string (cor)
}

type ProximityPair = [number, number]; // Tipo que representa um par de índices para comparação de proximidade

const HandDetection = ({arquivo, transferirArquivo}: {arquivo: string, transferirArquivo: () => void }) => { // Componente funcional React para detecção de gestos de mão
  const videoRef = useRef<HTMLVideoElement>(null); // Referência para o elemento de vídeo
  const canvasRef = useRef<HTMLCanvasElement>(null); // Referência para o elemento canvas
  const [isLoading, setIsLoading] = useState<boolean>(true); // Estado para controlar se está carregando
  const [error, setError] = useState<string | null>(null); // Estado para armazenar mensagens de erro
  const [isGrabbing, setIsGrabbing] = useState<boolean>(false); // Estado para indicar se está fazendo gesto de pegar
  const [videoReady, setVideoReady] = useState<boolean>(false); // Estado para indicar se o vídeo está pronto

  // Define as pontas dos dedos (índices dos pontos no modelo) e a cor para cada um
  const fingertipPoints: FingertipPoints = { // Objeto que mapeia índices dos dedos para suas cores
    4: "#56321A", // Polegar - cor marrom
    8: "#1A5637", // Indicador - cor verde escura
    12: "#425194", // Médio - cor azul
    16: "#942E8F", // Anelar - cor roxo
    20: "#948E14", // Mindinho - cor amarelo escuro
  };

  // Define os pares de dedos que devem ser comparados para medir distância
  const proximityPairs: ProximityPair[] = [ // Array de pares de índices para verificar proximidade
    [4, 8], // Polegar e indicador
    [4, 12], // Polegar e médio
    [4, 16], // Polegar e anelar
    [4, 20], // Polegar e mindinho
    [8, 12], // Indicador e médio
    [12, 16], // Médio e anelar
    [16, 20], // Anelar e mindinho
    [8, 20], // Indicador e mindinho
  ];

  // Função que calcula a distância euclidiana entre dois pontos
  const getDistance = (p1: Point, p2: Point): number => { // Função que recebe dois pontos e retorna a distância
    const dx = p1.x - p2.x; // Calcula a diferença em X
    const dy = p1.y - p2.y; // Calcula a diferença em Y
    return Math.sqrt(dx * dx + dy * dy); // Retorna a distância euclidiana usando teorema de Pitágoras
  };

  // Função que ativa a câmera
  const setupCamera = async (): Promise<HTMLVideoElement | undefined> => { // Função assíncrona para configurar a câmera
    try { // Bloco try para capturar erros
      const stream = await navigator.mediaDevices.getUserMedia({ // Solicita acesso aos dispositivos de mídia
        video: { // Configurações do vídeo
          width: { ideal: 640 }, // Largura ideal de 640 pixels
          height: { ideal: 480 }, // Altura ideal de 480 pixels
          facingMode: "user", // Usa a câmera frontal
        },
        audio: false, // Não solicita áudio
      });

      if (videoRef.current) { // Verifica se a referência do vídeo existe
        videoRef.current.srcObject = stream; // Define o stream como fonte do vídeo
        // Force video to load and play
        videoRef.current.load(); // Força o carregamento do vídeo
        return new Promise((resolve, reject) => { // Retorna uma Promise
          if (videoRef.current) { // Verifica novamente se a referência existe
            videoRef.current.onloadedmetadata = async () => { // Evento disparado quando metadados são carregados
              try { // Bloco try interno
                await videoRef.current!.play(); // Inicia a reprodução do vídeo
                console.log("Vídeo carregado e reproduzindo"); // Log de sucesso
                setVideoReady(true); // Marca o vídeo como pronto
                resolve(videoRef.current!); // Resolve a Promise com o elemento de vídeo
              } catch (playError) { // Captura erros de reprodução
                reject(playError); // Rejeita a Promise com o erro
              }
            };
            videoRef.current.onerror = () => { // Evento de erro do vídeo
              reject(new Error("Erro ao carregar o vídeo")); // Rejeita com erro customizado
            };
          }
        });
      }
    } catch (err) { // Captura erros da solicitação de mídia
      const errorMessage = // Cria mensagem de erro
        err instanceof Error ? err.message : "Erro desconhecido"; // Verifica se é uma instância de Error
      throw new Error("Erro ao acessar a câmera: " + errorMessage); // Lança erro customizado
    }
  };

  // Carrega os scripts necessários dinamicamente
  const loadScripts = (): Promise<void> => { // Função que carrega scripts externos dinamicamente
    return new Promise((resolve, reject) => { // Retorna uma Promise
      // Verifica se as bibliotecas já estão carregadas
      if (window.tf && window.handPoseDetection) { // Se as bibliotecas já existem no window
        resolve(); // Resolve imediatamente
        return; // Sai da função
      }

      let scriptsLoaded = 0; // Contador de scripts carregados
      const totalScripts = 4; // Total de scripts a serem carregados

      const checkAllLoaded = (): void => { // Função para verificar se todos os scripts foram carregados
        scriptsLoaded++; // Incrementa o contador
        if (scriptsLoaded === totalScripts) { // Se todos os scripts foram carregados
          resolve(); // Resolve a Promise
        }
      };

      const createScript = (src: string, errorMsg: string): void => { // Função auxiliar para criar elementos script
        const script = document.createElement("script"); // Cria elemento script
        script.src = src; // Define o source do script
        script.onload = checkAllLoaded; // Define callback de sucesso
        script.onerror = () => reject(new Error(errorMsg)); // Define callback de erro
        document.head.appendChild(script); // Adiciona o script ao head do documento
      };

      // TensorFlow.js Core
      createScript( // Carrega o core do TensorFlow.js
        "https://unpkg.com/@tensorflow/tfjs-core@3.7.0/dist/tf-core.js", // URL do script
        "Erro ao carregar TensorFlow.js Core" // Mensagem de erro
      );

      // TensorFlow.js WebGL Backend
      createScript( // Carrega o backend WebGL do TensorFlow.js
        "https://unpkg.com/@tensorflow/tfjs-backend-webgl@3.7.0/dist/tf-backend-webgl.js", // URL do script
        "Erro ao carregar TensorFlow.js WebGL" // Mensagem de erro
      );

      // Hand Pose Detection
      createScript( // Carrega a biblioteca de detecção de poses de mão
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/hand-pose-detection@2.0.0/dist/hand-pose-detection.js", // URL do script
        "Erro ao carregar Hand Pose Detection" // Mensagem de erro
      );

      // MediaPipe Hands
      createScript( // Carrega a biblioteca MediaPipe Hands
        "https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/hands.min.js", // URL do script
        "Erro ao carregar MediaPipe" // Mensagem de erro
      );
    });
  };

  useEffect(() => { // Hook useEffect para executar efeitos colaterais
    // Só executa no cliente
    if (typeof window === "undefined") return; // Verifica se está no ambiente do navegador

    let animationFrame: number; // Variável para armazenar o ID do frame de animação
    let detector: HandDetector; // Variável para o detector de mãos
    let isGrabbingState = false; // Estado local para controle do gesto de pegar

    const initializeDetection = async (): Promise<void> => { // Função assíncrona para inicializar a detecção
      try { // Bloco try para capturar erros
        setIsLoading(true); // Define estado de carregamento como true
        setError(null); // Limpa mensagens de erro
        console.log("Iniciando detecção..."); // Log de início

        // Primeiro configura a câmera
        const video = await setupCamera(); // Aguarda a configuração da câmera
        console.log("Câmera configurada:", video); // Log de sucesso da câmera

        // Carrega as bibliotecas
        console.log("Carregando bibliotecas..."); // Log de carregamento
        await loadScripts(); // Aguarda o carregamento dos scripts

        // Aguarda um pouco para garantir que as bibliotecas estejam disponíveis
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera 1 segundo

        // Define o backend do TensorFlow.js
        console.log("Configurando TensorFlow..."); // Log de configuração
        await window.tf.setBackend("webgl"); // Define WebGL como backend

        // Aguarda um pouco para o vídeo estabilizar
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Espera mais 1 segundo

        // Cria o detector
        console.log("Criando detector..."); // Log de criação do detector
        const model = window.handPoseDetection.SupportedModels.MediaPipeHands; // Obtém o modelo MediaPipe
        detector = await window.handPoseDetection.createDetector(model, { // Cria o detector
          runtime: "mediapipe", // Define runtime como mediapipe
          modelType: "lite", // Usa modelo lite (mais rápido)
          solutionPath: "https://cdn.jsdelivr.net/npm/@mediapipe/hands", // Caminho para os arquivos do MediaPipe
        });

        console.log("Detector criado, iniciando detecção..."); // Log de sucesso
        setIsLoading(false); // Define carregamento como false

        // Inicia a detecção
        detectHands(); // Chama a função de detecção
      } catch (err) { // Captura erros
        const errorMessage = // Cria mensagem de erro
          err instanceof Error ? err.message : "Erro desconhecido"; // Verifica tipo do erro
        console.error("Erro na inicialização:", err); // Log do erro
        setError(errorMessage); // Define mensagem de erro no estado
        setIsLoading(false); // Para o carregamento
      }
    };

    // Função de detecção contínua
    const detectHands = async (): Promise<void> => { // Função assíncrona para detecção contínua
      if (!detector || !videoRef.current || !canvasRef.current) return; // Verifica se todos os elementos necessários existem

      const threshold = 45; // Define limiar de distância para proximidade (em pixels)
      const canvas = canvasRef.current; // Obtém referência do canvas
      const ctx = canvas.getContext("2d"); // Obtém contexto 2D do canvas
      if (!ctx) return; // Verifica se o contexto existe

      try { // Bloco try para capturar erros
        const hands = await detector.estimateHands(videoRef.current); // Detecta mãos no frame atual

        // Limpa o canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpa todo o canvas

        // Desenha círculo indicando o threshold (usando o polegar como referência)
        if (hands.length > 0) { // Se pelo menos uma mão foi detectada
          const keypoints = hands[0].keypoints; // Obtém pontos-chave da primeira mão
          for (const indexStr of Object.keys(fingertipPoints)) { // Itera sobre os índices das pontas dos dedos
            const index = parseInt(indexStr, 10); // Converte string para número
            const point = keypoints[index]; // Obtém o ponto correspondente
            if (point) { // Se o ponto existe
              ctx.beginPath(); // Inicia novo caminho de desenho
              ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"; // Define cor branca translúcida
              ctx.lineWidth = 2; // Define espessura da linha
              ctx.arc(point.x, point.y, threshold, 0, 2 * Math.PI); // Desenha círculo com raio igual ao threshold
              ctx.stroke(); // Aplica o traçado
            }
          }
        }

        // Processa cada mão detectada
        for (const hand of hands) { // Itera sobre todas as mãos detectadas
          const keypoints = hand.keypoints; // Obtém pontos-chave da mão atual

          // Desenha os pontos das pontas dos dedos
          for (const index of Object.keys(fingertipPoints)) { // Itera sobre os índices das pontas
            const numIndex = parseInt(index, 10); // Converte para número
            const point = keypoints[numIndex]; // Obtém o ponto
            if (point) { // Se o ponto existe
              ctx.beginPath(); // Inicia novo caminho
              ctx.arc(point.x, point.y, 8, 0, 2 * Math.PI); // Desenha círculo pequeno (raio 8)
              ctx.fillStyle = fingertipPoints[numIndex]; // Define cor específica do dedo
              ctx.fill(); // Preenche o círculo
            }
          }

          // Conta pares de dedos próximos
          let paresProximos = 0; // Contador de pares próximos
          for (const [a, b] of proximityPairs) { // Itera sobre os pares definidos
            const p1 = keypoints[a]; // Obtém primeiro ponto do par
            const p2 = keypoints[b]; // Obtém segundo ponto do par
            if (p1 && p2) { // Se ambos os pontos existem
              const d = getDistance(p1, p2); // Calcula distância entre os pontos
              if (d < threshold) { // Se a distância é menor que o limiar
                paresProximos++; // Incrementa contador
              }
            }
          }

          // Lógica do gesto
          if (!isGrabbingState && paresProximos >= 1) { // Se não estava pegando e há pelo menos 1 par próximo
            isGrabbingState = true; // Marca como pegando
            setIsGrabbing(true); // Atualiza estado React
            alert(`Arquivo detectado para transferência: ${arquivo}`)
            console.log("🖐️ Gesto final: pegar (iniciado)"); // Log do gesto
          } else if (isGrabbingState && paresProximos === 0) { // Se estava pegando e não há pares próximos
            isGrabbingState = false; // Marca como não pegando
            transferirArquivo()
            setIsGrabbing(false); // Atualiza estado React
            console.log("🙌 Gesto final: soltar (liberado)"); // Log do gesto
          }
        }
      } catch (err) { // Captura erros na detecção
        console.error("Erro na detecção:", err); // Log do erro
      }

      // Próximo frame
      animationFrame = requestAnimationFrame(detectHands); // Agenda próxima execução
    };

    initializeDetection(); // Chama inicialização

    // Cleanup
    return () => { // Função de limpeza do useEffect
      if (animationFrame) { // Se há frame de animação ativo
        cancelAnimationFrame(animationFrame); // Cancela o frame
      }
      if (videoRef.current && videoRef.current.srcObject) { // Se há vídeo ativo
        const stream = videoRef.current.srcObject as MediaStream; // Obtém stream
        const tracks = stream.getTracks(); // Obtém todas as trilhas
        tracks.forEach((track) => track.stop()); // Para cada trilha
      }
    };
  }, []); // Array de dependências vazio (executa apenas uma vez)

  const handleRetry = (): void => { // Função para tentar novamente
    window.location.reload(); // Recarrega a página
  };

  if (error) { // Se há erro
    return ( // Retorna interface de erro
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white"> {/* Container principal centralizado */}
        <div className="text-center"> {/* Container do conteúdo centralizado */}
          <h2 className="text-xl font-bold mb-4">Erro</h2> {/* Título do erro */}
          <p className="text-red-400">{error}</p> {/* Mensagem de erro em vermelho */}
          <button // Botão para tentar novamente
            onClick={handleRetry} // Manipulador de clique
            className="mt-4 px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition-colors" // Classes de estilo
          >
            Tentar Novamente {/* Texto do botão */}
          </button>
        </div>
      </div>
    );
  }

  return ( // Retorna interface principal
    <div className="flex flex-col items-center justify-center min-h-screen bg-black"> {/* Container principal */}
      {isLoading && ( // Se está carregando
        <div className="absolute z-20 text-white text-center"> {/* Overlay de carregamento */}
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div> {/* Spinner de carregamento */}
          <p>Carregando detecção de gestos...</p> {/* Texto de carregamento */}
          {!videoReady && ( // Se vídeo não está pronto
            <p className="text-sm mt-2">Aguardando permissão da câmera...</p> // Texto adicional
          )}
        </div>
      )}

      <div className="relative border-2 border-gray-600 rounded-lg overflow-hidden"> {/* Container do vídeo */}
        <video // Elemento de vídeo
          ref={videoRef} // Referência React
          width="640" // Largura
          height="480" // Altura
          autoPlay // Reprodução automática
          playsInline // Reprodução inline (móvel)
          muted // Sem áudio
          className="block" // Classe CSS
          style={{ // Estilos inline
            transform: "scaleX(-1)", // Espelha horizontalmente
            backgroundColor: "#000", // Fundo preto
            minHeight: "480px", // Altura mínima
            minWidth: "640px", // Largura mínima
          }}
        />
        <canvas // Elemento canvas para desenhar
          ref={canvasRef} // Referência React
          width="640" // Largura
          height="480" // Altura
          className="absolute top-0 left-0 pointer-events-none" // Classes CSS (posicionamento absoluto)
          style={{ transform: "scaleX(-1)" }} // Espelha para coincidir com o vídeo
        />
      </div>

      <div className="mt-4 text-center"> {/* Container de informações */}
        <div // Status do gesto
          className={`text-2xl font-bold ${ // Classes base + condicionais
            isGrabbing ? "text-red-400" : "text-green-400" // Cor baseada no estado
          }`}
        >
          {isGrabbing ? "🖐️ Pegando" : "🙌 Solto"} {/* Texto baseado no estado */}
        </div>
        <p className="text-gray-400 mt-2"> {/* Instrução para o usuário */}
          Mova sua mão em frente à câmera para detectar gestos
        </p>
      </div>
    </div>
  );
};

export default HandDetection; // Exporta o componente como padrão