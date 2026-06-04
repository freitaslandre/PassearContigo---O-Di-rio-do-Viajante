// app/pages/dia-detalhe/dia-detalhe.page.ts | Controlador da pagina dia detalhe, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit, OnDestroy } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { Subscription } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { POIService } from '../../services/poi.service';
// Importa dependencias usadas neste ficheiro.
import { Dia, POI, Colaborador, Viagem } from '../../models/viagem.model';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-dia-detalhe',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './dia-detalhe.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./dia-detalhe.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiaDetalhePage implements OnInit, OnDestroy {
  // Define um campo ou opcao de configuracao.
  dia: Dia | null = null;
  // Define um campo ou opcao de configuracao.
  dias: Dia[] = [];
  // Atribui um valor a esta propriedade.
  diaAtualIndex = -1;
  // Define um campo ou opcao de configuracao.
  viagemId: string | null = null;
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  colaboradores: Colaborador[] = [];
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  erro = '';

  // Define um membro interno desta classe.
  private routeSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private viagemSub: Subscription | null = null;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private poiService: POIService
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub = this.route.paramMap.subscribe(params => {
      // Cria uma variavel local para esta operacao.
      const viagemId = params.get('id') || this.obterParametroDaRota('id');
      // Cria uma variavel local para esta operacao.
      const diaId = params.get('diaId');

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!viagemId || !diaId) {
        // Atualiza ou consulta estado da pagina.
        this.erro = 'ID de viagem ou dia inválido.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.viagemId = viagemId;
      // Atualiza ou consulta estado da pagina.
      this.carregando = true;
      // Atualiza ou consulta estado da pagina.
      this.erro = '';
      // Atualiza ou consulta estado da pagina.
      this.dia = null;
      // Atualiza ou consulta estado da pagina.
      this.dias = [];
      // Atualiza ou consulta estado da pagina.
      this.diaAtualIndex = -1;

      // Atualiza ou consulta estado da pagina.
      this.viagemSub?.unsubscribe();
      // Atualiza ou consulta estado da pagina.
      this.viagemSub = this.viagensService.getViagemById(viagemId).subscribe({
        // Define um campo ou opcao de configuracao.
        next: async (viagem) => {
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (!viagem) {
            // Atualiza ou consulta estado da pagina.
            this.erro = 'Viagem não encontrada.';
            // Atualiza ou consulta estado da pagina.
            this.carregando = false;
            // Devolve o resultado deste bloco.
            return;
          }

          // Atualiza ou consulta estado da pagina.
          this.viagem = viagem;
          // Atualiza ou consulta estado da pagina.
          this.colaboradores = viagem.colaboradores || [];
          // Atualiza ou consulta estado da pagina.
          this.dias = [...(viagem.dias || [])].sort((a, b) => {
            // Devolve o resultado deste bloco.
            return this.obterTimestampData(a.data) - this.obterTimestampData(b.data);
          });
          // Atualiza ou consulta estado da pagina.
          this.diaAtualIndex = this.dias.findIndex(d => d.id === diaId);
          // Cria uma variavel local para esta operacao.
          const diaEncontrado = this.dias[this.diaAtualIndex];

          // Define um metodo chamado pela pagina ou por outros metodos.
          if (diaEncontrado) {
            // Atualiza ou consulta estado da pagina.
            this.dia = await this.juntarPoisLocaisPendentes(diaEncontrado);
          // Executa uma instrucao necessaria para este fluxo.
          } else {
            // Atualiza ou consulta estado da pagina.
            this.erro = 'Dia não encontrado.';
          }
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
        },
        // Define um campo ou opcao de configuracao.
        error: (err) => {
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
          // Atualiza ou consulta estado da pagina.
          this.erro = err?.message || 'Erro ao carregar dia.';
          // Executa uma instrucao necessaria para este fluxo.
          console.error('Erro ao carregar dia:', err);
        }
      });
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.unsubscribe();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirItinerario() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.dia) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.dia.id, 'itinerario']);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCustoDia(dia: Dia): number {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia.pontosInteresse) {
      // Devolve o resultado deste bloco.
      return 0;
    }
    // Devolve o resultado deste bloco.
    return dia.pontosInteresse.reduce((total, poi) => total + (poi.custo || 0), 0);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temDiaAnterior(): boolean {
    // Devolve o resultado deste bloco.
    return this.diaAtualIndex > 0;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temDiaProximo(): boolean {
    // Devolve o resultado deste bloco.
    return this.diaAtualIndex >= 0 && this.diaAtualIndex < this.dias.length - 1;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get textoPosicaoDia(): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.diaAtualIndex < 0 || this.dias.length === 0) {
      // Devolve o resultado deste bloco.
      return '';
    }

    // Devolve o resultado deste bloco.
    return `${this.diaAtualIndex + 1} de ${this.dias.length}`;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDiaAnterior() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temDiaAnterior || !this.viagemId) return;
    // Atualiza ou consulta estado da pagina.
    this.irParaDia(this.dias[this.diaAtualIndex - 1].id);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDiaProximo() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temDiaProximo || !this.viagemId) return;
    // Atualiza ou consulta estado da pagina.
    this.irParaDia(this.dias[this.diaAtualIndex + 1].id);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get pontosInteresseOrdenados(): POI[] {
    // Devolve o resultado deste bloco.
    return [...(this.dia?.pontosInteresse || [])].sort((a, b) => {
      // Cria uma variavel local para esta operacao.
      const nomeA = (a.nome || '').trim();
      // Cria uma variavel local para esta operacao.
      const nomeB = (b.nome || '').trim();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (nomeA || nomeB) {
        // Devolve o resultado deste bloco.
        return nomeA.localeCompare(nomeB, 'pt-PT', { sensitivity: 'base' });
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      return (a.tipo || '').localeCompare(b.tipo || '', 'pt-PT', { sensitivity: 'base' });
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterFotoPoi(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  trackByPoiId(index: number, poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.id || String(index);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarData(data: Date | string | any): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? 'Sem data' : date.toLocaleDateString('pt-PT');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarDataDia(dia: Dia): string {
    // Cria uma variavel local para esta operacao.
    const dataSequencial = this.obterDataSequencialDia(dia);
    // Devolve o resultado deste bloco.
    return this.formatarData(dataSequencial || dia.data);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterResumoCustos(custos: any[]): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!custos || custos.length === 0) return 'Sem custos';
    // Cria uma variavel local para esta operacao.
    const total = custos.reduce((s: number, c: any) => s + (c.valor || 0), 0);
    // Devolve o resultado deste bloco.
    return `${total.toFixed(2)} ${custos[0].moeda || 'EUR'}`;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterColaboradorPorPoi(poi: POI): Colaborador | undefined {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!poi.colaboradorUid) {
      // Devolve o resultado deste bloco.
      return undefined;
    }
    // Devolve o resultado deste bloco.
    return this.colaboradores.find(colaborador => colaborador.uid === poi.colaboradorUid);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterColaboradorLabel(poi: POI): string {
    // Cria uma variavel local para esta operacao.
    const colaborador = this.obterColaboradorPorPoi(poi);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (colaborador) {
      // Devolve o resultado deste bloco.
      return colaborador.nome?.trim() || colaborador.email || 'Colaborador';
    }

    // Devolve o resultado deste bloco.
    return poi.colaboradorNome?.trim() || poi.colaboradorEmail || '';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterInicialColaborador(poi: POI): string | undefined {
    // Cria uma variavel local para esta operacao.
    const label = this.obterColaboradorLabel(poi);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!label) {
      // Devolve o resultado deste bloco.
      return undefined;
    }

    // Cria uma variavel local para esta operacao.
    const partes = label.split(/\s+/).filter(Boolean);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (partes.length === 0) {
      // Devolve o resultado deste bloco.
      return undefined;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (partes.length === 1) {
      // Devolve o resultado deste bloco.
      return partes[0].slice(0, 2).toUpperCase();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
  }

  // Define um membro interno desta classe.
  private irParaDia(diaId: string) {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', diaId]);
  }

  // Define um membro interno desta classe.
  private async juntarPoisLocaisPendentes(dia: Dia): Promise<Dia> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId) {
      // Devolve o resultado deste bloco.
      return dia;
    }

    // Cria uma variavel local para esta operacao.
    const poisLocais = await this.poiService.obterPOIsLocaisPendentesPorDia(this.viagemId, dia.id);
    // Cria uma variavel local para esta operacao.
    const idsRemotos = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    // Cria uma variavel local para esta operacao.
    const poisLocaisNovos = poisLocais.filter(poi => !idsRemotos.has(poi.id));

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (poisLocaisNovos.length === 0) {
      // Devolve o resultado deste bloco.
      return dia;
    }

    // Devolve o resultado deste bloco.
    return {
      // Executa uma instrucao necessaria para este fluxo.
      ...dia,
      // Define um campo ou opcao de configuracao.
      pontosInteresse: [...(dia.pontosInteresse || []), ...poisLocaisNovos]
    };
  }

  // Define um membro interno desta classe.
  private obterTimestampData(data: Date | string | any): number {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  // Define um membro interno desta classe.
  private obterDataSequencialDia(dia: Dia): Date | null {
    // Cria uma variavel local para esta operacao.
    const indiceDia = this.dias.findIndex(item => item.id === dia.id);
    // Cria uma variavel local para esta operacao.
    const dataInicio = this.converterParaDate(this.viagem?.dataInicio);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (indiceDia < 0 || Number.isNaN(dataInicio.getTime())) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Cria uma variavel local para esta operacao.
    const data = new Date(dataInicio.getFullYear(), dataInicio.getMonth(), dataInicio.getDate());
    // Executa uma instrucao necessaria para este fluxo.
    data.setDate(data.getDate() + indiceDia);
    // Devolve o resultado deste bloco.
    return data;
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return new Date(data);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      return (data as any).toDate();
    }

    // Cria uma variavel local para esta operacao.
    const segundos = data?.seconds ?? data?._seconds;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof segundos === 'number') {
      // Devolve o resultado deste bloco.
      return new Date(segundos * 1000);
    }

    // Devolve o resultado deste bloco.
    return new Date(data);
  }

  // Define um membro interno desta classe.
  private obterParametroDaRota(nome: string): string | null {
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const rota of [...this.route.pathFromRoot].reverse()) {
      // Cria uma variavel local para esta operacao.
      const valor = rota.snapshot.paramMap.get(nome);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (valor) {
        // Devolve o resultado deste bloco.
        return valor;
      }
    }

    // Devolve o resultado deste bloco.
    return null;
  }
}
