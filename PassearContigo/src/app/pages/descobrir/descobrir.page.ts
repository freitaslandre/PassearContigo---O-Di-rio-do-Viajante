// app/pages/descobrir/descobrir.page.ts | Controlador da pagina descobrir, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnDestroy, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Subscription } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';
// Importa dependencias usadas neste ficheiro.
import { GeolocationService } from '../../services/geolocation.service';
// Importa dependencias usadas neste ficheiro.
import { POI, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { POIService } from '../../services/poi.service';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { getAuth } from 'firebase/auth';

// Contrato de dados usado para tipar objetos desta area.
interface ResultadoDescobrir extends NominatimSearchResult {
  // Executa uma instrucao necessaria para este fluxo.
  distanciaKm?: number;
  // Define um campo ou opcao de configuracao.
  distanciaTexto: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface DestinoItinerario {
  // Define um campo ou opcao de configuracao.
  valor: string;
  // Define um campo ou opcao de configuracao.
  viagemId: string;
  // Define um campo ou opcao de configuracao.
  diaId: string;
  // Define um campo ou opcao de configuracao.
  rotulo: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface SugestaoPoi {
  // Define um campo ou opcao de configuracao.
  nome: string;
  // Define um campo ou opcao de configuracao.
  tipo: string;
  // Define um campo ou opcao de configuracao.
  categoria: string;
  // Define um campo ou opcao de configuracao.
  endereco: string;
  // Define um campo ou opcao de configuracao.
  latitude: number;
  // Define um campo ou opcao de configuracao.
  longitude: number;
  // Executa uma instrucao necessaria para este fluxo.
  descricao?: string;
  // Executa uma instrucao necessaria para este fluxo.
  fotoUrl?: string;
  // Executa uma instrucao necessaria para este fluxo.
  imagemPesquisa?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface SugestaoDia {
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Define um campo ou opcao de configuracao.
  local: string;
  // Define um campo ou opcao de configuracao.
  pontosInteresse: SugestaoPoi[];
}

// Contrato de dados usado para tipar objetos desta area.
interface SugestaoViagem {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Define um campo ou opcao de configuracao.
  local: string;
  // Define um campo ou opcao de configuracao.
  descricao: string;
  // Define um campo ou opcao de configuracao.
  duracaoDias: number;
  // Define um campo ou opcao de configuracao.
  destaque: string;
  // Executa uma instrucao necessaria para este fluxo.
  fotoCapaUrl?: string;
  // Define um campo ou opcao de configuracao.
  imagemPesquisa: string;
  // Define um campo ou opcao de configuracao.
  dias: SugestaoDia[];
}

/**
 * DescobrirPage - Página de Descobrir
 * Exibe viagens recomendadas e exploração de locais
 */
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-descobrir',
  // Define um campo ou opcao de configuracao.
  templateUrl: 'descobrir.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['descobrir.page.scss'],
  // Define um campo ou opcao de configuracao.
  standalone: false,
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DescobrirPage implements OnInit, OnDestroy {
  // Atribui um valor a esta propriedade.
  termoPesquisa = '';
  // Define um campo ou opcao de configuracao.
  resultados: ResultadoDescobrir[] = [];
  // Define um campo ou opcao de configuracao.
  viagens: Viagem[] = [];
  // Define um campo ou opcao de configuracao.
  destinosItinerario: DestinoItinerario[] = [];
  // Atribui um valor a esta propriedade.
  destinoSelecionado = '';
  // Define um campo ou opcao de configuracao.
  sugestoesAutomaticas: string[] = [];
  // Atribui um valor a esta propriedade.
  carregando = false;
  // Atribui um valor a esta propriedade.
  pesquisou = false;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Atribui um valor a esta propriedade.
  adicionandoPoiId = '';
  // Atribui um valor a esta propriedade.
  criandoSugestaoId = '';
  // Atribui um valor a esta propriedade.
  carregandoImagensSugestoes = false;
  // Define um campo ou opcao de configuracao.
  sugestoesViagem: SugestaoViagem[] = [
    // Executa uma instrucao necessaria para este fluxo.
    {
      // Define um campo ou opcao de configuracao.
      id: 'lisboa-fim-semana',
      // Define um campo ou opcao de configuracao.
      titulo: 'Fim de semana em Lisboa',
      // Define um campo ou opcao de configuracao.
      local: 'Lisboa, Portugal',
      // Define um campo ou opcao de configuracao.
      descricao: 'Um roteiro curto com miradouros, cultura e boa comida no centro da cidade.',
      // Define um campo ou opcao de configuracao.
      duracaoDias: 2,
      // Define um campo ou opcao de configuracao.
      destaque: 'Cultura, vistas e gastronomia',
      // Define um campo ou opcao de configuracao.
      imagemPesquisa: 'Praça do Comércio Lisboa Portugal',
      // Define um campo ou opcao de configuracao.
      dias: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          titulo: 'Baixa, Chiado e Alfama',
          // Define um campo ou opcao de configuracao.
          local: 'Lisboa',
          // Define um campo ou opcao de configuracao.
          pontosInteresse: [
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Praça do Comércio',
              // Define um campo ou opcao de configuracao.
              tipo: 'Praça histórica',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Praça do Comércio, Lisboa',
              // Define um campo ou opcao de configuracao.
              latitude: 38.7076,
              // Define um campo ou opcao de configuracao.
              longitude: -9.1366,
              // Define um campo ou opcao de configuracao.
              descricao: 'Bom ponto de partida junto ao Tejo.',
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Praça do Comércio Lisboa Portugal'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Elevador de Santa Justa',
              // Define um campo ou opcao de configuracao.
              tipo: 'Miradouro',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Rua do Ouro, Lisboa',
              // Define um campo ou opcao de configuracao.
              latitude: 38.7121,
              // Define um campo ou opcao de configuracao.
              longitude: -9.1395,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Elevador de Santa Justa Lisboa'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Miradouro de Santa Luzia',
              // Define um campo ou opcao de configuracao.
              tipo: 'Miradouro',
              // Define um campo ou opcao de configuracao.
              categoria: 'natureza',
              // Define um campo ou opcao de configuracao.
              endereco: 'Largo de Santa Luzia, Lisboa',
              // Define um campo ou opcao de configuracao.
              latitude: 38.7118,
              // Define um campo ou opcao de configuracao.
              longitude: -9.1300,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Miradouro de Santa Luzia Lisboa'
            }
          ]
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          titulo: 'Belém',
          // Define um campo ou opcao de configuracao.
          local: 'Lisboa',
          // Define um campo ou opcao de configuracao.
          pontosInteresse: [
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Mosteiro dos Jerónimos',
              // Define um campo ou opcao de configuracao.
              tipo: 'Monumento',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Praça do Império, Lisboa',
              // Define um campo ou opcao de configuracao.
              latitude: 38.6979,
              // Define um campo ou opcao de configuracao.
              longitude: -9.2068,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Mosteiro dos Jerónimos Lisboa'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Torre de Belém',
              // Define um campo ou opcao de configuracao.
              tipo: 'Monumento',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Avenida Brasília, Lisboa',
              // Define um campo ou opcao de configuracao.
              latitude: 38.6916,
              // Define um campo ou opcao de configuracao.
              longitude: -9.2160,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Torre de Belém Lisboa'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Pastéis de Belém',
              // Define um campo ou opcao de configuracao.
              tipo: 'Pastelaria',
              // Define um campo ou opcao de configuracao.
              categoria: 'gastronomia',
              // Define um campo ou opcao de configuracao.
              endereco: 'Rua de Belém 84, Lisboa',
              // Define um campo ou opcao de configuracao.
              latitude: 38.6975,
              // Define um campo ou opcao de configuracao.
              longitude: -9.2032,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Pastéis de Belém Lisboa'
            }
          ]
        }
      ]
    },
    // Executa uma instrucao necessaria para este fluxo.
    {
      // Define um campo ou opcao de configuracao.
      id: 'porto-ribeira',
      // Define um campo ou opcao de configuracao.
      titulo: 'Porto clássico',
      // Define um campo ou opcao de configuracao.
      local: 'Porto, Portugal',
      // Define um campo ou opcao de configuracao.
      descricao: 'Percurso a pé entre centro histórico, livrarias, pontes e ribeira.',
      // Define um campo ou opcao de configuracao.
      duracaoDias: 2,
      // Define um campo ou opcao de configuracao.
      destaque: 'Centro histórico e Ribeira',
      // Define um campo ou opcao de configuracao.
      imagemPesquisa: 'Ribeira Porto Ponte Dom Luís I Portugal',
      // Define um campo ou opcao de configuracao.
      dias: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          titulo: 'Centro histórico',
          // Define um campo ou opcao de configuracao.
          local: 'Porto',
          // Define um campo ou opcao de configuracao.
          pontosInteresse: [
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Torre dos Clérigos',
              // Define um campo ou opcao de configuracao.
              tipo: 'Monumento',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Rua de São Filipe de Nery, Porto',
              // Define um campo ou opcao de configuracao.
              latitude: 41.1457,
              // Define um campo ou opcao de configuracao.
              longitude: -8.6147,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Torre dos Clérigos Porto'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Livraria Lello',
              // Define um campo ou opcao de configuracao.
              tipo: 'Livraria',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Rua das Carmelitas 144, Porto',
              // Define um campo ou opcao de configuracao.
              latitude: 41.1469,
              // Define um campo ou opcao de configuracao.
              longitude: -8.6148,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Livraria Lello Porto'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Estação de São Bento',
              // Define um campo ou opcao de configuracao.
              tipo: 'Estação histórica',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Praça de Almeida Garrett, Porto',
              // Define um campo ou opcao de configuracao.
              latitude: 41.1456,
              // Define um campo ou opcao de configuracao.
              longitude: -8.6109,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Estação de São Bento Porto'
            }
          ]
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          titulo: 'Ribeira e Gaia',
          // Define um campo ou opcao de configuracao.
          local: 'Porto',
          // Define um campo ou opcao de configuracao.
          pontosInteresse: [
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Cais da Ribeira',
              // Define um campo ou opcao de configuracao.
              tipo: 'Zona histórica',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Cais da Ribeira, Porto',
              // Define um campo ou opcao de configuracao.
              latitude: 41.1406,
              // Define um campo ou opcao de configuracao.
              longitude: -8.6110,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Cais da Ribeira Porto'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Ponte Luís I',
              // Define um campo ou opcao de configuracao.
              tipo: 'Ponte',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Ponte Luís I, Porto',
              // Define um campo ou opcao de configuracao.
              latitude: 41.1398,
              // Define um campo ou opcao de configuracao.
              longitude: -8.6094,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Ponte Dom Luís I Porto'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Jardim do Morro',
              // Define um campo ou opcao de configuracao.
              tipo: 'Miradouro',
              // Define um campo ou opcao de configuracao.
              categoria: 'natureza',
              // Define um campo ou opcao de configuracao.
              endereco: 'Jardim do Morro, Vila Nova de Gaia',
              // Define um campo ou opcao de configuracao.
              latitude: 41.1383,
              // Define um campo ou opcao de configuracao.
              longitude: -8.6090,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Jardim do Morro Vila Nova de Gaia Porto'
            }
          ]
        }
      ]
    },
    // Executa uma instrucao necessaria para este fluxo.
    {
      // Define um campo ou opcao de configuracao.
      id: 'sintra-romantica',
      // Define um campo ou opcao de configuracao.
      titulo: 'Sintra romântica',
      // Define um campo ou opcao de configuracao.
      local: 'Sintra, Portugal',
      // Define um campo ou opcao de configuracao.
      descricao: 'Uma escapadinha por palácios, jardins e centro histórico.',
      // Define um campo ou opcao de configuracao.
      duracaoDias: 1,
      // Define um campo ou opcao de configuracao.
      destaque: 'Palácios e natureza',
      // Define um campo ou opcao de configuracao.
      imagemPesquisa: 'Palácio da Pena Sintra Portugal',
      // Define um campo ou opcao de configuracao.
      dias: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          titulo: 'Palácios e centro',
          // Define um campo ou opcao de configuracao.
          local: 'Sintra',
          // Define um campo ou opcao de configuracao.
          pontosInteresse: [
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Palácio Nacional da Pena',
              // Define um campo ou opcao de configuracao.
              tipo: 'Palácio',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Estrada da Pena, Sintra',
              // Define um campo ou opcao de configuracao.
              latitude: 38.7876,
              // Define um campo ou opcao de configuracao.
              longitude: -9.3906,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Palácio da Pena Sintra'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Quinta da Regaleira',
              // Define um campo ou opcao de configuracao.
              tipo: 'Palácio e jardim',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Rua Barbosa du Bocage, Sintra',
              // Define um campo ou opcao de configuracao.
              latitude: 38.7962,
              // Define um campo ou opcao de configuracao.
              longitude: -9.3965,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Quinta da Regaleira Sintra'
            },
            // Executa uma instrucao necessaria para este fluxo.
            {
              // Define um campo ou opcao de configuracao.
              nome: 'Centro Histórico de Sintra',
              // Define um campo ou opcao de configuracao.
              tipo: 'Centro histórico',
              // Define um campo ou opcao de configuracao.
              categoria: 'cultura',
              // Define um campo ou opcao de configuracao.
              endereco: 'Sintra',
              // Define um campo ou opcao de configuracao.
              latitude: 38.7974,
              // Define um campo ou opcao de configuracao.
              longitude: -9.3904,
              // Define um campo ou opcao de configuracao.
              imagemPesquisa: 'Centro Histórico de Sintra Portugal'
            }
          ]
        }
      ]
    }
  ];

  // Define um membro interno desta classe.
  private pesquisaAtual = 0;
  // Define um membro interno desta classe.
  private localizacaoAtual?: { latitude: number; longitude: number };
  // Define um membro interno desta classe.
  private viagensSubscription?: Subscription;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private nominatimService: NominatimService,
    // Define um membro interno desta classe.
    private geolocationService: GeolocationService,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private poiService: POIService,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController,
    // Define um membro interno desta classe.
    private router: Router
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.carregarImagensDasSugestoes();

    // Atualiza ou consulta estado da pagina.
    this.viagensSubscription = this.viagensService.getViagens().subscribe({
      // Define um campo ou opcao de configuracao.
      next: viagens => {
        // Atualiza ou consulta estado da pagina.
        this.viagens = viagens;
        // Atualiza ou consulta estado da pagina.
        this.atualizarDestinosItinerario();
        // Atualiza ou consulta estado da pagina.
        this.atualizarSugestoesAutomaticas();
      },
      // Define um campo ou opcao de configuracao.
      error: error => {
        // Executa uma instrucao necessaria para este fluxo.
        console.warn('Não foi possível carregar viagens para descobrir:', error);
      }
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.viagensSubscription?.unsubscribe();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async pesquisar(event?: CustomEvent) {
    // Cria uma variavel local para esta operacao.
    const valor = (event?.detail as { value?: string } | undefined)?.value;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof valor === 'string') {
      // Atualiza ou consulta estado da pagina.
      this.termoPesquisa = valor;
    }

    // Cria uma variavel local para esta operacao.
    const termo = this.termoPesquisa.trim();
    // Cria uma variavel local para esta operacao.
    const pesquisaId = ++this.pesquisaAtual;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (termo.length < 2) {
      // Atualiza ou consulta estado da pagina.
      this.resultados = [];
      // Atualiza ou consulta estado da pagina.
      this.pesquisou = false;
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.pesquisou = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.carregarLocalizacaoAtual();
      // Cria uma variavel local para esta operacao.
      const resultados = await this.nominatimService.pesquisarLocais(termo);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (pesquisaId !== this.pesquisaAtual) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.resultados = resultados
        // Executa uma instrucao necessaria para este fluxo.
        .map(local => this.adicionarDistancia(local))
        // Executa uma instrucao necessaria para este fluxo.
        .sort((a, b) => (a.distanciaKm ?? Number.MAX_SAFE_INTEGER) - (b.distanciaKm ?? Number.MAX_SAFE_INTEGER));
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (pesquisaId !== this.pesquisaAtual) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.resultados = [];
      // Atualiza ou consulta estado da pagina.
      this.erro = error?.message || 'Erro ao pesquisar locais.';
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (pesquisaId === this.pesquisaAtual) {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      }
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  limparPesquisa() {
    // Atualiza ou consulta estado da pagina.
    this.termoPesquisa = '';
    // Atualiza ou consulta estado da pagina.
    this.resultados = [];
    // Atualiza ou consulta estado da pagina.
    this.pesquisou = false;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';
    // Atualiza ou consulta estado da pagina.
    this.carregando = false;
    // Atualiza ou consulta estado da pagina.
    this.pesquisaAtual++;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirMapa(local: NominatimSearchResult) {
    // Cria uma variavel local para esta operacao.
    const url = `https://www.openstreetmap.org/?mlat=${local.latitude}&mlon=${local.longitude}#map=16/${local.latitude}/${local.longitude}`;
    // Executa uma instrucao necessaria para este fluxo.
    window.open(url, '_blank');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  pesquisarSugestao(termo: string) {
    // Atualiza ou consulta estado da pagina.
    this.termoPesquisa = termo;
    // Atualiza ou consulta estado da pagina.
    this.pesquisar();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async criarViagemSugerida(sugestao: SugestaoViagem) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.criandoSugestaoId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.criandoSugestaoId = sugestao.id;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const dataInicio = new Date();
      // Executa uma instrucao necessaria para este fluxo.
      dataInicio.setHours(9, 0, 0, 0);
      // Cria uma variavel local para esta operacao.
      const dataFim = new Date(dataInicio);
      // Executa uma instrucao necessaria para este fluxo.
      dataFim.setDate(dataInicio.getDate() + sugestao.duracaoDias - 1);

      // Cria uma variavel local para esta operacao.
      const dias = sugestao.dias.map((dia, diaIndex) => {
        // Cria uma variavel local para esta operacao.
        const dataDia = new Date(dataInicio);
        // Executa uma instrucao necessaria para este fluxo.
        dataDia.setDate(dataInicio.getDate() + diaIndex);

        // Devolve o resultado deste bloco.
        return {
          // Define um campo ou opcao de configuracao.
          id: `dia-${Date.now()}-${diaIndex}`,
          // Define um campo ou opcao de configuracao.
          titulo: dia.titulo,
          // Define um campo ou opcao de configuracao.
          data: dataDia,
          // Define um campo ou opcao de configuracao.
          local: dia.local,
          // Define um campo ou opcao de configuracao.
          pontosInteresse: dia.pontosInteresse.map((poi, poiIndex) =>
            // Atualiza ou consulta estado da pagina.
            this.criarPoiSugerido(poi, diaIndex, poiIndex)
          )
        };
      });

      // Cria uma variavel local para esta operacao.
      const viagemId = await this.viagensService.createViagem({
        // Define um campo ou opcao de configuracao.
        titulo: sugestao.titulo,
        // Define um campo ou opcao de configuracao.
        descricao: sugestao.descricao,
        // Define um campo ou opcao de configuracao.
        local: sugestao.local,
        // Define um campo ou opcao de configuracao.
        fotoCapaUrl: sugestao.fotoCapaUrl,
        // Executa uma instrucao necessaria para este fluxo.
        dataInicio,
        // Executa uma instrucao necessaria para este fluxo.
        dataFim,
        // Executa uma instrucao necessaria para este fluxo.
        dias,
        // Define um campo ou opcao de configuracao.
        status: 'planejada'
      });

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: `${sugestao.titulo} criada com POIs sugeridos.`,
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', viagemId]);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error?.message || 'Não foi possível criar a viagem sugerida.',
        // Define um campo ou opcao de configuracao.
        duration: 2500,
        // Define um campo ou opcao de configuracao.
        color: 'danger'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.criandoSugestaoId = '';
    }
  }

  // Define um membro interno desta classe.
  private async carregarImagensDasSugestoes(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.carregandoImagensSugestoes) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.carregandoImagensSugestoes = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await Promise.all(this.sugestoesViagem.map(async sugestao => {
        // Executa uma instrucao necessaria para este fluxo.
        sugestao.fotoCapaUrl = await this.obterImagemWikimedia(sugestao.imagemPesquisa);

        // Cria uma variavel local para esta operacao.
        const pois = sugestao.dias.reduce<SugestaoPoi[]>(
          // Executa uma instrucao necessaria para este fluxo.
          (todos, dia) => [...todos, ...dia.pontosInteresse],
          // Executa uma instrucao necessaria para este fluxo.
          []
        );

        // Aguarda a conclusao de uma operacao assincrona.
        await Promise.all(pois.map(async poi => {
          // Executa uma instrucao necessaria para este fluxo.
          poi.fotoUrl = await this.obterImagemWikimedia(poi.imagemPesquisa || `${poi.nome} ${sugestao.local}`);
        }));
      }));
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Não foi possível carregar imagens das sugestões:', error);
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.carregandoImagensSugestoes = false;
    }
  }

  // Define um membro interno desta classe.
  private async obterImagemWikimedia(termo: string): Promise<string | undefined> {
    // Cria uma variavel local para esta operacao.
    const params = new URLSearchParams({
      // Define um campo ou opcao de configuracao.
      action: 'query',
      // Define um campo ou opcao de configuracao.
      format: 'json',
      // Define um campo ou opcao de configuracao.
      origin: '*',
      // Define um campo ou opcao de configuracao.
      generator: 'search',
      // Define um campo ou opcao de configuracao.
      gsrnamespace: '6',
      // Define um campo ou opcao de configuracao.
      gsrlimit: '1',
      // Define um campo ou opcao de configuracao.
      gsrsearch: termo,
      // Define um campo ou opcao de configuracao.
      prop: 'imageinfo',
      // Define um campo ou opcao de configuracao.
      iiprop: 'url',
      // Define um campo ou opcao de configuracao.
      iiurlwidth: '900'
    });

    // Cria uma variavel local para esta operacao.
    const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!response.ok) {
      // Devolve o resultado deste bloco.
      return undefined;
    }

    // Cria uma variavel local para esta operacao.
    const data = await response.json() as {
      // Executa uma instrucao necessaria para este fluxo.
      query?: {
        // Executa uma instrucao necessaria para este fluxo.
        pages?: Record<string, {
          // Executa uma instrucao necessaria para este fluxo.
          imageinfo?: Array<{
            // Executa uma instrucao necessaria para este fluxo.
            thumburl?: string;
            // Executa uma instrucao necessaria para este fluxo.
            url?: string;
          // Executa uma instrucao necessaria para este fluxo.
          }>;
        // Executa uma instrucao necessaria para este fluxo.
        }>;
      };
    };

    // Cria uma variavel local para esta operacao.
    const pages = Object.values(data.query?.pages || {});
    // Cria uma variavel local para esta operacao.
    const imageInfo = pages[0]?.imageinfo?.[0];

    // Devolve o resultado deste bloco.
    return imageInfo?.thumburl || imageInfo?.url;
  }

  // Define um membro interno desta classe.
  private criarPoiSugerido(poi: SugestaoPoi, diaIndex: number, poiIndex: number): POI {
    // Cria uma variavel local para esta operacao.
    const poiSugerido: POI = {
      // Define um campo ou opcao de configuracao.
      id: `poi-${Date.now()}-${diaIndex}-${poiIndex}`,
      // Define um campo ou opcao de configuracao.
      nome: poi.nome,
      // Define um campo ou opcao de configuracao.
      tipo: poi.tipo,
      // Define um campo ou opcao de configuracao.
      categoria: poi.categoria,
      // Define um campo ou opcao de configuracao.
      endereco: poi.endereco,
      // Define um campo ou opcao de configuracao.
      latitude: poi.latitude,
      // Define um campo ou opcao de configuracao.
      longitude: poi.longitude,
      // Define um campo ou opcao de configuracao.
      ordem: poiIndex
    };

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (poi.descricao?.trim()) {
      // Executa uma instrucao necessaria para este fluxo.
      poiSugerido.descricao = poi.descricao.trim();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (poi.fotoUrl?.trim()) {
      // Executa uma instrucao necessaria para este fluxo.
      poiSugerido.fotoUrl = poi.fotoUrl.trim();
    }

    // Devolve o resultado deste bloco.
    return poiSugerido;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarAoItinerario(local: ResultadoDescobrir, event?: Event) {
    // Executa uma instrucao necessaria para este fluxo.
    event?.stopPropagation();

    // Cria uma variavel local para esta operacao.
    const destino = this.obterDestinoSelecionado();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!destino) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: 'Escolha uma viagem e um dia para adicionar o local.',
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'warning'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.adicionandoPoiId = this.criarChaveResultado(local);

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const poi: POI = {
        // Define um campo ou opcao de configuracao.
        id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        // Define um campo ou opcao de configuracao.
        nome: local.nome,
        // Define um campo ou opcao de configuracao.
        tipo: local.categoria,
        // Define um campo ou opcao de configuracao.
        categoria: local.categoria,
        // Define um campo ou opcao de configuracao.
        endereco: local.endereco,
        // Define um campo ou opcao de configuracao.
        latitude: local.latitude,
        // Define um campo ou opcao de configuracao.
        longitude: local.longitude,
        // Define um campo ou opcao de configuracao.
        ordem: this.obterProximaOrdem(destino.viagemId, destino.diaId)
      };

      // Cria uma variavel local para esta operacao.
      const currentUser = getAuth().currentUser;
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (currentUser) {
        // Executa uma instrucao necessaria para este fluxo.
        poi.colaboradorUid = currentUser.uid;
        // Executa uma instrucao necessaria para este fluxo.
        poi.colaboradorEmail = currentUser.email || undefined;
        // Executa uma instrucao necessaria para este fluxo.
        poi.colaboradorNome = currentUser.displayName || undefined;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.poiService.adicionarPOI(destino.viagemId, destino.diaId, poi);

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: `${local.nome} adicionado ao itinerário.`,
        // Define um campo ou opcao de configuracao.
        duration: 1800,
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error?.message || 'Não foi possível adicionar o local ao itinerário.',
        // Define um campo ou opcao de configuracao.
        duration: 2500,
        // Define um campo ou opcao de configuracao.
        color: 'danger'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.adicionandoPoiId = '';
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  criarChaveResultado(local: NominatimSearchResult): string {
    // Devolve o resultado deste bloco.
    return `${local.latitude},${local.longitude}`;
  }

  // Define um membro interno desta classe.
  private atualizarDestinosItinerario() {
    // Atualiza ou consulta estado da pagina.
    this.destinosItinerario = this.viagens.reduce<DestinoItinerario[]>((destinos, viagem) => {
      // Cria uma variavel local para esta operacao.
      const destinosDaViagem = (viagem.dias || []).map(dia => ({
        // Define um campo ou opcao de configuracao.
        valor: `${viagem.id}|${dia.id}`,
        // Define um campo ou opcao de configuracao.
        viagemId: viagem.id,
        // Define um campo ou opcao de configuracao.
        diaId: dia.id,
        // Define um campo ou opcao de configuracao.
        rotulo: `${viagem.titulo} - ${dia.titulo || this.formatarData(dia.data)}`
      }));

      // Devolve o resultado deste bloco.
      return [...destinos, ...destinosDaViagem];
    // Executa uma instrucao necessaria para este fluxo.
    }, []);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.destinosItinerario.some(destino => destino.valor === this.destinoSelecionado)) {
      // Atualiza ou consulta estado da pagina.
      this.destinoSelecionado = this.destinosItinerario[0]?.valor || '';
    }
  }

  // Define um membro interno desta classe.
  private atualizarSugestoesAutomaticas() {
    // Cria uma variavel local para esta operacao.
    const contagens = new Map<string, number>();

    // Atualiza ou consulta estado da pagina.
    this.viagens.forEach(viagem => {
      // Executa uma instrucao necessaria para este fluxo.
      (viagem.dias || []).forEach(dia => {
        // Executa uma instrucao necessaria para este fluxo.
        (dia.pontosInteresse || []).forEach(poi => {
          // Executa uma instrucao necessaria para este fluxo.
          [poi.categoria, poi.tipo].forEach(valor => {
            // Cria uma variavel local para esta operacao.
            const termo = valor?.trim();

            // Define um metodo chamado pela pagina ou por outros metodos.
            if (termo && termo.length > 2) {
              // Executa uma instrucao necessaria para este fluxo.
              contagens.set(termo, (contagens.get(termo) || 0) + 1);
            }
          });
        });
      });
    });

    // Atualiza ou consulta estado da pagina.
    this.sugestoesAutomaticas = Array.from(contagens.entries())
      // Executa uma instrucao necessaria para este fluxo.
      .sort((a, b) => b[1] - a[1])
      // Executa uma instrucao necessaria para este fluxo.
      .slice(0, 6)
      // Executa uma instrucao necessaria para este fluxo.
      .map(([termo]) => termo);
  }

  // Define um membro interno desta classe.
  private obterDestinoSelecionado(): DestinoItinerario | undefined {
    // Devolve o resultado deste bloco.
    return this.destinosItinerario.find(destino => destino.valor === this.destinoSelecionado);
  }

  // Define um membro interno desta classe.
  private obterProximaOrdem(viagemId: string, diaId: string): number {
    // Cria uma variavel local para esta operacao.
    const viagem = this.viagens.find(item => item.id === viagemId);
    // Cria uma variavel local para esta operacao.
    const dia = viagem?.dias?.find(item => item.id === diaId);
    // Cria uma variavel local para esta operacao.
    const ordens = (dia?.pontosInteresse || []).map(poi => poi.ordem ?? 0);

    // Devolve o resultado deste bloco.
    return ordens.length > 0 ? Math.max(...ordens) + 1 : 0;
  }

  // Define um membro interno desta classe.
  private async carregarLocalizacaoAtual() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.localizacaoAtual) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const posicao = await this.geolocationService.getCurrentPosition();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (posicao) {
      // Atualiza ou consulta estado da pagina.
      this.localizacaoAtual = {
        // Define um campo ou opcao de configuracao.
        latitude: posicao.coords.latitude,
        // Define um campo ou opcao de configuracao.
        longitude: posicao.coords.longitude
      };
    }
  }

  // Define um membro interno desta classe.
  private adicionarDistancia(local: NominatimSearchResult): ResultadoDescobrir {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.localizacaoAtual) {
      // Devolve o resultado deste bloco.
      return {
        // Executa uma instrucao necessaria para este fluxo.
        ...local,
        // Define um campo ou opcao de configuracao.
        distanciaTexto: 'Distancia indisponivel'
      };
    }

    // Cria uma variavel local para esta operacao.
    const distanciaKm = this.geolocationService.calculateDistance(
      // Atualiza ou consulta estado da pagina.
      this.localizacaoAtual.latitude,
      // Atualiza ou consulta estado da pagina.
      this.localizacaoAtual.longitude,
      // Executa uma instrucao necessaria para este fluxo.
      local.latitude,
      // Executa uma instrucao necessaria para este fluxo.
      local.longitude
    );

    // Devolve o resultado deste bloco.
    return {
      // Executa uma instrucao necessaria para este fluxo.
      ...local,
      // Executa uma instrucao necessaria para este fluxo.
      distanciaKm,
      // Define um campo ou opcao de configuracao.
      distanciaTexto: this.formatarDistancia(distanciaKm)
    };
  }

  // Define um membro interno desta classe.
  private formatarDistancia(distanciaKm: number): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (distanciaKm < 1) {
      // Devolve o resultado deste bloco.
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    // Devolve o resultado deste bloco.
    return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
  }

  // Define um membro interno desta classe.
  private formatarData(data: Date | string | { toDate: () => Date }): string {
    // Cria uma variavel local para esta operacao.
    const dataFormatada = data instanceof Date
      // Executa uma instrucao necessaria para este fluxo.
      ? data
      // Executa uma instrucao necessaria para este fluxo.
      : typeof data === 'string'
        // Executa uma instrucao necessaria para este fluxo.
        ? new Date(data)
        // Executa uma instrucao necessaria para este fluxo.
        : data.toDate();

    // Devolve o resultado deste bloco.
    return dataFormatada.toLocaleDateString('pt-PT');
  }
}
