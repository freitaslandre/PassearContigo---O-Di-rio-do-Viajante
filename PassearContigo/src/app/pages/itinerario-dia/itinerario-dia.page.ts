import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ItemReorderEventDetail, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Colaborador, Dia, POI, Viagem } from '../../models/viagem.model';
import { GeolocationService } from '../../services/geolocation.service';
import { POIService } from '../../services/poi.service';
import { ViagensService } from '../../services/viagens.service';

@Component({
  selector: 'app-itinerario-dia',
  standalone: false,
  templateUrl: './itinerario-dia.page.html',
  styleUrls: ['./itinerario-dia.page.scss']
})
export class ItinerarioDiaPage implements OnInit, OnDestroy {
  viagemId = '';
  diaId = '';
  dia: Dia | null = null;
  viagem: Viagem | null = null;
  dias: Dia[] = [];
  diaAtualIndex = -1;
  colaboradores: Colaborador[] = [];
  carregando = true;
  guardandoOrdem = false;
  erro = '';

  private routeSub: Subscription | null = null;
  private viagemSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private geolocationService: GeolocationService,
    private poiService: POIService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const viagemId = params.get('id') || this.obterParametroDaRota('id');
      const diaId = params.get('diaId');

      if (!viagemId || !diaId) {
        this.erro = 'ID de viagem ou dia inválido.';
        this.carregando = false;
        return;
      }

