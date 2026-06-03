import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';
import { GeolocationService } from '../../services/geolocation.service';
import { POI, Viagem } from '../../models/viagem.model';
import { POIService } from '../../services/poi.service';
import { ViagensService } from '../../services/viagens.service';
import { getAuth } from 'firebase/auth';

interface ResultadoDescobrir extends NominatimSearchResult {
  distanciaKm?: number;
  distanciaTexto: string;
}

interface DestinoItinerario {
  valor: string;
  viagemId: string;
  diaId: string;
  rotulo: string;
}

interface SugestaoPoi {
  nome: string;
  tipo: string;
  categoria: string;
  endereco: string;
  latitude: number;
  longitude: number;
  descricao?: string;
}

interface SugestaoDia {
  titulo: string;
  local: string;
  pontosInteresse: SugestaoPoi[];
}

interface SugestaoViagem {
  id: string;
  titulo: string;
  local: string;
  descricao: string;
  duracaoDias: number;
  destaque: string;
  dias: SugestaoDia[];
}

/**
 * DescobrirPage - Página de Descobrir
 * Exibe viagens recomendadas e exploração de locais
 */
@Component({
  selector: 'app-descobrir',
  templateUrl: 'descobrir.page.html',
  styleUrls: ['descobrir.page.scss'],
  standalone: false,
})
export class DescobrirPage implements OnInit, OnDestroy {
  termoPesquisa = '';
  resultados: ResultadoDescobrir[] = [];
  viagens: Viagem[] = [];
  destinosItinerario: DestinoItinerario[] = [];
  destinoSelecionado = '';
  sugestoesAutomaticas: string[] = [];
  carregando = false;
  pesquisou = false;
  erro = '';
  adicionandoPoiId = '';
  criandoSugestaoId = '';
  sugestoesViagem: SugestaoViagem[] = [
    {
      id: 'lisboa-fim-semana',
      titulo: 'Fim de semana em Lisboa',
      local: 'Lisboa, Portugal',
      descricao: 'Um roteiro curto com miradouros, cultura e boa comida no centro da cidade.',
      duracaoDias: 2,
      destaque: 'Cultura, vistas e gastronomia',
      dias: [
        {
          titulo: 'Baixa, Chiado e Alfama',
          local: 'Lisboa',
          pontosInteresse: [
            {
              nome: 'Praça do Comércio',
              tipo: 'Praça histórica',
              categoria: 'cultura',
              endereco: 'Praça do Comércio, Lisboa',
              latitude: 38.7076,
              longitude: -9.1366,
              descricao: 'Bom ponto de partida junto ao Tejo.'
            },
            {
              nome: 'Elevador de Santa Justa',
              tipo: 'Miradouro',
              categoria: 'cultura',
              endereco: 'Rua do Ouro, Lisboa',
              latitude: 38.7121,
              longitude: -9.1395
            },
            {
              nome: 'Miradouro de Santa Luzia',
              tipo: 'Miradouro',
              categoria: 'natureza',
              endereco: 'Largo de Santa Luzia, Lisboa',
              latitude: 38.7118,
              longitude: -9.1300
            }
          ]
        },
        {
          titulo: 'Belém',
          local: 'Lisboa',
          pontosInteresse: [
            {
              nome: 'Mosteiro dos Jerónimos',
              tipo: 'Monumento',
              categoria: 'cultura',
              endereco: 'Praça do Império, Lisboa',
              latitude: 38.6979,
              longitude: -9.2068
            },
            {
              nome: 'Torre de Belém',
              tipo: 'Monumento',
              categoria: 'cultura',
              endereco: 'Avenida Brasília, Lisboa',
              latitude: 38.6916,
              longitude: -9.2160
            },
            {
              nome: 'Pastéis de Belém',
              tipo: 'Pastelaria',
              categoria: 'gastronomia',
              endereco: 'Rua de Belém 84, Lisboa',
              latitude: 38.6975,
              longitude: -9.2032
            }
          ]
        }
      ]
    },
    {
      id: 'porto-ribeira',
      titulo: 'Porto clássico',
      local: 'Porto, Portugal',
      descricao: 'Percurso a pé entre centro histórico, livrarias, pontes e ribeira.',
      duracaoDias: 2,
      destaque: 'Centro histórico e Ribeira',
      dias: [
        {
          titulo: 'Centro histórico',
          local: 'Porto',
          pontosInteresse: [
            {
              nome: 'Torre dos Clérigos',
              tipo: 'Monumento',
              categoria: 'cultura',
              endereco: 'Rua de São Filipe de Nery, Porto',
              latitude: 41.1457,
              longitude: -8.6147
            },
            {
              nome: 'Livraria Lello',
              tipo: 'Livraria',
              categoria: 'cultura',
              endereco: 'Rua das Carmelitas 144, Porto',
              latitude: 41.1469,
              longitude: -8.6148
            },
            {
              nome: 'Estação de São Bento',
              tipo: 'Estação histórica',
              categoria: 'cultura',
              endereco: 'Praça de Almeida Garrett, Porto',
              latitude: 41.1456,
              longitude: -8.6109
            }
          ]
        },
        {
          titulo: 'Ribeira e Gaia',
          local: 'Porto',
          pontosInteresse: [
            {
              nome: 'Cais da Ribeira',
              tipo: 'Zona histórica',
              categoria: 'cultura',
              endereco: 'Cais da Ribeira, Porto',
              latitude: 41.1406,
              longitude: -8.6110
            },
            {
              nome: 'Ponte Luís I',
              tipo: 'Ponte',
              categoria: 'cultura',
              endereco: 'Ponte Luís I, Porto',
              latitude: 41.1398,
              longitude: -8.6094
            },
            {
              nome: 'Jardim do Morro',
              tipo: 'Miradouro',
              categoria: 'natureza',
              endereco: 'Jardim do Morro, Vila Nova de Gaia',
              latitude: 41.1383,
              longitude: -8.6090
            }
          ]
        }
      ]
    },
    {
      id: 'sintra-romantica',
      titulo: 'Sintra romântica',
      local: 'Sintra, Portugal',
      descricao: 'Uma escapadinha por palácios, jardins e centro histórico.',
      duracaoDias: 1,
      destaque: 'Palácios e natureza',
      dias: [
        {
          titulo: 'Palácios e centro',
          local: 'Sintra',
          pontosInteresse: [
            {
              nome: 'Palácio Nacional da Pena',
              tipo: 'Palácio',
              categoria: 'cultura',
              endereco: 'Estrada da Pena, Sintra',
              latitude: 38.7876,
              longitude: -9.3906
            },
            {
              nome: 'Quinta da Regaleira',
              tipo: 'Palácio e jardim',
              categoria: 'cultura',
              endereco: 'Rua Barbosa du Bocage, Sintra',
              latitude: 38.7962,
              longitude: -9.3965
            },
            {
              nome: 'Centro Histórico de Sintra',
              tipo: 'Centro histórico',
              categoria: 'cultura',
              endereco: 'Sintra',
              latitude: 38.7974,
              longitude: -9.3904
            }
          ]
        }
      ]
    }
  ];

