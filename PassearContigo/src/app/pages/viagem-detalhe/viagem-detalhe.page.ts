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
    this.routeSub = this.route.paramMap.subscribe(() => {
      const id = this.findRouteId(this.route);
      if (!id) {
        this.erro = 'ID de viagem inválido.';
        this.carregando = false;
        return;
      }

      this.carregando = true;
      this.erro = '';
      this.viagem = null;

      this.viagemSub?.unsubscribe();
      this.viagemSub = this.viagensService.getViagemById(id).subscribe({
        next: (viagem) => {
          this.viagem = viagem ?? null;
          this.carregando = false;
          if (!viagem) {
            this.erro = 'Viagem não encontrada ou não pertence ao utilizador.';
          }
        },
        error: (err) => {
          this.carregando = false;
          this.erro = err?.message || 'Erro ao carregar viagem.';
          console.error('Erro ao carregar viagem:', err);
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

  irParaDia(diaId: string) {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId]);
  }

  adicionarDia() {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', 'nova']);
  }

  obterResumoCustos(dia: any): string {
    if (!dia || !dia.custos || dia.custos.length === 0) return '';
    const total = dia.custos.reduce((s: number, c: any) => s + (c.valor || 0), 0);
    return `${total.toFixed(2)} ${dia.custos[0].moeda || 'EUR'}`;
  }

  private findRouteId(route: ActivatedRoute): string | null {
    let current: ActivatedRoute | null = route;
    while (current) {
      const id = current.snapshot.paramMap.get('id');
      if (id) {
        return id;
      }
      current = current.parent;
    }
    return null;
  }
}

