import { Component, OnInit } from '@angular/core';
import { ViagensService } from '../../services/viagens.service';
import { Viagem } from '../../models/viagem.model';
import { Router } from '@angular/router';

/**
 * ViagensPage - Página de Viagens
 * Exibe a lista de viagens/itinerários do utilizador
 */
@Component({
  selector: 'app-viagens',
  templateUrl: 'viagens.page.html',
  styleUrls: ['viagens.page.scss'],
  standalone: false,
})
export class ViagensPage implements OnInit {
  viagens: Viagem[] = [];
  carregando = true;

  constructor(
    private viagensService: ViagensService,
    private router: Router
  ) {}

  ngOnInit() {
    this.carregarViagens();
  }

  carregarViagens() {
    this.carregando = true;
    this.viagensService.getViagens().subscribe({
      next: (viagens) => {
        this.viagens = viagens;
        this.carregando = false;
      },
      error: (error) => {
        console.error('Erro ao carregar viagens:', error);
        this.carregando = false;
      }
    });
  }

  irParaDetalhes(id: string) {
    this.router.navigate(['/viagens', id]);
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
}