      this.viagemId = viagemId;
      this.diaId = diaId;
      this.carregarDia();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.unsubscribe();
  }

  voltar() {
    if (this.viagemId && this.diaId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
      return;
    }

    this.router.navigate(['/tabs', 'viagens']);
  }

  adicionarPoi() {
    if (!this.viagemId || !this.diaId || !this.podeEditarViagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'adicionar-poi']);
  }

  get podeEditarViagem(): boolean {
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  get temDiaAnterior(): boolean {
    return this.diaAtualIndex > 0;
  }

  get temDiaProximo(): boolean {
    return this.diaAtualIndex >= 0 && this.diaAtualIndex < this.dias.length - 1;
  }

  get textoPosicaoDia(): string {
    if (this.diaAtualIndex < 0 || this.dias.length === 0) {
      return '';
    }

    return `${this.diaAtualIndex + 1} de ${this.dias.length}`;
  }

  irParaDiaAnterior() {
    if (!this.temDiaAnterior) return;
    this.irParaItinerarioDoDia(this.dias[this.diaAtualIndex - 1].id);
  }

  irParaDiaProximo() {
    if (!this.temDiaProximo) return;
    this.irParaItinerarioDoDia(this.dias[this.diaAtualIndex + 1].id);
  }

  abrirPoi(poi: POI) {
    if (!this.viagemId || !this.diaId || !poi.id) return;
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'poi', poi.id]);
  }

  get pontosOrdenados(): POI[] {
    return [...(this.dia?.pontosInteresse || [])].sort((a, b) => {
      const ordemA = this.normalizarOrdem(a.ordem);
      const ordemB = this.normalizarOrdem(b.ordem);

      if (ordemA !== ordemB) {
        return ordemA - ordemB;
      }

      const horarioA = this.normalizarHorario(a.horario);
      const horarioB = this.normalizarHorario(b.horario);

      if (horarioA !== horarioB) {
        return horarioA - horarioB;
      }

      return (a.nome || '').localeCompare(b.nome || '', 'pt-PT', { sensitivity: 'base' });
    });
  }

  async reordenarPois(event: CustomEvent<ItemReorderEventDetail>) {
    if (!this.dia || this.guardandoOrdem || !this.podeEditarViagem) {
      event.detail.complete();
      return;
    }

    const novaOrdem = event.detail.complete(this.pontosOrdenados) as POI[];
    const pontosInteresse = novaOrdem.map((poi, index) => ({
      ...poi,
      ordem: index
    }));

    this.dia = {
      ...this.dia,
      pontosInteresse
    };

    await this.persistirOrdemPois(pontosInteresse);
  }

  obterFotoPoi(poi: POI): string {
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  obterColaboradorPorPoi(poi: POI): Colaborador | undefined {
    if (!poi.colaboradorUid) {
      return undefined;
    }
    return this.colaboradores.find(colaborador => colaborador.uid === poi.colaboradorUid);
  }

  obterColaboradorLabel(poi: POI): string {
    const colaborador = this.obterColaboradorPorPoi(poi);
    if (colaborador) {
      return colaborador.nome?.trim() || colaborador.email || 'Colaborador';
    }

    return poi.colaboradorNome?.trim() || poi.colaboradorEmail || '';
  }

  obterInicialColaborador(poi: POI): string | undefined {
    const label = this.obterColaboradorLabel(poi);
    if (!label) {
      return undefined;
    }

    const parts = label.split(/\s+/).filter(Boolean);
    if (parts.length === 0) {
      return undefined;
    }

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }

    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  obterHorario(poi: POI): string {
    return poi.horario?.trim() || 'Sem hora';
  }

  formatarData(data: Date | string | any): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  trackByPoiId(index: number, poi: POI): string {
    return poi.id || String(index);
  }

  temOrdemManual(poi: POI): boolean {
    return typeof poi.ordem === 'number';
  }

  obterTempoEntrePois(index: number): string {
    if (index <= 0) {
      return '';
    }

    const pois = this.pontosOrdenados;
    const anterior = pois[index - 1];
    const atual = pois[index];

    if (!this.temCoordenadas(anterior) || !this.temCoordenadas(atual)) {
      return 'Distância indisponível';
    }

    const distanciaKm = this.geolocationService.calculateDistance(
      anterior.latitude!,
      anterior.longitude!,
      atual.latitude!,
      atual.longitude!
    );
    const minutos = Math.max(1, Math.round((distanciaKm / 5) * 60));

    return `${this.formatarDistancia(distanciaKm)} · ${this.formatarDuracao(minutos)} a pé`;
  }

  private carregarDia() {
    this.carregando = true;
    this.erro = '';
    this.dia = null;

    this.viagemSub?.unsubscribe();
    this.viagemSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      next: async (viagem) => {
        if (!viagem) {
          this.erro = 'Viagem não encontrada.';
          this.carregando = false;
          return;
        }

        this.viagem = viagem;
        this.colaboradores = viagem.colaboradores || [];
        this.dias = [...(viagem.dias || [])].sort((a, b) => {
          return this.obterTimestampData(a.data) - this.obterTimestampData(b.data);
        });
        this.diaAtualIndex = this.dias.findIndex(dia => dia.id === this.diaId);
        const diaEncontrado = this.dias[this.diaAtualIndex];

        if (!diaEncontrado) {
          this.erro = 'Dia não encontrado.';
          this.carregando = false;
          return;
        }

        this.dia = await this.juntarPoisLocaisPendentes(diaEncontrado);
        this.carregando = false;
      },
      error: (err) => {
        this.erro = err?.message || 'Erro ao carregar itinerário.';
        this.carregando = false;
        console.error('Erro ao carregar itinerário do dia:', err);
      }
    });
  }

  private irParaItinerarioDoDia(diaId: string) {
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', diaId, 'itinerario']);
  }

  private async juntarPoisLocaisPendentes(dia: Dia): Promise<Dia> {
    const poisLocais = await this.poiService.obterPOIsLocaisPendentesPorDia(this.viagemId, dia.id);
    const idsRemotos = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    const poisLocaisNovos = poisLocais.filter(poi => !idsRemotos.has(poi.id));

    if (poisLocaisNovos.length === 0) {
      return dia;
    }

    return {
      ...dia,
      pontosInteresse: [...(dia.pontosInteresse || []), ...poisLocaisNovos]
    };
  }

  private async persistirOrdemPois(pontosInteresse: POI[]): Promise<void> {
    this.guardandoOrdem = true;

    try {
      const viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);

      if (!viagem?.dias) {
        throw new Error('Viagem não encontrada.');
      }

      const dias = viagem.dias.map(dia => {
        if (dia.id !== this.diaId) {
          return dia;
        }

        return {
          ...dia,
          pontosInteresse: this.juntarOrdemComPoisAtuais(dia.pontosInteresse || [], pontosInteresse)
        };
      });

      await this.viagensService.updateViagem(this.viagemId, { dias } as Partial<Viagem>);
      await this.mostrarToast('Ordem do itinerário guardada.', 'success');
    } catch (error: any) {
      console.error('Erro ao guardar ordem dos POIs:', error);
      await this.mostrarToast(error?.message || 'Erro ao guardar ordem.', 'danger');
    } finally {
      this.guardandoOrdem = false;
    }
  }

  private juntarOrdemComPoisAtuais(poisAtuais: POI[], poisOrdenados: POI[]): POI[] {
    const ordemPorId = new Map(poisOrdenados.map((poi, index) => [poi.id, index]));

    return poisAtuais
      .map(poi => ({
        ...poi,
        ordem: ordemPorId.get(poi.id) ?? poi.ordem
      }))
      .sort((a, b) => this.normalizarOrdem(a.ordem) - this.normalizarOrdem(b.ordem));
  }

  private normalizarOrdem(ordem?: number): number {
    return typeof ordem === 'number' ? ordem : Number.MAX_SAFE_INTEGER;
  }

  private normalizarHorario(horario?: string): number {
    if (!horario?.trim()) {
      return Number.MAX_SAFE_INTEGER;
    }

    const match = horario.match(/(\d{1,2})(?::|h)?(\d{2})?/);

    if (!match) {
      return Number.MAX_SAFE_INTEGER - 1;
    }

    const horas = Number(match[1]);
    const minutos = match[2] ? Number(match[2]) : 0;

    if (Number.isNaN(horas) || Number.isNaN(minutos)) {
      return Number.MAX_SAFE_INTEGER - 1;
    }

    return (horas * 60) + minutos;
  }

  private temCoordenadas(poi: POI): boolean {
    return typeof poi.latitude === 'number' && typeof poi.longitude === 'number';
  }

  private formatarDistancia(distanciaKm: number): string {
    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    return `${distanciaKm.toFixed(1)} km`;
  }

  private formatarDuracao(minutos: number): string {
    if (minutos < 60) {
      return `${minutos} min`;
    }

    const horas = Math.floor(minutos / 60);
    const minutosRestantes = minutos % 60;

    return minutosRestantes > 0
      ? `${horas} h ${minutosRestantes} min`
      : `${horas} h`;
  }

  private converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }
    if (typeof data === 'string') {
      return new Date(data);
    }
    if (data && typeof data === 'object' && 'toDate' in data) {
      return (data as any).toDate();
    }
    return new Date(data);
  }

  private obterTimestampData(data: Date | string | any): number {
    return this.converterParaDate(data).getTime() || 0;
  }

  private async mostrarToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 1600,
      color
    });
    await toast.present();
  }

  private obterParametroDaRota(nome: string): string | null {
    for (const rota of [...this.route.pathFromRoot].reverse()) {
      const valor = rota.snapshot.paramMap.get(nome);
      if (valor) {
        return valor;
      }
    }

    return null;
  }
}
