import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViagensService } from '../../services/viagens.service';
import { Viagem } from '../../models/viagem.model';
import { Router } from '@angular/router';
import { Unsubscribe } from 'firebase/firestore';
import { AlertController, ToastController } from '@ionic/angular';

/**
 * ViagensPage - Página de Viagens
 * Exibe a lista de viagens/itinerários do utilizador
 */
@Component({
  selector: 'app-viagens',
  standalone: false,
  templateUrl: 'viagens.page.html',
  styleUrls: ['viagens.page.scss']
})
export class ViagensPage implements OnInit, OnDestroy {
  viagens: Viagem[] = [];
  viagemEmCurso: Viagem | null = null;
  statusSelecionado = 'todos';
  filtrosStatus = [
    { valor: 'todos', label: 'Todas' },
    { valor: 'planejada', label: 'Planejadas' },
    { valor: 'em-andamento', label: 'Em andamento' },
    { valor: 'concluida', label: 'Concluídas' },
    { valor: 'cancelada', label: 'Canceladas' }
  ];
  carregando = true;
  private unsubscribe: Unsubscribe | null = null;
  constructor(
    private viagensService: ViagensService,
    private router: Router,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}
  ngOnInit() {
    this.subscribeToViagens();
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }

  private subscribeToViagens() {
    this.carregando = true;
    this.unsubscribe = this.viagensService.subscribeToViagens(
      (viagens) => {
        this.viagens = viagens;
        this.atualizarViagemEmCurso();
        this.carregando = false;
      },
      (error) => {
        console.error('Erro ao carregar viagens:', error);
        this.carregando = false;
      }
    );
  }

  irParaDetalhes(id: string) {
    this.router.navigate(['/tabs', 'viagens', id]);
  }

  async confirmarEliminarViagem(event: Event, viagem: Viagem) {
    event.stopPropagation();

    const alert = await this.alertCtrl.create({
      header: 'Eliminar viagem',
      message: `Tem a certeza que pretende eliminar "${viagem.titulo}"? Esta acao nao pode ser anulada.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarViagem(viagem.id);
          }
        }
      ]
    });

    await alert.present();
  }

  formatarData(data: Date | string | any): string {
    if (typeof data === 'string') {
      return new Date(data).toLocaleDateString('pt-PT');
    }
    if (data instanceof Date) {
      return data.toLocaleDateString('pt-PT');
    }
    if (data && typeof data === 'object' && 'toDate' in data) {
      return (data as any).toDate().toLocaleDateString('pt-PT');
    }
    return String(data);
  }

  obterNumDias(dataInicio: Date | string | any, dataFim: Date | string | any): number {
    const inicio = this.converterParaDate(dataInicio);
    const fim = this.converterParaDate(dataFim);
    const differenceMs = fim.getTime() - inicio.getTime();
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
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
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Sem Status';
    }
  }

  get viagensRestantes(): Viagem[] {
    const viagens = this.viagensFiltradas;

    return this.viagemEmCurso
      ? viagens.filter((viagem) => viagem.id !== this.viagemEmCurso?.id)
      : viagens;
  }

  get viagensFiltradas(): Viagem[] {
    if (this.statusSelecionado === 'todos') {
      return this.viagens;
    }

    return this.viagens.filter((viagem) => viagem.status === this.statusSelecionado);
  }

  selecionarStatus(status: string | number | null | undefined) {
    this.statusSelecionado = status ? String(status) : 'todos';
    this.atualizarViagemEmCurso();
  }

  private encontrarViagemEmCurso(viagens: Viagem[]): Viagem | null {
    const viagemAtiva = viagens.find((viagem) => viagem.status === 'em-andamento');
    if (viagemAtiva) {
      return viagemAtiva;
    }

    const agora = new Date();
    return (
      viagens.find((viagem) => {
        const inicio = this.converterParaDate(viagem.dataInicio);
        const fim = this.converterParaDate(viagem.dataFim);
        return inicio <= agora && agora <= fim;
      }) ?? null
    );
  }

  private atualizarViagemEmCurso() {
    this.viagemEmCurso = this.encontrarViagemEmCurso(this.viagensFiltradas);
  }

  private async eliminarViagem(id: string) {
    try {
      await this.viagensService.deleteViagem(id);
      await this.mostrarToast('Viagem eliminada com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao eliminar viagem:', error);
      await this.mostrarToast(error?.message || 'Erro ao eliminar viagem.', 'danger');
    }
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
