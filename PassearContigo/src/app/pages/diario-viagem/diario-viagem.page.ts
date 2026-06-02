import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Gesture, GestureController, ToastController } from '@ionic/angular';
import { Unsubscribe } from 'firebase/firestore';
import { Dia, POI, Viagem } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';

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
  diaAtualIndex = 0;
  carregando = true;
  guardando = false;
  erro = '';

  private viagemSub: Unsubscribe | null = null;
  private swipeGesture: Gesture | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
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

  obterFotoPoi(poi: POI): string {
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  obterCustoDia(dia: Dia): number {
    return (dia.pontosInteresse || []).reduce((total, poi) => total + (Number(poi.custo) || 0), 0);
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
