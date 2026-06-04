// app/pages/diario-viagem/diario-viagem.page.ts | Controlador da pagina diario viagem, onde ficam os dados, eventos e chamadas aos servicos.
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { Gesture, GestureController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Unsubscribe } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { Custo, Dia, POI, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { CustosService } from '../../services/custos.service';
// Importa dependencias usadas neste ficheiro.
import { DiarioPdfService } from '../../services/diario-pdf.service';
// Importa dependencias usadas neste ficheiro.
import { PdfShareService } from '../../services/pdf-share.service';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';

// Contrato de dados usado para tipar objetos desta area.
interface LinhaCustoDiario {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  descricao: string;
  // Define um campo ou opcao de configuracao.
  categoria: string;
  // Define um campo ou opcao de configuracao.
  valor: number;
  // Define um campo ou opcao de configuracao.
  moeda: string;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-diario-viagem',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './diario-viagem.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./diario-viagem.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiarioViagemPage implements OnInit, AfterViewInit, OnDestroy {
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild('diarioSwipeArea') diarioSwipeArea?: ElementRef<HTMLElement>;

  // Atribui um valor a esta propriedade.
  viagemId = '';
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  dias: Dia[] = [];
  // Define um campo ou opcao de configuracao.
  custosFirestore: Custo[] = [];
  // Atribui um valor a esta propriedade.
  diaAtualIndex = 0;
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  guardando = false;
  // Atribui um valor a esta propriedade.
  gerandoPdf = false;
  // Atribui um valor a esta propriedade.
  partilhandoPdf = false;
  // Atribui um valor a esta propriedade.
  erro = '';

  // Define um membro interno desta classe.
  private viagemSub: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private custosSub: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private swipeGesture: Gesture | null = null;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private custosService: CustosService,
    // Define um membro interno desta classe.
    private diarioPdfService: DiarioPdfService,
    // Define um membro interno desta classe.
    private pdfShareService: PdfShareService,
    // Define um membro interno desta classe.
    private gestureCtrl: GestureController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Cria uma variavel local para esta operacao.
    const viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id');

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.erro = 'ID de viagem inválido.';
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.viagemId = viagemId;
    // Atualiza ou consulta estado da pagina.
    this.carregarViagem(viagemId);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngAfterViewInit() {
    // Atualiza ou consulta estado da pagina.
    this.criarGestoSwipe();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.();
    // Atualiza ou consulta estado da pagina.
    this.custosSub?.();
    // Atualiza ou consulta estado da pagina.
    this.swipeGesture?.destroy();
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

  // Executa uma instrucao necessaria para este fluxo.
  get diaAtual(): Dia | null {
    // Devolve o resultado deste bloco.
    return this.dias[this.diaAtualIndex] || null;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temDiaAnterior(): boolean {
    // Devolve o resultado deste bloco.
    return this.diaAtualIndex > 0;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temDiaProximo(): boolean {
    // Devolve o resultado deste bloco.
    return this.diaAtualIndex < this.dias.length - 1;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get textoPosicaoDia(): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.dias.length === 0) {
      // Devolve o resultado deste bloco.
      return '';
    }

    // Devolve o resultado deste bloco.
    return `${this.diaAtualIndex + 1} de ${this.dias.length}`;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDiaAnterior() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temDiaAnterior) return;
    // Atualiza ou consulta estado da pagina.
    this.diaAtualIndex -= 1;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDiaProximo() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temDiaProximo) return;
    // Atualiza ou consulta estado da pagina.
    this.diaAtualIndex += 1;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDia(index: number) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (index < 0 || index >= this.dias.length) return;
    // Atualiza ou consulta estado da pagina.
    this.diaAtualIndex = index;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirDetalheDia() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.diaAtual || !this.viagemId) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaAtual.id]);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirPoi(poi: POI) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.diaAtual || !this.viagemId || !poi.id) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaAtual.id, 'poi', poi.id]);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async guardarNotaPoi(poi: POI) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.diaAtual || this.guardando || !this.podeEditarViagem) return;

    // Executa uma instrucao necessaria para este fluxo.
    poi.nota = poi.nota?.trim() || '';
    // Aguarda a conclusao de uma operacao assincrona.
    await this.guardarDiario();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterFotoPoi(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCorStatus(status?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (status) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'planejada':
        // Devolve o resultado deste bloco.
        return 'primary';
      // Executa uma instrucao necessaria para este fluxo.
      case 'em-andamento':
        // Devolve o resultado deste bloco.
        return 'warning';
      // Executa uma instrucao necessaria para este fluxo.
      case 'concluida':
        // Devolve o resultado deste bloco.
        return 'success';
      // Executa uma instrucao necessaria para este fluxo.
      case 'cancelada':
        // Devolve o resultado deste bloco.
        return 'danger';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'medium';
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTextoStatus(status?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (status) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'planejada':
        // Devolve o resultado deste bloco.
        return 'Planeada';
      // Executa uma instrucao necessaria para este fluxo.
      case 'em-andamento':
        // Devolve o resultado deste bloco.
        return 'Em curso';
      // Executa uma instrucao necessaria para este fluxo.
      case 'concluida':
        // Devolve o resultado deste bloco.
        return 'Concluída';
      // Executa uma instrucao necessaria para este fluxo.
      case 'cancelada':
        // Devolve o resultado deste bloco.
        return 'Cancelada';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'Sem estado';
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCustoDia(dia: Dia): number {
    // Cria uma variavel local para esta operacao.
    const totalPois = (dia.pontosInteresse || []).reduce((total, poi) => total + this.obterTotalCustoPoi(poi), 0);
    // Cria uma variavel local para esta operacao.
    const totalCustosDia = this.obterCustosDia(dia)
      // Executa uma instrucao necessaria para este fluxo.
      .filter(custo => !custo.poiId)
      // Executa uma instrucao necessaria para este fluxo.
      .reduce((total, custo) => total + (Number(custo.valor) || 0), 0);

    // Devolve o resultado deste bloco.
    return totalPois + totalCustosDia;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTotalCustoPoi(poi: POI): number {
    // Cria uma variavel local para esta operacao.
    const custoDireto = Number(poi.custo) || 0;
    // Cria uma variavel local para esta operacao.
    const custosAssociados = this.obterCustosPoi(poi)
      // Executa uma instrucao necessaria para este fluxo.
      .reduce((total, custo) => total + (Number(custo.valor) || 0), 0);

    // Devolve o resultado deste bloco.
    return custoDireto + custosAssociados;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCustosDia(dia: Dia): Custo[] {
    // Cria uma variavel local para esta operacao.
    const poiIds = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    // Cria uma variavel local para esta operacao.
    const custosFirestore = this.custosFirestore.filter(custo =>
      // Executa uma instrucao necessaria para este fluxo.
      custo.diaId === dia.id || (custo.poiId ? poiIds.has(custo.poiId) : false)
    );
    // Cria uma variavel local para esta operacao.
    const custosDia = dia.custos || [];
    // Cria uma variavel local para esta operacao.
    const ids = new Set<string>();

    // Devolve o resultado deste bloco.
    return [...custosFirestore, ...custosDia].filter(custo => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!custo.id) {
        // Devolve o resultado deste bloco.
        return true;
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (ids.has(custo.id)) {
        // Devolve o resultado deste bloco.
        return false;
      }

      // Executa uma instrucao necessaria para este fluxo.
      ids.add(custo.id);
      // Devolve o resultado deste bloco.
      return true;
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCustosPoi(poi: POI): Custo[] {
    // Devolve o resultado deste bloco.
    return this.custosFirestore.filter(custo => custo.poiId === poi.id);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterLinhasCustosDia(dia: Dia): LinhaCustoDiario[] {
    // Cria uma variavel local para esta operacao.
    const linhas: LinhaCustoDiario[] = [];

    // Executa uma instrucao necessaria para este fluxo.
    (dia.pontosInteresse || []).forEach((poi, index) => {
      // Cria uma variavel local para esta operacao.
      const custoDireto = Number(poi.custo) || 0;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (custoDireto > 0) {
        // Executa uma instrucao necessaria para este fluxo.
        linhas.push({
          // Define um campo ou opcao de configuracao.
          id: `poi-${poi.id || index}`,
          // Define um campo ou opcao de configuracao.
          descricao: poi.nome || `POI ${index + 1}`,
          // Define um campo ou opcao de configuracao.
          categoria: poi.tipo || poi.categoria || 'Ponto de interesse',
          // Define um campo ou opcao de configuracao.
          valor: custoDireto,
          // Define um campo ou opcao de configuracao.
          moeda: 'EUR'
        });
      }
    });

    // Atualiza ou consulta estado da pagina.
    this.obterCustosDia(dia).forEach((custo, index) => {
      // Cria uma variavel local para esta operacao.
      const valor = Number(custo.valor) || 0;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (valor <= 0) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const poiAssociado = (dia.pontosInteresse || []).find(poi => poi.id === custo.poiId);

      // Executa uma instrucao necessaria para este fluxo.
      linhas.push({
        // Define um campo ou opcao de configuracao.
        id: custo.id || `custo-${index}`,
        // Define um campo ou opcao de configuracao.
        descricao: custo.descricao || poiAssociado?.nome || 'Custo',
        // Define um campo ou opcao de configuracao.
        categoria: custo.categoria || (poiAssociado ? 'Ponto de interesse' : 'Sem categoria'),
        // Executa uma instrucao necessaria para este fluxo.
        valor,
        // Define um campo ou opcao de configuracao.
        moeda: custo.moeda || 'EUR'
      });
    });

    // Devolve o resultado deste bloco.
    return linhas;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterNotaPoi(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.nota?.trim() || poi.descricao?.trim() || '';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  diaTemRegistosIncompletos(dia: Dia): boolean {
    // Cria uma variavel local para esta operacao.
    const semEntradaDiario = !dia.titulo?.trim()
      // Executa uma instrucao necessaria para este fluxo.
      || !dia.data
      // Executa uma instrucao necessaria para este fluxo.
      || (!dia.local?.trim() && !dia.descricao?.trim() && !dia.observacoes?.trim());

    // Devolve o resultado deste bloco.
    return semEntradaDiario || (dia.pontosInteresse || []).some(poi => this.poiTemRegistoIncompleto(poi));
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  poiTemRegistoIncompleto(poi: POI): boolean {
    // Cria uma variavel local para esta operacao.
    const semCusto = (poi.custo === undefined || poi.custo === null)
      // Executa uma instrucao necessaria para este fluxo.
      && this.obterCustosPoi(poi).length === 0;

    // Devolve o resultado deste bloco.
    return !poi.nome?.trim()
      // Executa uma instrucao necessaria para este fluxo.
      || !poi.fotoUrl?.trim()
      // Executa uma instrucao necessaria para este fluxo.
      || !this.obterNotaPoi(poi)
      // Executa uma instrucao necessaria para este fluxo.
      || semCusto;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarValor(valor: number): string {
    // Devolve o resultado deste bloco.
    return valor.toFixed(2).replace('.', ',');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarData(data: Date | string | any): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  trackByPoiId(index: number, poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.id || String(index);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  trackByCustoId(index: number, custo: Custo): string {
    // Devolve o resultado deste bloco.
    return custo.id || String(index);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async guardarDiario() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.guardando || !this.podeEditarViagem) return;

    // Atualiza ou consulta estado da pagina.
    this.guardando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, {
        // Define um campo ou opcao de configuracao.
        dias: this.dias
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Diario guardado com sucesso.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao guardar diario:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao guardar diario.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.guardando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async gerarPdfDiario() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.gerandoPdf) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.gerandoPdf = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Atualiza ou consulta estado da pagina.
      this.diarioPdfService.gerarDiarioCompleto({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        dias: this.dias,
        // Define um campo ou opcao de configuracao.
        custos: this.custosFirestore
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('PDF do diario gerado com sucesso.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF do diario:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao gerar PDF do diario.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.gerandoPdf = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async partilharPdfDiario() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.partilhandoPdf) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.partilhandoPdf = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const podePartilhar = await this.pdfShareService.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!podePartilhar) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Partilha de PDF não disponível neste dispositivo.', 'danger');
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const pdf = this.diarioPdfService.criarDiarioCompleto({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        dias: this.dias,
        // Define um campo ou opcao de configuracao.
        custos: this.custosFirestore
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.pdfShareService.sharePdf(pdf, {
        // Define um campo ou opcao de configuracao.
        title: this.viagem.titulo || 'Diário da viagem',
        // Define um campo ou opcao de configuracao.
        text: 'PDF do diario completo da viagem.',
        // Define um campo ou opcao de configuracao.
        dialogTitle: 'Partilhar diário'
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.message?.toLowerCase().includes('cancel')) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao partilhar PDF do diário:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao partilhar PDF do diário.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.partilhandoPdf = false;
    }
  }

  // Define um membro interno desta classe.
  private carregarViagem(viagemId: string) {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';

    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub = this.viagensService.subscribeToViagemById(
      // Executa uma instrucao necessaria para este fluxo.
      viagemId,
      // Executa uma instrucao necessaria para este fluxo.
      (viagem) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.viagem = viagem;

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!viagem) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Viagem não encontrada.';
          // Atualiza ou consulta estado da pagina.
          this.dias = [];
          // Devolve o resultado deste bloco.
          return;
        }

        // Cria uma variavel local para esta operacao.
        const diaAtualId = this.diaAtual?.id;
        // Atualiza ou consulta estado da pagina.
        this.dias = [...(viagem.dias || [])].sort((a, b) => {
          // Devolve o resultado deste bloco.
          return this.obterTimestampData(a.data) - this.obterTimestampData(b.data);
        });

        // Cria uma variavel local para esta operacao.
        const novoIndex = diaAtualId
          // Executa uma instrucao necessaria para este fluxo.
          ? this.dias.findIndex(dia => dia.id === diaAtualId)
          // Executa uma instrucao necessaria para este fluxo.
          : this.diaAtualIndex;

        // Atualiza ou consulta estado da pagina.
        this.diaAtualIndex = Math.min(Math.max(novoIndex, 0), Math.max(this.dias.length - 1, 0));
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.erro = error?.message || 'Erro ao carregar diário.';
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar diário:', error);
      }
    );

    // Atualiza ou consulta estado da pagina.
    this.custosSub?.();
    // Atualiza ou consulta estado da pagina.
    this.custosSub = this.custosService.subscribeToCustosByViagemId(
      // Executa uma instrucao necessaria para este fluxo.
      viagemId,
      // Executa uma instrucao necessaria para este fluxo.
      (custos) => {
        // Atualiza ou consulta estado da pagina.
        this.custosFirestore = custos;
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error) => {
        // Executa uma instrucao necessaria para este fluxo.
        console.warn('Não foi possível carregar custos do diário:', error);
        // Atualiza ou consulta estado da pagina.
        this.custosFirestore = [];
      }
    );
  }

  // Define um membro interno desta classe.
  private criarGestoSwipe() {
    // Cria uma variavel local para esta operacao.
    const elemento = this.diarioSwipeArea?.nativeElement;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!elemento) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.swipeGesture = this.gestureCtrl.create({
      // Define um campo ou opcao de configuracao.
      el: elemento,
      // Define um campo ou opcao de configuracao.
      gestureName: 'diario-viagem-swipe',
      // Define um campo ou opcao de configuracao.
      threshold: 20,
      // Define um campo ou opcao de configuracao.
      onEnd: (event) => {
        // Cria uma variavel local para esta operacao.
        const distanciaSuficiente = Math.abs(event.deltaX) > 70;
        // Cria uma variavel local para esta operacao.
        const velocidadeSuficiente = Math.abs(event.velocityX) > 0.2;

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!distanciaSuficiente && !velocidadeSuficiente) {
          // Devolve o resultado deste bloco.
          return;
        }

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (event.deltaX < 0) {
          // Atualiza ou consulta estado da pagina.
          this.irParaDiaProximo();
        // Executa uma instrucao necessaria para este fluxo.
        } else {
          // Atualiza ou consulta estado da pagina.
          this.irParaDiaAnterior();
        }
      }
    });

    // Atualiza ou consulta estado da pagina.
    this.swipeGesture.enable(true);
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Devolve o resultado deste bloco.
      return data.toDate();
    }

    // Devolve o resultado deste bloco.
    return new Date(data);
  }

  // Define um membro interno desta classe.
  private obterTimestampData(data: Date | string | any): number {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: 'success' | 'danger') {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2000,
      // Executa uma instrucao necessaria para este fluxo.
      color
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }
}
