import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { ViagensService } from '../../services/viagens.service';
import { POIService } from '../../services/poi.service';
import { Dia, POI } from '../../models/viagem.model';

@Component({
  selector: 'app-dia-detalhe',
  standalone: false,
  templateUrl: './dia-detalhe.page.html',
  styleUrls: ['./dia-detalhe.page.scss']
})
export class DiaDetalhePage implements OnInit, OnDestroy {
  dia: Dia | null = null;
  dias: Dia[] = [];
  diaAtualIndex = -1;
  viagemId: string | null = null;
  carregando = true;
  erro = '';

  private routeSub: Subscription | null = null;
  private viagemSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private poiService: POIService
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
      this.dias = [];
      this.diaAtualIndex = -1;

      this.viagemSub?.unsubscribe();
      this.viagemSub = this.viagensService.getViagemById(viagemId).subscribe({
        next: async (viagem) => {
          if (!viagem) {
            this.erro = 'Viagem não encontrada.';
            this.carregando = false;
            return;
          }

          this.dias = [...(viagem.dias || [])].sort((a, b) => {
            return this.obterTimestampData(a.data) - this.obterTimestampData(b.data);
          });
          this.diaAtualIndex = this.dias.findIndex(d => d.id === diaId);
          const diaEncontrado = this.dias[this.diaAtualIndex];

          if (diaEncontrado) {
            this.dia = await this.juntarPoisLocaisPendentes(diaEncontrado);
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

  get temDiaAnterior(): boolean {
    return this.diaAtualIndex > 0;
  }

  get temDiaProximo(): boolean {
    return this.diaAtualIndex >= 0 && this.diaAtualIndex < this.dias.length - 1;
  }

  get textoPosicaoDia(): string {
    if (this.diaAtualIndex < 0 || this.dias.length === 0) {
      return '';
    }

    return `${this.diaAtualIndex + 1} de ${this.dias.length}`;
  }

  irParaDiaAnterior() {
    if (!this.temDiaAnterior || !this.viagemId) return;
    this.irParaDia(this.dias[this.diaAtualIndex - 1].id);
  }

  irParaDiaProximo() {
    if (!this.temDiaProximo || !this.viagemId) return;
    this.irParaDia(this.dias[this.diaAtualIndex + 1].id);
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

  private irParaDia(diaId: string) {
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', diaId]);
  }

  private async juntarPoisLocaisPendentes(dia: Dia): Promise<Dia> {
    if (!this.viagemId) {
      return dia;
    }

    const poisLocais = await this.poiService.obterPOIsLocaisPendentesPorDia(this.viagemId, dia.id);
    const idsRemotos = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    const poisLocaisNovos = poisLocais.filter(poi => !idsRemotos.has(poi.id));

    if (poisLocaisNovos.length === 0) {
      return dia;
    }

    return {
      ...dia,
      pontosInteresse: [...(dia.pontosInteresse || []), ...poisLocaisNovos]
    };
  }

  private obterTimestampData(data: Date | string | any): number {
    if (data instanceof Date) {
      return data.getTime();
    }

    if (typeof data === 'string') {
      return new Date(data).getTime();
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return (data as any).toDate().getTime();
    }

    return 0;
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
