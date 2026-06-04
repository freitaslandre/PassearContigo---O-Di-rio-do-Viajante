// app/pages/itinerario-dia/itinerario-dia.page.ts | Controlador da pagina itinerario dia, onde ficam os dados, eventos e chamadas aos servicos.
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ItemReorderEventDetail, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Subscription } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { Colaborador, Dia, POI, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { GeolocationService } from '../../services/geolocation.service';
// Importa dependencias usadas neste ficheiro.
import { MapCacheService } from '../../services/map-cache.service';
// Importa dependencias usadas neste ficheiro.
import { POIService } from '../../services/poi.service';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { ItinerarioPdfService } from '../../services/itinerario-pdf.service';
// Importa dependencias usadas neste ficheiro.
import { PdfShareService } from '../../services/pdf-share.service';
// Importa dependencias usadas neste ficheiro.
import * as L from 'leaflet';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-itinerario-dia',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './itinerario-dia.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./itinerario-dia.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ItinerarioDiaPage implements OnInit, AfterViewInit, OnDestroy {
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild('mapaItinerario') mapaItinerario?: ElementRef<HTMLDivElement>;

  // Atribui um valor a esta propriedade.
  viagemId = '';
  // Atribui um valor a esta propriedade.
  diaId = '';
  // Define um campo ou opcao de configuracao.
  dia: Dia | null = null;
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  dias: Dia[] = [];
  // Atribui um valor a esta propriedade.
  diaAtualIndex = -1;
  // Define um campo ou opcao de configuracao.
  colaboradores: Colaborador[] = [];
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  guardandoOrdem = false;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Atribui um valor a esta propriedade.
  mapaOfflineDisponivel = false;

  // Define um membro interno desta classe.
  private routeSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private viagemSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private mapaLeaflet: L.Map | null = null;
  // Define um membro interno desta classe.
  private tileLayerLeaflet: L.TileLayer | null = null;
  // Define um membro interno desta classe.
  private marcadoresLeaflet: L.Marker[] = [];
  // Define um membro interno desta classe.
  private rotaLeaflet: L.Polyline | null = null;
  // Define um membro interno desta classe.
  private viewInicializada = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private geolocationService: GeolocationService,
    // Define um membro interno desta classe.
    private mapCacheService: MapCacheService,
    // Define um membro interno desta classe.
    private poiService: POIService,
    // Define um membro interno desta classe.
    private itinerarioPdfService: ItinerarioPdfService,
    // Define um membro interno desta classe.
    private pdfShareService: PdfShareService,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub = this.route.paramMap.subscribe(params => {
      // Cria uma variavel local para esta operacao.
      const viagemId = params.get('id') || this.obterParametroDaRota('id');
      // Cria uma variavel local para esta operacao.
      const diaId = params.get('diaId');

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!viagemId || !diaId) {
        // Atualiza ou consulta estado da pagina.
        this.erro = 'ID de viagem ou dia inválido.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.viagemId = viagemId;
      // Atualiza ou consulta estado da pagina.
      this.diaId = diaId;
      // Atualiza ou consulta estado da pagina.
      this.carregarDia();
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngAfterViewInit() {
    // Atualiza ou consulta estado da pagina.
    this.viewInicializada = true;
    // Atualiza ou consulta estado da pagina.
    this.atualizarMapaItinerarioEmBreve();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.destruirMapa();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemId && this.diaId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  adicionarPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.diaId || !this.podeEditarViagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'adicionar-poi']);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temDiaAnterior(): boolean {
    // Devolve o resultado deste bloco.
    return this.diaAtualIndex > 0;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temDiaProximo(): boolean {
    // Devolve o resultado deste bloco.
    return this.diaAtualIndex >= 0 && this.diaAtualIndex < this.dias.length - 1;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get textoPosicaoDia(): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.diaAtualIndex < 0 || this.dias.length === 0) {
      // Devolve o resultado deste bloco.
      return '';
    }

    // Devolve o resultado deste bloco.
    return `${this.diaAtualIndex + 1} de ${this.dias.length}`;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDiaAnterior() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temDiaAnterior) return;
    // Atualiza ou consulta estado da pagina.
    this.irParaItinerarioDoDia(this.dias[this.diaAtualIndex - 1].id);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDiaProximo() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temDiaProximo) return;
    // Atualiza ou consulta estado da pagina.
    this.irParaItinerarioDoDia(this.dias[this.diaAtualIndex + 1].id);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirPoi(poi: POI) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.diaId || !poi.id) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'poi', poi.id]);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get pontosOrdenados(): POI[] {
    // Devolve o resultado deste bloco.
    return [...(this.dia?.pontosInteresse || [])].sort((a, b) => {
      // Cria uma variavel local para esta operacao.
      const ordemA = this.normalizarOrdem(a.ordem);
      // Cria uma variavel local para esta operacao.
      const ordemB = this.normalizarOrdem(b.ordem);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (ordemA !== ordemB) {
        // Devolve o resultado deste bloco.
        return ordemA - ordemB;
      }

      // Cria uma variavel local para esta operacao.
      const horarioA = this.normalizarHorario(a.horario);
      // Cria uma variavel local para esta operacao.
      const horarioB = this.normalizarHorario(b.horario);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (horarioA !== horarioB) {
        // Devolve o resultado deste bloco.
        return horarioA - horarioB;
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      return (a.nome || '').localeCompare(b.nome || '', 'pt-PT', { sensitivity: 'base' });
    });
  }

  // Executa uma instrucao necessaria para este fluxo.
  get pontosOrdenadosComLocalizacao(): POI[] {
    // Devolve o resultado deste bloco.
    return this.pontosOrdenados.filter(poi => this.temCoordenadas(poi));
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async reordenarPois(event: CustomEvent<ItemReorderEventDetail>) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.dia || this.guardandoOrdem || !this.podeEditarViagem) {
      // Executa uma instrucao necessaria para este fluxo.
      event.detail.complete();
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const novaOrdem = event.detail.complete(this.pontosOrdenados) as POI[];
    // Cria uma variavel local para esta operacao.
    const pontosInteresse = novaOrdem.map((poi, index) => ({
      // Executa uma instrucao necessaria para este fluxo.
      ...poi,
      // Define um campo ou opcao de configuracao.
      ordem: index
    }));

    // Atualiza ou consulta estado da pagina.
    this.dia = {
      // Executa uma instrucao necessaria para este fluxo.
      ...this.dia,
      // Executa uma instrucao necessaria para este fluxo.
      pontosInteresse
    };

    // Aguarda a conclusao de uma operacao assincrona.
    await this.persistirOrdemPois(pontosInteresse);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterFotoPoi(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterColaboradorPorPoi(poi: POI): Colaborador | undefined {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!poi.colaboradorUid) {
      // Devolve o resultado deste bloco.
      return undefined;
    }
    // Devolve o resultado deste bloco.
    return this.colaboradores.find(colaborador => colaborador.uid === poi.colaboradorUid);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterColaboradorLabel(poi: POI): string {
    // Cria uma variavel local para esta operacao.
    const colaborador = this.obterColaboradorPorPoi(poi);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (colaborador) {
      // Devolve o resultado deste bloco.
      return colaborador.nome?.trim() || colaborador.email || 'Colaborador';
    }

    // Devolve o resultado deste bloco.
    return poi.colaboradorNome?.trim() || poi.colaboradorEmail || '';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterInicialColaborador(poi: POI): string | undefined {
    // Cria uma variavel local para esta operacao.
    const label = this.obterColaboradorLabel(poi);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!label) {
      // Devolve o resultado deste bloco.
      return undefined;
    }

    // Cria uma variavel local para esta operacao.
    const parts = label.split(/\s+/).filter(Boolean);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (parts.length === 0) {
      // Devolve o resultado deste bloco.
      return undefined;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (parts.length === 1) {
      // Devolve o resultado deste bloco.
      return parts[0].slice(0, 2).toUpperCase();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterHorario(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.horario?.trim() || 'Sem hora';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarData(data: Date | string | any): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  trackByPoiId(index: number, poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.id || String(index);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  temOrdemManual(poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return typeof poi.ordem === 'number';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTempoEntrePois(index: number): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (index <= 0) {
      // Devolve o resultado deste bloco.
      return '';
    }

    // Cria uma variavel local para esta operacao.
    const pois = this.pontosOrdenados;
    // Cria uma variavel local para esta operacao.
    const anterior = pois[index - 1];
    // Cria uma variavel local para esta operacao.
    const atual = pois[index];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temCoordenadas(anterior) || !this.temCoordenadas(atual)) {
      // Devolve o resultado deste bloco.
      return 'Distância indisponível';
    }

    // Cria uma variavel local para esta operacao.
    const distanciaKm = this.geolocationService.calculateDistance(
      // Executa uma instrucao necessaria para este fluxo.
      anterior.latitude!,
      // Executa uma instrucao necessaria para este fluxo.
      anterior.longitude!,
      // Executa uma instrucao necessaria para este fluxo.
      atual.latitude!,
      // Executa uma instrucao necessaria para este fluxo.
      atual.longitude!
    );
    // Cria uma variavel local para esta operacao.
    const minutos = Math.max(1, Math.round((distanciaKm / 5) * 60));

    // Devolve o resultado deste bloco.
    return `${this.formatarDistancia(distanciaKm)} · ${this.formatarDuracao(minutos)} a pé`;
  }

  // Define um membro interno desta classe.
  private carregarDia() {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';
    // Atualiza ou consulta estado da pagina.
    this.dia = null;

    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      // Define um campo ou opcao de configuracao.
      next: async (viagem) => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!viagem) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Viagem não encontrada.';
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
          // Devolve o resultado deste bloco.
          return;
        }

        // Atualiza ou consulta estado da pagina.
        this.viagem = viagem;
        // Atualiza ou consulta estado da pagina.
        this.colaboradores = viagem.colaboradores || [];
        // Atualiza ou consulta estado da pagina.
        this.dias = [...(viagem.dias || [])].sort((a, b) => {
          // Devolve o resultado deste bloco.
          return this.obterTimestampData(a.data) - this.obterTimestampData(b.data);
        });
        // Atualiza ou consulta estado da pagina.
        this.diaAtualIndex = this.dias.findIndex(dia => dia.id === this.diaId);
        // Cria uma variavel local para esta operacao.
        const diaEncontrado = this.dias[this.diaAtualIndex];

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!diaEncontrado) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Dia não encontrado.';
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
          // Devolve o resultado deste bloco.
          return;
        }

        // Atualiza ou consulta estado da pagina.
        this.dia = await this.juntarPoisLocaisPendentes(diaEncontrado);
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.atualizarMapaItinerarioEmBreve();
      },
      // Define um campo ou opcao de configuracao.
      error: (err) => {
        // Atualiza ou consulta estado da pagina.
        this.erro = err?.message || 'Erro ao carregar itinerário.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar itinerário do dia:', err);
      }
    });
  }

  // Define um membro interno desta classe.
  private irParaItinerarioDoDia(diaId: string) {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', diaId, 'itinerario']);
  }

  // Define um membro interno desta classe.
  private async juntarPoisLocaisPendentes(dia: Dia): Promise<Dia> {
    // Cria uma variavel local para esta operacao.
    const poisLocais = await this.poiService.obterPOIsLocaisPendentesPorDia(this.viagemId, dia.id);
    // Cria uma variavel local para esta operacao.
    const idsRemotos = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    // Cria uma variavel local para esta operacao.
    const poisLocaisNovos = poisLocais.filter(poi => !idsRemotos.has(poi.id));

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (poisLocaisNovos.length === 0) {
      // Devolve o resultado deste bloco.
      return dia;
    }

    // Devolve o resultado deste bloco.
    return {
      // Executa uma instrucao necessaria para este fluxo.
      ...dia,
      // Define um campo ou opcao de configuracao.
      pontosInteresse: [...(dia.pontosInteresse || []), ...poisLocaisNovos]
    };
  }

  // Define um membro interno desta classe.
  private async persistirOrdemPois(pontosInteresse: POI[]): Promise<void> {
    // Atualiza ou consulta estado da pagina.
    this.guardandoOrdem = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!viagem?.dias) {
        // Executa uma instrucao necessaria para este fluxo.
        throw new Error('Viagem não encontrada.');
      }

      // Cria uma variavel local para esta operacao.
      const dias = viagem.dias.map(dia => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (dia.id !== this.diaId) {
          // Devolve o resultado deste bloco.
          return dia;
        }

        // Devolve o resultado deste bloco.
        return {
          // Executa uma instrucao necessaria para este fluxo.
          ...dia,
          // Define um campo ou opcao de configuracao.
          pontosInteresse: this.juntarOrdemComPoisAtuais(dia.pontosInteresse || [], pontosInteresse)
        };
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagemId, { dias } as Partial<Viagem>);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Ordem do itinerário guardada.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao guardar ordem dos POIs:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao guardar ordem.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.guardandoOrdem = false;
    }
  }

  // Define um membro interno desta classe.
  private juntarOrdemComPoisAtuais(poisAtuais: POI[], poisOrdenados: POI[]): POI[] {
    // Cria uma variavel local para esta operacao.
    const ordemPorId = new Map(poisOrdenados.map((poi, index) => [poi.id, index]));

    // Devolve o resultado deste bloco.
    return poisAtuais
      // Executa uma instrucao necessaria para este fluxo.
      .map(poi => ({
        // Executa uma instrucao necessaria para este fluxo.
        ...poi,
        // Define um campo ou opcao de configuracao.
        ordem: ordemPorId.get(poi.id) ?? poi.ordem
      }))
      // Executa uma instrucao necessaria para este fluxo.
      .sort((a, b) => this.normalizarOrdem(a.ordem) - this.normalizarOrdem(b.ordem));
  }

  // Define um membro interno desta classe.
  private normalizarOrdem(ordem?: number): number {
    // Devolve o resultado deste bloco.
    return typeof ordem === 'number' ? ordem : Number.MAX_SAFE_INTEGER;
  }

  // Define um membro interno desta classe.
  private normalizarHorario(horario?: string): number {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!horario?.trim()) {
      // Devolve o resultado deste bloco.
      return Number.MAX_SAFE_INTEGER;
    }

    // Cria uma variavel local para esta operacao.
    const match = horario.match(/(\d{1,2})(?::|h)?(\d{2})?/);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!match) {
      // Devolve o resultado deste bloco.
      return Number.MAX_SAFE_INTEGER - 1;
    }

    // Cria uma variavel local para esta operacao.
    const horas = Number(match[1]);
    // Cria uma variavel local para esta operacao.
    const minutos = match[2] ? Number(match[2]) : 0;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (Number.isNaN(horas) || Number.isNaN(minutos)) {
      // Devolve o resultado deste bloco.
      return Number.MAX_SAFE_INTEGER - 1;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    return (horas * 60) + minutos;
  }

  // Define um membro interno desta classe.
  private temCoordenadas(poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return typeof poi.latitude === 'number' && typeof poi.longitude === 'number';
  }

  // Define um membro interno desta classe.
  private atualizarMapaItinerarioEmBreve(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    setTimeout(() => this.atualizarMapaItinerario(), 120);
  }

  // Define um membro interno desta classe.
  private atualizarMapaItinerario(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viewInicializada || !this.mapaItinerario?.nativeElement) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const poisComLocalizacao = this.pontosOrdenadosComLocalizacao;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (poisComLocalizacao.length === 0) {
      // Atualiza ou consulta estado da pagina.
      this.destruirMapa();
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const centro: L.LatLngExpression = [poisComLocalizacao[0].latitude!, poisComLocalizacao[0].longitude!];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.mapaLeaflet) {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet = L.map(this.mapaItinerario.nativeElement, {
        // Define um campo ou opcao de configuracao.
        zoomControl: true
      // Executa uma instrucao necessaria para este fluxo.
      }).setView(centro, 15);
      // Atualiza ou consulta estado da pagina.
      this.tileLayerLeaflet = this.criarTileLayerComCache().addTo(this.mapaLeaflet);
    }

    // Atualiza ou consulta estado da pagina.
    this.destruirCamadasMapa();

    // Cria uma variavel local para esta operacao.
    const pontos: L.LatLngExpression[] = [];

    // Executa uma instrucao necessaria para este fluxo.
    poisComLocalizacao.forEach((poi, index) => {
      // Cria uma variavel local para esta operacao.
      const posicao: L.LatLngExpression = [poi.latitude!, poi.longitude!];
      // Cria uma variavel local para esta operacao.
      const marcador = L.marker(posicao, {
        // Define um campo ou opcao de configuracao.
        icon: this.criarIconePoi(poi, index)
      // Executa uma instrucao necessaria para este fluxo.
      }).addTo(this.mapaLeaflet!);

      // Executa uma instrucao necessaria para este fluxo.
      marcador.bindPopup(this.criarPopupPoi(poi, index));
      // Executa uma instrucao necessaria para este fluxo.
      marcador.on('click', () => this.abrirPoi(poi));
      // Atualiza ou consulta estado da pagina.
      this.marcadoresLeaflet.push(marcador);
      // Executa uma instrucao necessaria para este fluxo.
      pontos.push(posicao);
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (pontos.length > 1) {
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet = L.polyline(pontos, {
        // Define um campo ou opcao de configuracao.
        color: '#2c7a6e',
        // Define um campo ou opcao de configuracao.
        dashArray: '8 8',
        // Define um campo ou opcao de configuracao.
        lineCap: 'round',
        // Define um campo ou opcao de configuracao.
        lineJoin: 'round',
        // Define um campo ou opcao de configuracao.
        opacity: 0.86,
        // Define um campo ou opcao de configuracao.
        weight: 4
      // Executa uma instrucao necessaria para este fluxo.
      }).addTo(this.mapaLeaflet);

      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.fitBounds(L.latLngBounds(pontos), {
        // Define um campo ou opcao de configuracao.
        maxZoom: 16,
        // Define um campo ou opcao de configuracao.
        padding: [28, 28]
      });
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.setView(centro, 16);
    }

    // Atualiza ou consulta estado da pagina.
    this.mapaOfflineDisponivel = true;
    // Define um metodo chamado pela pagina ou por outros metodos.
    setTimeout(() => this.mapaLeaflet?.invalidateSize(), 100);
  }

  // Define um membro interno desta classe.
  private criarTileLayerComCache(): L.TileLayer {
    // Cria uma variavel local para esta operacao.
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      // Define um campo ou opcao de configuracao.
      attribution: '&copy; OpenStreetMap contributors',
      // Define um campo ou opcao de configuracao.
      maxZoom: 19
    });

    // Cria uma variavel local para esta operacao.
    const originalGetTileUrl = tileLayer.getTileUrl.bind(tileLayer);
    // Executa uma instrucao necessaria para este fluxo.
    tileLayer.getTileUrl = (coords: L.Coords) => {
      // Cria uma variavel local para esta operacao.
      const url = originalGetTileUrl(coords);
      // Atualiza ou consulta estado da pagina.
      this.cachearTileEmBackground(url);
      // Devolve o resultado deste bloco.
      return url;
    };

    // Cria uma variavel local para esta operacao.
    const tileLayerComCreateTile = tileLayer as any;
    // Cria uma variavel local para esta operacao.
    const originalCreateTile = tileLayerComCreateTile.createTile.bind(tileLayerComCreateTile);
    // Executa uma instrucao necessaria para este fluxo.
    tileLayerComCreateTile.createTile = (coords: L.Coords, done: L.DoneCallback) => {
      // Cria uma variavel local para esta operacao.
      const tile = originalCreateTile(coords, done) as HTMLImageElement;
      // Cria uma variavel local para esta operacao.
      const url = tileLayer.getTileUrl(coords);

      // Executa uma instrucao necessaria para este fluxo.
      tile.onerror = async () => {
        // Cria uma variavel local para esta operacao.
        const cacheBlob = await this.mapCacheService.obterTile(url);
        // Executa uma instrucao necessaria para este fluxo.
        tile.src = cacheBlob ? URL.createObjectURL(cacheBlob) : this.criarTileOffline();
      };

      // Devolve o resultado deste bloco.
      return tile;
    };

    // Devolve o resultado deste bloco.
    return tileLayer;
  }

  // Define um membro interno desta classe.
  private cachearTileEmBackground(url: string): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    fetch(url)
      // Executa uma instrucao necessaria para este fluxo.
      .then(res => res.ok ? res.blob() : null)
      // Executa uma instrucao necessaria para este fluxo.
      .then(blob => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (blob) {
          // Atualiza ou consulta estado da pagina.
          this.mapCacheService.cachearTile(url, blob);
        }
      })
      // Executa uma instrucao necessaria para este fluxo.
      .catch(() => {});
  }

  // Define um membro interno desta classe.
  private criarTileOffline(): string {
    // Cria uma variavel local para esta operacao.
    const canvas = document.createElement('canvas');
    // Executa uma instrucao necessaria para este fluxo.
    canvas.width = 256;
    // Executa uma instrucao necessaria para este fluxo.
    canvas.height = 256;
    // Cria uma variavel local para esta operacao.
    const ctx = canvas.getContext('2d');

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (ctx) {
      // Executa uma instrucao necessaria para este fluxo.
      ctx.fillStyle = '#f0f0f0';
      // Executa uma instrucao necessaria para este fluxo.
      ctx.fillRect(0, 0, 256, 256);
      // Executa uma instrucao necessaria para este fluxo.
      ctx.fillStyle = '#8a8a8a';
      // Executa uma instrucao necessaria para este fluxo.
      ctx.font = '600 16px sans-serif';
      // Executa uma instrucao necessaria para este fluxo.
      ctx.textAlign = 'center';
      // Executa uma instrucao necessaria para este fluxo.
      ctx.textBaseline = 'middle';
      // Executa uma instrucao necessaria para este fluxo.
      ctx.fillText('Offline', 128, 128);
    }

    // Devolve o resultado deste bloco.
    return canvas.toDataURL('image/png');
  }

  // Define um membro interno desta classe.
  private destruirMapa(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.mapaLeaflet) {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.remove();
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet = null;
    }

    // Atualiza ou consulta estado da pagina.
    this.tileLayerLeaflet = null;
    // Atualiza ou consulta estado da pagina.
    this.marcadoresLeaflet = [];
    // Atualiza ou consulta estado da pagina.
    this.rotaLeaflet = null;
  }

  // Define um membro interno desta classe.
  private destruirCamadasMapa(): void {
    // Atualiza ou consulta estado da pagina.
    this.marcadoresLeaflet.forEach(marcador => marcador.remove());
    // Atualiza ou consulta estado da pagina.
    this.marcadoresLeaflet = [];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.rotaLeaflet) {
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet.remove();
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet = null;
    }
  }

  // Define um membro interno desta classe.
  private criarIconePoi(poi: POI, index: number): L.DivIcon {
    // Cria uma variavel local para esta operacao.
    const numero = String(index + 1);
    // Cria uma variavel local para esta operacao.
    const cor = this.obterCorPin(poi.categoria);

    // Devolve o resultado deste bloco.
    return L.divIcon({
      // Define um campo ou opcao de configuracao.
      className: '',
      // Define um campo ou opcao de configuracao.
      html: `
        // Executa uma instrucao necessaria para este fluxo.
        <span style="
          // Executa uma instrucao necessaria para este fluxo.
          align-items:center;background:${cor};border:2px solid #fff;border-radius:50% 50% 50% 0;
          // Executa uma instrucao necessaria para este fluxo.
          box-shadow:0 3px 8px rgba(0, 0, 0, 0.28);color:#fff;display:flex;font-size:12px;
          // Executa uma instrucao necessaria para este fluxo.
          font-weight:700;height:30px;justify-content:center;line-height:1;transform:rotate(-45deg);width:30px;">
          // Executa uma instrucao necessaria para este fluxo.
          <span style="transform:rotate(45deg);">${numero}</span>
        // Executa uma instrucao necessaria para este fluxo.
        </span>
      // Executa uma instrucao necessaria para este fluxo.
      `,
      // Define um campo ou opcao de configuracao.
      iconAnchor: [15, 34],
      // Define um campo ou opcao de configuracao.
      iconSize: [30, 34],
      // Define um campo ou opcao de configuracao.
      popupAnchor: [0, -30]
    });
  }

  // Define um membro interno desta classe.
  private criarPopupPoi(poi: POI, index: number): string {
    // Cria uma variavel local para esta operacao.
    const nome = this.escapeHtml(poi.nome || `POI ${index + 1}`);
    // Cria uma variavel local para esta operacao.
    const tipo = poi.tipo || poi.categoria;
    // Cria uma variavel local para esta operacao.
    const endereco = poi.endereco;

    // Devolve o resultado deste bloco.
    return [
      // Executa uma instrucao necessaria para este fluxo.
      `<strong>${index + 1}. ${nome}</strong>`,
      // Executa uma instrucao necessaria para este fluxo.
      tipo ? `<br><span>${this.escapeHtml(tipo)}</span>` : '',
      // Executa uma instrucao necessaria para este fluxo.
      endereco ? `<br><small>${this.escapeHtml(endereco)}</small>` : ''
    // Executa uma instrucao necessaria para este fluxo.
    ].join('');
  }

  // Define um membro interno desta classe.
  private escapeHtml(valor: string): string {
    // Devolve o resultado deste bloco.
    return valor
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/&/g, '&amp;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/</g, '&lt;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/>/g, '&gt;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/"/g, '&quot;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/'/g, '&#039;');
  }

  // Define um membro interno desta classe.
  private obterCorPin(categoria?: string): string {
    // Cria uma variavel local para esta operacao.
    const cores: Record<string, string> = {
      // Define um campo ou opcao de configuracao.
      gastronomia: '#e8823a',
      // Define um campo ou opcao de configuracao.
      cultura: '#5e35b1',
      // Define um campo ou opcao de configuracao.
      natureza: '#2c7a6e',
      // Define um campo ou opcao de configuracao.
      aventura: '#d84315',
      // Define um campo ou opcao de configuracao.
      compras: '#c2185b',
      // Define um campo ou opcao de configuracao.
      hospedagem: '#00796b',
      // Define um campo ou opcao de configuracao.
      outro: '#607d8b'
    };

    // Devolve o resultado deste bloco.
    return cores[categoria || 'outro'] || cores['outro'];
  }

  // Define um membro interno desta classe.
  private formatarDistancia(distanciaKm: number): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (distanciaKm < 1) {
      // Devolve o resultado deste bloco.
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    // Devolve o resultado deste bloco.
    return `${distanciaKm.toFixed(1)} km`;
  }

  // Define um membro interno desta classe.
  private formatarDuracao(minutos: number): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (minutos < 60) {
      // Devolve o resultado deste bloco.
      return `${minutos} min`;
    }

    // Cria uma variavel local para esta operacao.
    const horas = Math.floor(minutos / 60);
    // Cria uma variavel local para esta operacao.
    const minutosRestantes = minutos % 60;

    // Devolve o resultado deste bloco.
    return minutosRestantes > 0
      // Executa uma instrucao necessaria para este fluxo.
      ? `${horas} h ${minutosRestantes} min`
      // Executa uma instrucao necessaria para este fluxo.
      : `${horas} h`;
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return new Date(data);
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      return (data as any).toDate();
    }
    // Devolve o resultado deste bloco.
    return new Date(data);
  }

  // Define um membro interno desta classe.
  private obterTimestampData(data: Date | string | any): number {
    // Devolve o resultado deste bloco.
    return this.converterParaDate(data).getTime() || 0;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async compartilharDiaEmPdf() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.dia) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Impossível gerar PDF. Dados incompletos.', 'danger');
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const pdf = this.itinerarioPdfService.criarDiaPdf({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        dia: this.dia,
        // Define um campo ou opcao de configuracao.
        indexDia: this.diaAtualIndex + 1,
        // Define um campo ou opcao de configuracao.
        totalDias: this.dias.length
      });

      // Cria uma variavel local para esta operacao.
      const podeCompartilhar = await this.pdfShareService.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (podeCompartilhar) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.pdfShareService.sharePdf(pdf, {
          // Define um campo ou opcao de configuracao.
          title: `Dia ${this.diaAtualIndex + 1} - ${this.viagem.titulo}`,
          // Define um campo ou opcao de configuracao.
          text: `Compartilhando o dia ${this.diaAtualIndex + 1} do itinerário de "${this.viagem.titulo}"`,
          // Define um campo ou opcao de configuracao.
          dialogTitle: 'Partilhar Dia em PDF'
        });
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Dia partilhado com sucesso!', 'success');
      // Executa uma instrucao necessaria para este fluxo.
      } else {
        // Atualiza ou consulta estado da pagina.
        this.itinerarioPdfService.gerarDiaDownload({
          // Define um campo ou opcao de configuracao.
          viagem: this.viagem,
          // Define um campo ou opcao de configuracao.
          dia: this.dia,
          // Define um campo ou opcao de configuracao.
          indexDia: this.diaAtualIndex + 1,
          // Define um campo ou opcao de configuracao.
          totalDias: this.dias.length
        });
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('PDF transferido para download.', 'success');
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF do dia:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Erro ao gerar PDF do dia.', 'danger');
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  exportarDiaEmPdf() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.dia) {
      // Atualiza ou consulta estado da pagina.
      this.mostrarToast('Impossível gerar PDF. Dados incompletos.', 'danger');
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Atualiza ou consulta estado da pagina.
      this.itinerarioPdfService.gerarDiaDownload({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        dia: this.dia,
        // Define um campo ou opcao de configuracao.
        indexDia: this.diaAtualIndex + 1,
        // Define um campo ou opcao de configuracao.
        totalDias: this.dias.length
      });
      // Atualiza ou consulta estado da pagina.
      this.mostrarToast('Dia exportado em PDF!', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF do dia:', error);
      // Atualiza ou consulta estado da pagina.
      this.mostrarToast('Erro ao gerar PDF do dia.', 'danger');
    }
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: 'success' | 'danger') {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 1600,
      // Executa uma instrucao necessaria para este fluxo.
      color
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  // Define um membro interno desta classe.
  private obterParametroDaRota(nome: string): string | null {
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const rota of [...this.route.pathFromRoot].reverse()) {
      // Cria uma variavel local para esta operacao.
      const valor = rota.snapshot.paramMap.get(nome);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (valor) {
        // Devolve o resultado deste bloco.
        return valor;
      }
    }

    // Devolve o resultado deste bloco.
    return null;
  }
}
