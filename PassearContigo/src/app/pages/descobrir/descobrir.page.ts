import { Component, OnDestroy, OnInit } from '@angular/core';
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

  private pesquisaAtual = 0;
  private localizacaoAtual?: { latitude: number; longitude: number };
  private viagensSubscription?: Subscription;

  constructor(
    private nominatimService: NominatimService,
    private geolocationService: GeolocationService,
    private viagensService: ViagensService,
    private poiService: POIService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.viagensSubscription = this.viagensService.getViagens().subscribe({
      next: viagens => {
        this.viagens = viagens;
        this.atualizarDestinosItinerario();
        this.atualizarSugestoesAutomaticas();
      },
      error: error => {
        console.warn('Nao foi possivel carregar viagens para descobrir:', error);
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
        message: `${local.nome} adicionado ao itinerario.`,
        duration: 1800,
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.message || 'Nao foi possivel adicionar o local ao itinerario.',
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
