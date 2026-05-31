import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ViagensService } from '../../services/viagens.service';
import { Dia, POI } from '../../models/viagem.model';

@Component({
  selector: 'app-dia-detalhe',
  standalone: false,
  templateUrl: './dia-detalhe.page.html',
  styleUrls: ['./dia-detalhe.page.scss']
})
export class DiaDetalhePage implements OnInit, OnDestroy {
  dia: Dia | null = null;
  viagemId: string | null = null;
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
    this.routeSub = this.route.paramMap.subscribe(params => {
      const viagemId = params.get('id') || this.obterParametroDaRota('id');
      const diaId = params.get('diaId');

      if (!viagemId || !diaId) {
        this.erro = 'ID de viagem ou dia inválido.';
        this.carregando = false;
        return;
      }

      this.viagemId = viagemId;
      this.carregando = true;
      this.erro = '';
      this.dia = null;

      this.viagemSub?.unsubscribe();
      this.viagemSub = this.viagensService.getViagemById(viagemId).subscribe({
        next: (viagem) => {
          if (!viagem) {
            this.erro = 'Viagem não encontrada.';
            this.carregando = false;
            return;
          }

          const diaEncontrado = viagem.dias?.find(d => d.id === diaId);
          if (diaEncontrado) {
            this.dia = diaEncontrado;
          } else {
            this.erro = 'Dia não encontrado.';
          }
          this.carregando = false;
        },
        error: (err) => {
          this.carregando = false;
          this.erro = err?.message || 'Erro ao carregar dia.';
          console.error('Erro ao carregar dia:', err);
        }
      });
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.unsubscribe();
  }

  voltar() {
    if (this.viagemId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
    } else {
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  get pontosInteresseOrdenados(): POI[] {
    return [...(this.dia?.pontosInteresse || [])].sort((a, b) => {
      const nomeA = (a.nome || '').trim();
      const nomeB = (b.nome || '').trim();

      if (nomeA || nomeB) {
        return nomeA.localeCompare(nomeB, 'pt-PT', { sensitivity: 'base' });
      }

      return (a.tipo || '').localeCompare(b.tipo || '', 'pt-PT', { sensitivity: 'base' });
    });
  }

  obterFotoPoi(poi: POI): string {
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  trackByPoiId(index: number, poi: POI): string {
    return poi.id || String(index);
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

  obterResumoCustos(custos: any[]): string {
    if (!custos || custos.length === 0) return 'Sem custos';
    const total = custos.reduce((s: number, c: any) => s + (c.valor || 0), 0);
    return `${total.toFixed(2)} ${custos[0].moeda || 'EUR'}`;
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
