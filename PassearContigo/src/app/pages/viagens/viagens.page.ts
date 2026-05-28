import { Component, OnInit, OnDestroy } from '@angular/core';
import { ViagensService } from '../../services/viagens.service';
import { Viagem } from '../../models/viagem.model';
import { Router } from '@angular/router';
import { Unsubscribe } from 'firebase/firestore';
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
  carregando = true;
  private unsubscribe: Unsubscribe | null = null;
  constructor(
    private viagensService: ViagensService,
    private router: Router
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
        this.viagemEmCurso = this.encontrarViagemEmCurso(viagens);
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

  formatarData(data: Date | string): string {
    if (typeof data === 'string') {
      return new Date(data).toLocaleDateString('pt-PT');
    }
    return data.toLocaleDateString('pt-PT');
  }

  obterNumDias(dataInicio: Date | string, dataFim: Date | string): number {
    const inicio = typeof dataInicio === 'string' ? new Date(dataInicio) : dataInicio;
    const fim = typeof dataFim === 'string' ? new Date(dataFim) : dataFim;
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
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Sem Status';
    }
  }

  get viagensRestantes(): Viagem[] {
    return this.viagemEmCurso
      ? this.viagens.filter((viagem) => viagem.id !== this.viagemEmCurso?.id)
      : this.viagens;
  }

  private encontrarViagemEmCurso(viagens: Viagem[]): Viagem | null {
    const viagemAtiva = viagens.find((viagem) => viagem.status === 'em-andamento');
    if (viagemAtiva) {
      return viagemAtiva;
    }

    const agora = new Date();
    return (
      viagens.find((viagem) => {
        const inicio = typeof viagem.dataInicio === 'string' ? new Date(viagem.dataInicio) : viagem.dataInicio;
        const fim = typeof viagem.dataFim === 'string' ? new Date(viagem.dataFim) : viagem.dataFim;
        return inicio <= agora && agora <= fim;
      }) ?? null
    );
  }
}