  private pesquisaAtual = 0;
  private localizacaoAtual?: { latitude: number; longitude: number };
  private viagensSubscription?: Subscription;

  constructor(
    private nominatimService: NominatimService,
    private geolocationService: GeolocationService,
    private viagensService: ViagensService,
    private poiService: POIService,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  ngOnInit() {
    this.viagensSubscription = this.viagensService.getViagens().subscribe({
      next: viagens => {
        this.viagens = viagens;
        this.atualizarDestinosItinerario();
        this.atualizarSugestoesAutomaticas();
      },
      error: error => {
        console.warn('Não foi possível carregar viagens para descobrir:', error);
      }
    });
  }

  ngOnDestroy() {
    this.viagensSubscription?.unsubscribe();
  }

  async pesquisar(event?: CustomEvent) {
    const valor = (event?.detail as { value?: string } | undefined)?.value;

    if (typeof valor === 'string') {
      this.termoPesquisa = valor;
    }

    const termo = this.termoPesquisa.trim();
    const pesquisaId = ++this.pesquisaAtual;
    this.erro = '';

    if (termo.length < 2) {
      this.resultados = [];
      this.pesquisou = false;
      this.carregando = false;
      return;
    }

    this.carregando = true;
    this.pesquisou = true;

    try {
      await this.carregarLocalizacaoAtual();
      const resultados = await this.nominatimService.pesquisarLocais(termo);

      if (pesquisaId !== this.pesquisaAtual) {
        return;
      }

      this.resultados = resultados
        .map(local => this.adicionarDistancia(local))
        .sort((a, b) => (a.distanciaKm ?? Number.MAX_SAFE_INTEGER) - (b.distanciaKm ?? Number.MAX_SAFE_INTEGER));
    } catch (error: any) {
      if (pesquisaId !== this.pesquisaAtual) {
        return;
      }

      this.resultados = [];
      this.erro = error?.message || 'Erro ao pesquisar locais.';
    } finally {
      if (pesquisaId === this.pesquisaAtual) {
        this.carregando = false;
      }
    }
  }

  limparPesquisa() {
    this.termoPesquisa = '';
    this.resultados = [];
    this.pesquisou = false;
    this.erro = '';
    this.carregando = false;
    this.pesquisaAtual++;
  }

  abrirMapa(local: NominatimSearchResult) {
    const url = `https://www.openstreetmap.org/?mlat=${local.latitude}&mlon=${local.longitude}#map=16/${local.latitude}/${local.longitude}`;
    window.open(url, '_blank');
  }

  pesquisarSugestao(termo: string) {
    this.termoPesquisa = termo;
    this.pesquisar();
  }

  async criarViagemSugerida(sugestao: SugestaoViagem) {
    if (this.criandoSugestaoId) {
      return;
    }

    this.criandoSugestaoId = sugestao.id;

    try {
      const dataInicio = new Date();
      dataInicio.setHours(9, 0, 0, 0);
      const dataFim = new Date(dataInicio);
      dataFim.setDate(dataInicio.getDate() + sugestao.duracaoDias - 1);

      const dias = sugestao.dias.map((dia, diaIndex) => {
        const dataDia = new Date(dataInicio);
        dataDia.setDate(dataInicio.getDate() + diaIndex);

        return {
          id: `dia-${Date.now()}-${diaIndex}`,
          titulo: dia.titulo,
          data: dataDia,
          local: dia.local,
          pontosInteresse: dia.pontosInteresse.map((poi, poiIndex) =>
            this.criarPoiSugerido(poi, diaIndex, poiIndex)
          )
        };
      });

      const viagemId = await this.viagensService.createViagem({
        titulo: sugestao.titulo,
        descricao: sugestao.descricao,
        local: sugestao.local,
        dataInicio,
        dataFim,
        dias,
        status: 'planejada'
      });

      const toast = await this.toastCtrl.create({
        message: `${sugestao.titulo} criada com POIs sugeridos.`,
        duration: 2200,
        color: 'success'
      });
      await toast.present();
      this.router.navigate(['/tabs', 'viagens', viagemId]);
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.message || 'Não foi possível criar a viagem sugerida.',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.criandoSugestaoId = '';
    }
  }

  private criarPoiSugerido(poi: SugestaoPoi, diaIndex: number, poiIndex: number): POI {
    const poiSugerido: POI = {
      id: `poi-${Date.now()}-${diaIndex}-${poiIndex}`,
      nome: poi.nome,
      tipo: poi.tipo,
      categoria: poi.categoria,
      endereco: poi.endereco,
      latitude: poi.latitude,
      longitude: poi.longitude,
      ordem: poiIndex
    };

    if (poi.descricao?.trim()) {
      poiSugerido.descricao = poi.descricao.trim();
    }

    return poiSugerido;
  }

  async adicionarAoItinerario(local: ResultadoDescobrir, event?: Event) {
    event?.stopPropagation();

    const destino = this.obterDestinoSelecionado();

    if (!destino) {
      const toast = await this.toastCtrl.create({
        message: 'Escolha uma viagem e um dia para adicionar o local.',
        duration: 2200,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    this.adicionandoPoiId = this.criarChaveResultado(local);

    try {
      const poi: POI = {
        id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nome: local.nome,
        tipo: local.categoria,
        categoria: local.categoria,
        endereco: local.endereco,
        latitude: local.latitude,
        longitude: local.longitude,
        ordem: this.obterProximaOrdem(destino.viagemId, destino.diaId)
      };

      const currentUser = getAuth().currentUser;
      if (currentUser) {
        poi.colaboradorUid = currentUser.uid;
        poi.colaboradorEmail = currentUser.email || undefined;
        poi.colaboradorNome = currentUser.displayName || undefined;
      }

      await this.poiService.adicionarPOI(destino.viagemId, destino.diaId, poi);

      const toast = await this.toastCtrl.create({
        message: `${local.nome} adicionado ao itinerário.`,
        duration: 1800,
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.message || 'Não foi possível adicionar o local ao itinerário.',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.adicionandoPoiId = '';
    }
  }

  criarChaveResultado(local: NominatimSearchResult): string {
    return `${local.latitude},${local.longitude}`;
  }

  private atualizarDestinosItinerario() {
    this.destinosItinerario = this.viagens.reduce<DestinoItinerario[]>((destinos, viagem) => {
      const destinosDaViagem = (viagem.dias || []).map(dia => ({
        valor: `${viagem.id}|${dia.id}`,
        viagemId: viagem.id,
        diaId: dia.id,
        rotulo: `${viagem.titulo} - ${dia.titulo || this.formatarData(dia.data)}`
      }));

      return [...destinos, ...destinosDaViagem];
    }, []);

    if (!this.destinosItinerario.some(destino => destino.valor === this.destinoSelecionado)) {
      this.destinoSelecionado = this.destinosItinerario[0]?.valor || '';
    }
  }

  private atualizarSugestoesAutomaticas() {
    const contagens = new Map<string, number>();

    this.viagens.forEach(viagem => {
      (viagem.dias || []).forEach(dia => {
        (dia.pontosInteresse || []).forEach(poi => {
          [poi.categoria, poi.tipo].forEach(valor => {
            const termo = valor?.trim();

            if (termo && termo.length > 2) {
              contagens.set(termo, (contagens.get(termo) || 0) + 1);
            }
          });
        });
      });
    });

    this.sugestoesAutomaticas = Array.from(contagens.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([termo]) => termo);
  }

  private obterDestinoSelecionado(): DestinoItinerario | undefined {
    return this.destinosItinerario.find(destino => destino.valor === this.destinoSelecionado);
  }

  private obterProximaOrdem(viagemId: string, diaId: string): number {
    const viagem = this.viagens.find(item => item.id === viagemId);
    const dia = viagem?.dias?.find(item => item.id === diaId);
    const ordens = (dia?.pontosInteresse || []).map(poi => poi.ordem ?? 0);

    return ordens.length > 0 ? Math.max(...ordens) + 1 : 0;
  }

  private async carregarLocalizacaoAtual() {
    if (this.localizacaoAtual) {
      return;
    }

    const posicao = await this.geolocationService.getCurrentPosition();

    if (posicao) {
      this.localizacaoAtual = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude
      };
    }
  }

  private adicionarDistancia(local: NominatimSearchResult): ResultadoDescobrir {
    if (!this.localizacaoAtual) {
      return {
        ...local,
        distanciaTexto: 'Distancia indisponivel'
      };
    }

    const distanciaKm = this.geolocationService.calculateDistance(
      this.localizacaoAtual.latitude,
      this.localizacaoAtual.longitude,
      local.latitude,
      local.longitude
    );

    return {
      ...local,
      distanciaKm,
      distanciaTexto: this.formatarDistancia(distanciaKm)
    };
  }

  private formatarDistancia(distanciaKm: number): string {
    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
  }

  private formatarData(data: Date | string | { toDate: () => Date }): string {
    const dataFormatada = data instanceof Date
      ? data
      : typeof data === 'string'
        ? new Date(data)
        : data.toDate();

    return dataFormatada.toLocaleDateString('pt-PT');
  }
}
