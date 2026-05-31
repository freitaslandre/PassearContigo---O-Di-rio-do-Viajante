import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Dia, Viagem } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';

interface DiaViewModel {
  id: string;
  titulo: string;
  data: string;
  local: string;
  descricao: string;
  observacoes: string;
  pontosInteresse: Dia['pontosInteresse'];
  custos: Dia['custos'];
}

@Component({
  selector: 'app-viagem-detalhe',
  standalone: false,
  templateUrl: 'viagem-detalhe.page.html',
  styleUrls: ['viagem-detalhe.page.scss']
})
export class ViagemDetalhePage implements OnInit, OnDestroy {
  viagem: Viagem | null = null;
  dias: DiaViewModel[] = [];
  carregando = true;
  guardando = false;
  erro = '';

  titulo = '';
  descricao = '';
  local = '';
  dataInicio = '';
  dataFim = '';
  status: Viagem['status'] = 'planejada';

  private routeSub: Subscription | null = null;
  private viagemSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) {
        this.erro = 'ID de viagem invalido.';
        this.carregando = false;
        return;
      }

      this.carregarViagem(id);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.unsubscribe();
  }

  voltar() {
    this.router.navigate(['/tabs', 'viagens']);
  }

  irParaDia(diaId: string) {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId]);
  }

  adicionarDia() {
    const ultimaData = this.dias.length > 0
      ? this.dias[this.dias.length - 1].data
      : this.dataInicio;
    const novaData = this.adicionarUmDia(ultimaData || this.dataInicio);
    const numeroDia = this.dias.length + 1;

    this.dias.push({
      id: `dia-${novaData || Date.now()}`,
      titulo: `Dia ${numeroDia}`,
      data: novaData,
      local: '',
      descricao: '',
      observacoes: '',
      pontosInteresse: [],
      custos: []
    });
  }

  removerDia(index: number) {
    this.dias.splice(index, 1);
  }

  async guardar() {
    if (!this.viagem) return;

    if (!this.titulo.trim() || !this.local.trim() || !this.dataInicio || !this.dataFim) {
      await this.mostrarToast('Preencha titulo, destino e datas da viagem.', 'warning');
      return;
    }

    if (new Date(this.dataFim) < new Date(this.dataInicio)) {
      await this.mostrarToast('A data de fim nao pode ser anterior a data de inicio.', 'warning');
      return;
    }

    this.guardando = true;

    try {
      await this.viagensService.updateViagem(this.viagem.id, {
        titulo: this.titulo.trim(),
        descricao: this.descricao.trim() || undefined,
        local: this.local.trim(),
        dataInicio: new Date(this.dataInicio),
        dataFim: new Date(this.dataFim),
        status: this.status,
        dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
      });

      await this.mostrarToast('Viagem guardada com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao guardar viagem:', error);
      await this.mostrarToast(error?.message || 'Erro ao guardar viagem.', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  formatarData(data: Date | string | any): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  obterNumDias(dataInicio: Date | string | any, dataFim: Date | string | any): number {
    const inicio = this.converterParaDate(dataInicio);
    const fim = this.converterParaDate(dataFim);
    const differenceMs = fim.getTime() - inicio.getTime();
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
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
        return 'Planejada';
      case 'em-andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluida';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Sem Status';
    }
  }

  obterResumoCustos(dia: DiaViewModel): string {
    if (!dia.custos || dia.custos.length === 0) return 'Sem custos';
    const total = dia.custos.reduce((soma, custo) => soma + (custo.valor || 0), 0);
    return `${total.toFixed(2)} ${dia.custos[0].moeda || 'EUR'}`;
  }

  get totalDias(): number {
    return this.dias.length;
  }

  private carregarViagem(id: string) {
    this.carregando = true;
    this.erro = '';
    this.viagem = null;
    this.dias = [];

    this.viagemSub?.unsubscribe();
    this.viagemSub = this.viagensService.getViagemById(id).subscribe({
      next: (viagem) => {
        this.viagem = viagem ?? null;
        this.carregando = false;

        if (!viagem) {
          this.erro = 'Viagem nao encontrada ou nao pertence ao utilizador.';
          return;
        }

        this.preencherFormulario(viagem);
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err?.message || 'Erro ao carregar viagem.';
        console.error('Erro ao carregar viagem:', err);
      }
    });
  }

  private preencherFormulario(viagem: Viagem) {
    this.titulo = viagem.titulo;
    this.descricao = viagem.descricao || '';
    this.local = viagem.local || '';
    this.dataInicio = this.formatarDataInput(viagem.dataInicio);
    this.dataFim = this.formatarDataInput(viagem.dataFim);
    this.status = viagem.status || 'planejada';
    this.dias = (viagem.dias || []).map((dia, index) => ({
      id: dia.id || `dia-${index + 1}`,
      titulo: dia.titulo || `Dia ${index + 1}`,
      data: this.formatarDataInput(dia.data),
      local: dia.local || '',
      descricao: dia.descricao || '',
      observacoes: dia.observacoes || '',
      pontosInteresse: dia.pontosInteresse || [],
      custos: dia.custos || []
    }));
  }

  private converterDiaParaModel(dia: DiaViewModel, index: number): Dia {
    return {
      id: dia.id || `dia-${index + 1}`,
      titulo: dia.titulo.trim() || `Dia ${index + 1}`,
      data: new Date(dia.data || this.dataInicio),
      local: dia.local.trim() || undefined,
      descricao: dia.descricao.trim() || undefined,
      observacoes: dia.observacoes.trim() || undefined,
      pontosInteresse: dia.pontosInteresse || [],
      custos: dia.custos || []
    };
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

  private formatarDataInput(data: Date | string | any): string {
    const date = this.converterParaDate(data);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private adicionarUmDia(data: string): string {
    if (!data) {
      return this.formatarDataInput(new Date());
    }

    const date = new Date(data);
    date.setDate(date.getDate() + 1);
    return this.formatarDataInput(date);
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
