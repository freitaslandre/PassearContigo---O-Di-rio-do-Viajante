import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ViagensService } from '../../services/viagens.service';
import { Viagem } from '../../models/viagem.model';

@Component({
  selector: 'app-viagem-detalhe',
  standalone: false,
  templateUrl: 'viagem-detalhe.page.html',
  styleUrls: ['viagem-detalhe.page.scss']
})
export class ViagemDetalhePage implements OnInit, OnDestroy {
  viagem: Viagem | null = null;
  carregando = true;
  erro = '';

  private routeSub: Subscription | null = null;
  private viagemSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe((paramMap) => {
      const id = paramMap.get('id');
      if (!id) {
        this.erro = 'ID de viagem inválido.';
        this.carregando = false;
        return;
      }

      this.carregando = true;
      this.erro = '';
      this.viagem = null;

      this.viagemSub?.unsubscribe();
      this.viagemSub = this.viagensService.getViagemById(id).subscribe((viagem) => {
        this.viagem = viagem ?? null;
        this.carregando = false;
        if (!viagem) {
          this.erro = 'Viagem não encontrada ou não pertence ao utilizador.';
        }
      });
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.unsubscribe();
  }

  voltar() {
    this.router.navigate(['/tabs', 'viagens']);
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
