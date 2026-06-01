import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Dia, POI } from '../../models/viagem.model';
import { POIService } from '../../services/poi.service';
import { ViagensService } from '../../services/viagens.service';

@Component({
  selector: 'app-itinerario-dia',
  standalone: false,
  templateUrl: './itinerario-dia.page.html',
  styleUrls: ['./itinerario-dia.page.scss']
})
export class ItinerarioDiaPage implements OnInit, OnDestroy {
  viagemId = '';
  diaId = '';
  dia: Dia | null = null;
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
        this.erro = 'ID de viagem ou dia invalido.';
        this.carregando = false;
        return;
      }

      this.viagemId = viagemId;
      this.diaId = diaId;
      this.carregarDia();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.unsubscribe();
  }

  voltar() {
    if (this.viagemId && this.diaId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
      return;
    }

    this.router.navigate(['/tabs', 'viagens']);
  }

  adicionarPoi() {
    if (!this.viagemId || !this.diaId) return;
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'adicionar-poi']);
  }

  abrirPoi(poi: POI) {
    if (!this.viagemId || !this.diaId || !poi.id) return;
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'poi', poi.id]);
  }

  get pontosOrdenados(): POI[] {
    return [...(this.dia?.pontosInteresse || [])].sort((a, b) => {
      const horarioA = this.normalizarHorario(a.horario);
      const horarioB = this.normalizarHorario(b.horario);

      if (horarioA !== horarioB) {
        return horarioA - horarioB;
      }

      return (a.nome || '').localeCompare(b.nome || '', 'pt-PT', { sensitivity: 'base' });
    });
  }

  obterFotoPoi(poi: POI): string {
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  obterHorario(poi: POI): string {
    return poi.horario?.trim() || 'Sem hora';
  }

  formatarData(data: Date | string | any): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  trackByPoiId(index: number, poi: POI): string {
    return poi.id || String(index);
  }

  private carregarDia() {
    this.carregando = true;
    this.erro = '';
    this.dia = null;

    this.viagemSub?.unsubscribe();
    this.viagemSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      next: async (viagem) => {
        if (!viagem) {
          this.erro = 'Viagem nao encontrada.';
          this.carregando = false;
          return;
        }

        const diaEncontrado = (viagem.dias || []).find(dia => dia.id === this.diaId);

        if (!diaEncontrado) {
          this.erro = 'Dia nao encontrado.';
          this.carregando = false;
          return;
        }

        this.dia = await this.juntarPoisLocaisPendentes(diaEncontrado);
        this.carregando = false;
      },
      error: (err) => {
        this.erro = err?.message || 'Erro ao carregar itinerario.';
        this.carregando = false;
        console.error('Erro ao carregar itinerario do dia:', err);
      }
    });
  }

  private async juntarPoisLocaisPendentes(dia: Dia): Promise<Dia> {
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

  private normalizarHorario(horario?: string): number {
    if (!horario?.trim()) {
      return Number.MAX_SAFE_INTEGER;
    }

    const match = horario.match(/(\d{1,2})(?::|h)?(\d{2})?/);

    if (!match) {
      return Number.MAX_SAFE_INTEGER - 1;
    }

    const horas = Number(match[1]);
    const minutos = match[2] ? Number(match[2]) : 0;

    if (Number.isNaN(horas) || Number.isNaN(minutos)) {
      return Number.MAX_SAFE_INTEGER - 1;
    }

    return (horas * 60) + minutos;
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
