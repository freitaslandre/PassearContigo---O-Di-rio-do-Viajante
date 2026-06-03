import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Gesture, GestureController, ToastController } from '@ionic/angular';
import { Unsubscribe } from 'firebase/firestore';
import { Custo, Dia, POI, Viagem } from '../../models/viagem.model';
import { CustosService } from '../../services/custos.service';
import { DiarioPdfService } from '../../services/diario-pdf.service';
import { PdfShareService } from '../../services/pdf-share.service';
import { ViagensService } from '../../services/viagens.service';

interface LinhaCustoDiario {
  id: string;
  descricao: string;
  categoria: string;
  valor: number;
  moeda: string;
}

@Component({
  selector: 'app-diario-viagem',
  standalone: false,
  templateUrl: './diario-viagem.page.html',
  styleUrls: ['./diario-viagem.page.scss']
})
export class DiarioViagemPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('diarioSwipeArea') diarioSwipeArea?: ElementRef<HTMLElement>;

  viagemId = '';
  viagem: Viagem | null = null;
  dias: Dia[] = [];
  custosFirestore: Custo[] = [];
  diaAtualIndex = 0;
  carregando = true;
  guardando = false;
  gerandoPdf = false;
  partilhandoPdf = false;
  erro = '';

  private viagemSub: Unsubscribe | null = null;
  private custosSub: Unsubscribe | null = null;
  private swipeGesture: Gesture | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private custosService: CustosService,
    private diarioPdfService: DiarioPdfService,
    private pdfShareService: PdfShareService,
    private gestureCtrl: GestureController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    const viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id');

    if (!viagemId) {
      this.erro = 'ID de viagem invalido.';
      this.carregando = false;
      return;
    }

    this.viagemId = viagemId;
    this.carregarViagem(viagemId);
  }

  ngAfterViewInit() {
    this.criarGestoSwipe();
  }

  ngOnDestroy() {
    this.viagemSub?.();
    this.custosSub?.();
    this.swipeGesture?.destroy();
  }

  voltar() {
    if (this.viagemId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
    } else {
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  get diaAtual(): Dia | null {
    return this.dias[this.diaAtualIndex] || null;
  }

  get temDiaAnterior(): boolean {
    return this.diaAtualIndex > 0;
  }

  get temDiaProximo(): boolean {
    return this.diaAtualIndex < this.dias.length - 1;
  }

  get textoPosicaoDia(): string {
    if (this.dias.length === 0) {
      return '';
    }

    return `${this.diaAtualIndex + 1} de ${this.dias.length}`;
  }

  irParaDiaAnterior() {
    if (!this.temDiaAnterior) return;
    this.diaAtualIndex -= 1;
  }

  irParaDiaProximo() {
    if (!this.temDiaProximo) return;
    this.diaAtualIndex += 1;
  }

  irParaDia(index: number) {
    if (index < 0 || index >= this.dias.length) return;
    this.diaAtualIndex = index;
  }

  abrirDetalheDia() {
    if (!this.diaAtual || !this.viagemId) return;
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaAtual.id]);
  }

  abrirPoi(poi: POI) {
    if (!this.diaAtual || !this.viagemId || !poi.id) return;
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaAtual.id, 'poi', poi.id]);
  }

  async guardarNotaPoi(poi: POI) {
    if (!this.viagem || !this.diaAtual || this.guardando) return;

    poi.nota = poi.nota?.trim() || '';
    await this.guardarDiario();
  }

  obterFotoPoi(poi: POI): string {
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  obterCorStatus(status?: string): string {
    switch (status) {
      case 'planejada':
        return 'primary';
      case 'em-andamento':
        return 'warning';
      case 'concluida':
        return 'success';
      case 'cancelada':
        return 'danger';
      default:
        return 'medium';
    }
  }

  obterTextoStatus(status?: string): string {
    switch (status) {
      case 'planejada':
        return 'Planeada';
      case 'em-andamento':
        return 'Em curso';
      case 'concluida':
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Sem estado';
    }
  }

  obterCustoDia(dia: Dia): number {
    const totalPois = (dia.pontosInteresse || []).reduce((total, poi) => total + this.obterTotalCustoPoi(poi), 0);
    const totalCustosDia = this.obterCustosDia(dia)
      .filter(custo => !custo.poiId)
      .reduce((total, custo) => total + (Number(custo.valor) || 0), 0);

    return totalPois + totalCustosDia;
  }

  obterTotalCustoPoi(poi: POI): number {
    const custoDireto = Number(poi.custo) || 0;
    const custosAssociados = this.obterCustosPoi(poi)
      .reduce((total, custo) => total + (Number(custo.valor) || 0), 0);

    return custoDireto + custosAssociados;
  }

  obterCustosDia(dia: Dia): Custo[] {
    const poiIds = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    const custosFirestore = this.custosFirestore.filter(custo =>
      custo.diaId === dia.id || (custo.poiId ? poiIds.has(custo.poiId) : false)
    );
    const custosDia = dia.custos || [];
    const ids = new Set<string>();

    return [...custosFirestore, ...custosDia].filter(custo => {
      if (!custo.id) {
        return true;
      }

      if (ids.has(custo.id)) {
        return false;
      }

      ids.add(custo.id);
      return true;
    });
  }

  obterCustosPoi(poi: POI): Custo[] {
    return this.custosFirestore.filter(custo => custo.poiId === poi.id);
  }

  obterLinhasCustosDia(dia: Dia): LinhaCustoDiario[] {
    const linhas: LinhaCustoDiario[] = [];

    (dia.pontosInteresse || []).forEach((poi, index) => {
      const custoDireto = Number(poi.custo) || 0;

      if (custoDireto > 0) {
        linhas.push({
          id: `poi-${poi.id || index}`,
          descricao: poi.nome || `POI ${index + 1}`,
          categoria: poi.tipo || poi.categoria || 'Ponto de interesse',
          valor: custoDireto,
          moeda: 'EUR'
        });
      }
    });

    this.obterCustosDia(dia).forEach((custo, index) => {
      const valor = Number(custo.valor) || 0;

      if (valor <= 0) {
        return;
      }

      const poiAssociado = (dia.pontosInteresse || []).find(poi => poi.id === custo.poiId);

      linhas.push({
        id: custo.id || `custo-${index}`,
        descricao: custo.descricao || poiAssociado?.nome || 'Custo',
        categoria: custo.categoria || (poiAssociado ? 'Ponto de interesse' : 'Sem categoria'),
        valor,
        moeda: custo.moeda || 'EUR'
      });
    });

    return linhas;
  }

  obterNotaPoi(poi: POI): string {
    return poi.nota?.trim() || poi.descricao?.trim() || '';
  }

  diaTemRegistosIncompletos(dia: Dia): boolean {
    const semEntradaDiario = !dia.titulo?.trim()
      || !dia.data
      || (!dia.local?.trim() && !dia.descricao?.trim() && !dia.observacoes?.trim());

    return semEntradaDiario || (dia.pontosInteresse || []).some(poi => this.poiTemRegistoIncompleto(poi));
  }

  poiTemRegistoIncompleto(poi: POI): boolean {
    const semCusto = (poi.custo === undefined || poi.custo === null)
      && this.obterCustosPoi(poi).length === 0;

    return !poi.nome?.trim()
      || !poi.fotoUrl?.trim()
      || !this.obterNotaPoi(poi)
      || semCusto;
  }

  formatarValor(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  formatarData(data: Date | string | any): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  trackByPoiId(index: number, poi: POI): string {
    return poi.id || String(index);
  }

  trackByCustoId(index: number, custo: Custo): string {
    return custo.id || String(index);
  }

  async guardarDiario() {
    if (!this.viagem || this.guardando) return;

    this.guardando = true;

    try {
      await this.viagensService.updateViagem(this.viagem.id, {
        dias: this.dias
      });

      await this.mostrarToast('Diario guardado com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao guardar diario:', error);
      await this.mostrarToast(error?.message || 'Erro ao guardar diario.', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  async gerarPdfDiario() {
    if (!this.viagem || this.gerandoPdf) {
      return;
    }

    this.gerandoPdf = true;

    try {
      this.diarioPdfService.gerarDiarioCompleto({
        viagem: this.viagem,
        dias: this.dias,
        custos: this.custosFirestore
      });

      await this.mostrarToast('PDF do diario gerado com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao gerar PDF do diario:', error);
      await this.mostrarToast(error?.message || 'Erro ao gerar PDF do diario.', 'danger');
    } finally {
      this.gerandoPdf = false;
    }
  }

  async partilharPdfDiario() {
    if (!this.viagem || this.partilhandoPdf) {
      return;
    }

    this.partilhandoPdf = true;

    try {
      const podePartilhar = await this.pdfShareService.canShare();
      if (!podePartilhar) {
        await this.mostrarToast('Partilha de PDF não disponível neste dispositivo.', 'danger');
        return;
      }

      const pdf = this.diarioPdfService.criarDiarioCompleto({
        viagem: this.viagem,
        dias: this.dias,
        custos: this.custosFirestore
      });

      await this.pdfShareService.sharePdf(pdf, {
        title: this.viagem.titulo || 'Diário da viagem',
        text: 'PDF do diario completo da viagem.',
        dialogTitle: 'Partilhar diario'
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('cancel')) {
        return;
      }

      console.error('Erro ao partilhar PDF do diario:', error);
      await this.mostrarToast(error?.message || 'Erro ao partilhar PDF do diario.', 'danger');
    } finally {
      this.partilhandoPdf = false;
    }
  }

  private carregarViagem(viagemId: string) {
    this.carregando = true;
    this.erro = '';

    this.viagemSub?.();
    this.viagemSub = this.viagensService.subscribeToViagemById(
      viagemId,
      (viagem) => {
        this.carregando = false;
        this.viagem = viagem;

        if (!viagem) {
          this.erro = 'Viagem nao encontrada.';
          this.dias = [];
          return;
        }

        const diaAtualId = this.diaAtual?.id;
        this.dias = [...(viagem.dias || [])].sort((a, b) => {
          return this.obterTimestampData(a.data) - this.obterTimestampData(b.data);
        });

        const novoIndex = diaAtualId
          ? this.dias.findIndex(dia => dia.id === diaAtualId)
          : this.diaAtualIndex;

        this.diaAtualIndex = Math.min(Math.max(novoIndex, 0), Math.max(this.dias.length - 1, 0));
      },
      (error) => {
        this.carregando = false;
        this.erro = error?.message || 'Erro ao carregar diario.';
        console.error('Erro ao carregar diario:', error);
      }
    );

    this.custosSub?.();
    this.custosSub = this.custosService.subscribeToCustosByViagemId(
      viagemId,
      (custos) => {
        this.custosFirestore = custos;
      },
      (error) => {
        console.warn('Não foi possível carregar custos do diario:', error);
        this.custosFirestore = [];
      }
    );
  }

  private criarGestoSwipe() {
    const elemento = this.diarioSwipeArea?.nativeElement;
    if (!elemento) {
      return;
    }

    this.swipeGesture = this.gestureCtrl.create({
      el: elemento,
      gestureName: 'diario-viagem-swipe',
      threshold: 20,
      onEnd: (event) => {
        const distanciaSuficiente = Math.abs(event.deltaX) > 70;
        const velocidadeSuficiente = Math.abs(event.velocityX) > 0.2;

        if (!distanciaSuficiente && !velocidadeSuficiente) {
          return;
        }

        if (event.deltaX < 0) {
          this.irParaDiaProximo();
        } else {
          this.irParaDiaAnterior();
        }
      }
    });

    this.swipeGesture.enable(true);
  }

  private converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return data.toDate();
    }

    return new Date(data);
  }

  private obterTimestampData(data: Date | string | any): number {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  private async mostrarToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
