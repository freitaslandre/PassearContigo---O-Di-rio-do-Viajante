// app/pages/resumo-custos/resumo-custos.page.ts | Controlador da pagina resumo custos, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit, OnDestroy } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { AngularFireAuth } from '@angular/fire/compat/auth';
// Importa dependencias usadas neste ficheiro.
import { CustosService } from '../../services/custos.service';
// Importa dependencias usadas neste ficheiro.
import { CustosPdfService } from '../../services/custos-pdf.service';
// Importa dependencias usadas neste ficheiro.
import { PdfShareService } from '../../services/pdf-share.service';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { Custo, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { Unsubscribe } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { ToastController } from '@ionic/angular';

// Contrato de dados usado para tipar objetos desta area.
interface CustosPorCategoria {
  // Define um campo ou opcao de configuracao.
  categoria: string;
  // Define um campo ou opcao de configuracao.
  categoriaLabel: string;
  // Define um campo ou opcao de configuracao.
  total: number;
  // Define um campo ou opcao de configuracao.
  percentual: number;
  // Define um campo ou opcao de configuracao.
  icone: string;
  // Define um campo ou opcao de configuracao.
  cor: string;
  // Define um campo ou opcao de configuracao.
  corHex: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface SegmentoGrafico {
  // Define um campo ou opcao de configuracao.
  categoria: string;
  // Define um campo ou opcao de configuracao.
  valor: number;
  // Define um campo ou opcao de configuracao.
  percentual: number;
  // Define um campo ou opcao de configuracao.
  cor: string;
  // Define um campo ou opcao de configuracao.
  dasharray: number;
  // Define um campo ou opcao de configuracao.
  dashgap: number;
  // Define um campo ou opcao de configuracao.
  dashoffset: number;
}

// Cria uma variavel local para esta operacao.
const CORES_CATEGORIA: Record<string, string> = {
  // Define um campo ou opcao de configuracao.
  alimentacao: '#E75A5A',
  // Define um campo ou opcao de configuracao.
  transporte: '#F6A23A',
  // Define um campo ou opcao de configuracao.
  hospedagem: '#3F7CFF',
  // Define um campo ou opcao de configuracao.
  alojamento: '#3F7CFF',
  // Define um campo ou opcao de configuracao.
  compras: '#A855F7',
  // Define um campo ou opcao de configuracao.
  cultura: '#14B8A6',
  // Define um campo ou opcao de configuracao.
  natureza: '#22A65A',
  // Define um campo ou opcao de configuracao.
  aventura: '#E56B2F',
  // Define um campo ou opcao de configuracao.
  gastronomia: '#D9468F',
  // Define um campo ou opcao de configuracao.
  outro: '#64748B',
  // Define um campo ou opcao de configuracao.
  semcategoria: '#94A3B8'
};

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-resumo-custos',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './resumo-custos.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./resumo-custos.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ResumoCustosPage implements OnInit, OnDestroy {
  // Define um campo ou opcao de configuracao.
  custos: Custo[] = [];
  // Define um campo ou opcao de configuracao.
  custosPorCategoria: CustosPorCategoria[] = [];
  // Atribui um valor a esta propriedade.
  totalGeral = 0;
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  erroCarregamento = '';
  // Atribui um valor a esta propriedade.
  gerandoPdf = false;
  // Atribui um valor a esta propriedade.
  partilhandoPdf = false;
  // Atribui um valor a esta propriedade.
  viagemSelecionadaId = 'todas';
  // Define um campo ou opcao de configuracao.
  viagensDisponiveis: Viagem[] = [];
  // Atribui um valor a esta propriedade.
  usuarioNaoAutenticado = false;
  
  // Define um membro interno desta classe.
  private unsubscribeCustos: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private unsubscribeViagens: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private unsubscribeAuth: any = null;
  // Define um membro interno desta classe.
  private custosBase: Custo[] = [];
  // Define um membro interno desta classe.
  private viagens: Viagem[] = [];
  // Define um membro interno desta classe.
  private custosCarregados = false;
  // Define um membro interno desta classe.
  private viagensCarregadas = false;
  // Define um membro interno desta classe.
  private ultimoUsuario: any = undefined;
  // Define um membro interno desta classe.
  private carregamentoInicializado = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private custosService: CustosService,
    // Define um membro interno desta classe.
    private custosPdfService: CustosPdfService,
    // Define um membro interno desta classe.
    private pdfShareService: PdfShareService,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private toastController: ToastController,
    // Define um membro interno desta classe.
    private afAuth: AngularFireAuth,
    // Define um membro interno desta classe.
    private router: Router
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit(): void {
    // Subscrever ao estado de autenticação e recarregar custos quando mudar
    this.unsubscribeAuth = this.afAuth.authState.subscribe(user => {
      // Se o utilizador mudou (fez login, logout, ou muda de conta)
      if (!this.carregamentoInicializado || user?.uid !== this.ultimoUsuario?.uid) {
        // Atualiza ou consulta estado da pagina.
        this.ultimoUsuario = user;
        // Atualiza ou consulta estado da pagina.
        this.carregamentoInicializado = true;
        // Atualiza ou consulta estado da pagina.
        this.carregarCustos();
      }
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy(): void {
    // Atualiza ou consulta estado da pagina.
    this.limparSubscricoes();
    // Atualiza ou consulta estado da pagina.
    this.unsubscribeAuth?.unsubscribe?.();
  }

  // Define um membro interno desta classe.
  private carregarCustos(): void {
    // Atualiza ou consulta estado da pagina.
    this.limparSubscricoes();

    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erroCarregamento = '';
    // Atualiza ou consulta estado da pagina.
    this.usuarioNaoAutenticado = false;
    // Atualiza ou consulta estado da pagina.
    this.custosBase = [];
    // Atualiza ou consulta estado da pagina.
    this.viagens = [];
    // Atualiza ou consulta estado da pagina.
    this.custosCarregados = false;
    // Atualiza ou consulta estado da pagina.
    this.viagensCarregadas = false;

    // Atualiza ou consulta estado da pagina.
    this.unsubscribeCustos = this.custosService.subscribeToCustos(
      // Executa uma instrucao necessaria para este fluxo.
      (custos: Custo[]) => {
        // Atualiza ou consulta estado da pagina.
        this.custosBase = custos;
        // Atualiza ou consulta estado da pagina.
        this.custosCarregados = true;
        // Atualiza ou consulta estado da pagina.
        this.atualizarResumo();
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error: any) => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar custos:', error);
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (error?.message?.includes('iniciar sessão')) {
          // Atualiza ou consulta estado da pagina.
          this.usuarioNaoAutenticado = true;
          // Atualiza ou consulta estado da pagina.
          this.erroCarregamento = '';
        // Executa uma instrucao necessaria para este fluxo.
        } else {
          // Atualiza ou consulta estado da pagina.
          this.erroCarregamento = 'Erro ao carregar custos. Tente novamente.';
        }
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      }
    );

    // Atualiza ou consulta estado da pagina.
    this.unsubscribeViagens = this.viagensService.subscribeToViagens(
      // Executa uma instrucao necessaria para este fluxo.
      (viagens: Viagem[]) => {
        // Atualiza ou consulta estado da pagina.
        this.viagens = viagens;
        // Atualiza ou consulta estado da pagina.
        this.viagensDisponiveis = viagens;

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (
          // Atualiza ou consulta estado da pagina.
          this.viagemSelecionadaId !== 'todas' &&
          // Executa uma instrucao necessaria para este fluxo.
          !viagens.some(viagem => viagem.id === this.viagemSelecionadaId)
        // Executa uma instrucao necessaria para este fluxo.
        ) {
          // Atualiza ou consulta estado da pagina.
          this.viagemSelecionadaId = 'todas';
        }

        // Atualiza ou consulta estado da pagina.
        this.viagensCarregadas = true;
        // Atualiza ou consulta estado da pagina.
        this.atualizarResumo();
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error: any) => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar viagens para custos dos POIs:', error);
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (error?.message?.includes('iniciar sessão')) {
          // Atualiza ou consulta estado da pagina.
          this.usuarioNaoAutenticado = true;
          // Atualiza ou consulta estado da pagina.
          this.erroCarregamento = '';
        // Executa uma instrucao necessaria para este fluxo.
        } else {
          // Atualiza ou consulta estado da pagina.
          this.erroCarregamento = 'Erro ao carregar custos dos POIs. Tente novamente.';
        }
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      }
    );
  }

  // Define um membro interno desta classe.
  private atualizarResumo(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custosCarregados || !this.viagensCarregadas) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.custos = this.filtrarCustosPorViagem(this.adicionarCustosDosPOIs(this.custosBase));
    // Atualiza ou consulta estado da pagina.
    this.processarCustos();
    // Atualiza ou consulta estado da pagina.
    this.carregando = false;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  selecionarViagem(viagemId: string | number | null | undefined): void {
    // Atualiza ou consulta estado da pagina.
    this.viagemSelecionadaId = viagemId ? String(viagemId) : 'todas';
    // Atualiza ou consulta estado da pagina.
    this.atualizarResumo();
  }

  // Define um membro interno desta classe.
  private adicionarCustosDosPOIs(custosBase: Custo[]): Custo[] {
    // Cria uma variavel local para esta operacao.
    const custosComPOIs = [...custosBase];
    // Cria uma variavel local para esta operacao.
    const idsExistentes = new Set(custosComPOIs.map(custo => custo.id));

    // Inicia um bloco protegido contra erros.
    try {
      // Atualiza ou consulta estado da pagina.
      this.viagens.forEach(viagem => {
        // Executa uma instrucao necessaria para este fluxo.
        viagem.dias?.forEach(dia => {
          // Executa uma instrucao necessaria para este fluxo.
          dia.pontosInteresse?.forEach(poi => {
            // Cria uma variavel local para esta operacao.
            const valor = Number(poi.custo);

            // Define um metodo chamado pela pagina ou por outros metodos.
            if (!Number.isFinite(valor) || valor <= 0) {
              // Devolve o resultado deste bloco.
              return;
            }

            // Cria uma variavel local para esta operacao.
            const custoPOI: Custo = {
              // Define um campo ou opcao de configuracao.
              id: `poi-custo-${poi.id}`,
              // Define um campo ou opcao de configuracao.
              descricao: `${poi.nome} (POI)`,
              // Executa uma instrucao necessaria para este fluxo.
              valor,
              // Define um campo ou opcao de configuracao.
              moeda: 'EUR',
              // Define um campo ou opcao de configuracao.
              data: this.normalizarData(dia.data),
              // Define um campo ou opcao de configuracao.
              categoria: poi.categoria?.trim() || 'Sem categoria',
              // Define um campo ou opcao de configuracao.
              viagemId: viagem.id,
              // Define um campo ou opcao de configuracao.
              diaId: dia.id,
              // Define um campo ou opcao de configuracao.
              poiId: poi.id
            };

            // Define um metodo chamado pela pagina ou por outros metodos.
            if (!idsExistentes.has(custoPOI.id)) {
              // Executa uma instrucao necessaria para este fluxo.
              custosComPOIs.push(custoPOI);
              // Executa uma instrucao necessaria para este fluxo.
              idsExistentes.add(custoPOI.id);
            }
          });
        });
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao adicionar custos dos POIs:', error);
    }

    // Devolve o resultado deste bloco.
    return custosComPOIs;
  }

  // Define um membro interno desta classe.
  private filtrarCustosPorViagem(custos: Custo[]): Custo[] {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemSelecionadaId === 'todas') {
      // Devolve o resultado deste bloco.
      return custos;
    }

    // Devolve o resultado deste bloco.
    return custos.filter(custo => custo.viagemId === this.viagemSelecionadaId);
  }

  // Define um membro interno desta classe.
  private limparSubscricoes(): void {
    // Atualiza ou consulta estado da pagina.
    this.unsubscribeCustos?.();
    // Atualiza ou consulta estado da pagina.
    this.unsubscribeViagens?.();
    // Atualiza ou consulta estado da pagina.
    this.unsubscribeCustos = null;
    // Atualiza ou consulta estado da pagina.
    this.unsubscribeViagens = null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaPerfil(): void {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs/perfil']);
  }

  // Define um membro interno desta classe.
  private processarCustos(): void {
    // Agrupar por categoria
    const categorias = this.custosService.calcularCustosPorCategoria(this.custos);
    // Atualiza ou consulta estado da pagina.
    this.totalGeral = this.custosService.calcularTotalCustos(this.custos);

    // Converter para array e adicionar percentuais
    this.custosPorCategoria = Object.entries(categorias).map(([categoria, total]) => ({
      // Executa uma instrucao necessaria para este fluxo.
      categoria,
      // Define um campo ou opcao de configuracao.
      categoriaLabel: this.obterLabelCategoria(categoria),
      // Executa uma instrucao necessaria para este fluxo.
      total,
      // Define um campo ou opcao de configuracao.
      percentual: this.totalGeral > 0 ? (total / this.totalGeral) * 100 : 0,
      // Define um campo ou opcao de configuracao.
      icone: this.obterIconeCategoria(categoria),
      // Define um campo ou opcao de configuracao.
      cor: this.obterCorCategoria(categoria),
      // Define um campo ou opcao de configuracao.
      corHex: this.obterCorHexadecimalCategoria(categoria)
    }));

    // Ordenar por total descendente
    this.custosPorCategoria.sort((a, b) => b.total - a.total);
  }

  // Define um membro interno desta classe.
  private obterLabelCategoria(categoria: string): string {
    // Devolve o resultado deste bloco.
    return categoria.toLowerCase() === 'hospedagem' ? 'Alojamento' : categoria;
  }

  // Define um membro interno desta classe.
  private obterIconeCategoria(categoria: string): string {
    // Cria uma variavel local para esta operacao.
    const iconesMap: Record<string, string> = {
      // Executa uma instrucao necessaria para este fluxo.
      'Alimentação': 'restaurant',
      // Executa uma instrucao necessaria para este fluxo.
      'alimentação': 'restaurant',
      // Executa uma instrucao necessaria para este fluxo.
      'alimentacao': 'restaurant',
      // Executa uma instrucao necessaria para este fluxo.
      'Transporte': 'car',
      // Executa uma instrucao necessaria para este fluxo.
      'transporte': 'car',
      // Executa uma instrucao necessaria para este fluxo.
      'Hospedagem': 'bed',
      // Executa uma instrucao necessaria para este fluxo.
      'hospedagem': 'bed',
      // Executa uma instrucao necessaria para este fluxo.
      'Alojamento': 'bed',
      // Executa uma instrucao necessaria para este fluxo.
      'alojamento': 'bed',
      // Executa uma instrucao necessaria para este fluxo.
      'Compras': 'bag-handle',
      // Executa uma instrucao necessaria para este fluxo.
      'compras': 'bag-handle',
      // Executa uma instrucao necessaria para este fluxo.
      'Cultura': 'ticket',
      // Executa uma instrucao necessaria para este fluxo.
      'cultura': 'ticket',
      // Executa uma instrucao necessaria para este fluxo.
      'Natureza': 'leaf',
      // Executa uma instrucao necessaria para este fluxo.
      'natureza': 'leaf',
      // Executa uma instrucao necessaria para este fluxo.
      'Aventura': 'bicycle',
      // Executa uma instrucao necessaria para este fluxo.
      'aventura': 'bicycle',
      // Executa uma instrucao necessaria para este fluxo.
      'Gastronomia': 'wine',
      // Executa uma instrucao necessaria para este fluxo.
      'gastronomia': 'wine',
      // Executa uma instrucao necessaria para este fluxo.
      'Outro': 'cash',
      // Executa uma instrucao necessaria para este fluxo.
      'outro': 'cash',
      // Executa uma instrucao necessaria para este fluxo.
      'Sem categoria': 'ellipsis-horizontal',
      // Executa uma instrucao necessaria para este fluxo.
      'sem categoria': 'ellipsis-horizontal'
    };
    // Devolve o resultado deste bloco.
    return iconesMap[categoria] || 'cash';
  }

  // Define um membro interno desta classe.
  private obterCorCategoria(categoria: string): string {
    // Cria uma variavel local para esta operacao.
    const coresMap: Record<string, string> = {
      // Executa uma instrucao necessaria para este fluxo.
      'Alimentação': 'danger',
      // Executa uma instrucao necessaria para este fluxo.
      'alimentação': 'danger',
      // Executa uma instrucao necessaria para este fluxo.
      'alimentacao': 'danger',
      // Executa uma instrucao necessaria para este fluxo.
      'Transporte': 'warning',
      // Executa uma instrucao necessaria para este fluxo.
      'transporte': 'warning',
      // Executa uma instrucao necessaria para este fluxo.
      'Hospedagem': 'primary',
      // Executa uma instrucao necessaria para este fluxo.
      'hospedagem': 'primary',
      // Executa uma instrucao necessaria para este fluxo.
      'Alojamento': 'primary',
      // Executa uma instrucao necessaria para este fluxo.
      'alojamento': 'primary',
      // Executa uma instrucao necessaria para este fluxo.
      'Compras': 'secondary',
      // Executa uma instrucao necessaria para este fluxo.
      'compras': 'secondary',
      // Executa uma instrucao necessaria para este fluxo.
      'Cultura': 'tertiary',
      // Executa uma instrucao necessaria para este fluxo.
      'cultura': 'tertiary',
      // Executa uma instrucao necessaria para este fluxo.
      'Natureza': 'success',
      // Executa uma instrucao necessaria para este fluxo.
      'natureza': 'success',
      // Executa uma instrucao necessaria para este fluxo.
      'Aventura': 'medium',
      // Executa uma instrucao necessaria para este fluxo.
      'aventura': 'medium',
      // Executa uma instrucao necessaria para este fluxo.
      'Gastronomia': 'warning',
      // Executa uma instrucao necessaria para este fluxo.
      'gastronomia': 'warning',
      // Executa uma instrucao necessaria para este fluxo.
      'Outro': 'medium',
      // Executa uma instrucao necessaria para este fluxo.
      'outro': 'medium',
      // Executa uma instrucao necessaria para este fluxo.
      'Sem categoria': 'light',
      // Executa uma instrucao necessaria para este fluxo.
      'sem categoria': 'light'
    };
    // Devolve o resultado deste bloco.
    return coresMap[categoria] || 'medium';
  }

  // Define um membro interno desta classe.
  private obterChaveCategoria(categoria: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (categoria || 'sem categoria')
      // Executa uma instrucao necessaria para este fluxo.
      .normalize('NFD')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/[\u0300-\u036f]/g, '')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/\s+/g, '')
      // Executa uma instrucao necessaria para este fluxo.
      .toLowerCase();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCorHexadecimalCategoria(categoria: string): string {
    // Cria uma variavel local para esta operacao.
    const chave = this.obterChaveCategoria(categoria);
    // Devolve o resultado deste bloco.
    return CORES_CATEGORIA[chave] || this.obterCorHexadecimal(this.obterCorCategoria(categoria));
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCorHexadecimal(corIonica: string): string {
    // Cria uma variavel local para esta operacao.
    const coresMap: Record<string, string> = {
      // Executa uma instrucao necessaria para este fluxo.
      'primary': '#3880FF',
      // Executa uma instrucao necessaria para este fluxo.
      'secondary': '#A855F7',
      // Executa uma instrucao necessaria para este fluxo.
      'tertiary': '#14B8A6',
      // Executa uma instrucao necessaria para este fluxo.
      'success': '#2DD36F',
      // Executa uma instrucao necessaria para este fluxo.
      'warning': '#FFC409',
      // Executa uma instrucao necessaria para este fluxo.
      'danger': '#FF4755',
      // Executa uma instrucao necessaria para este fluxo.
      'medium': '#64748B',
      // Executa uma instrucao necessaria para este fluxo.
      'light': '#94A3B8'
    };
    // Devolve o resultado deste bloco.
    return coresMap[corIonica] || '#3880FF';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterLarguraPercentual(percentual: number): string {
    // Devolve o resultado deste bloco.
    return `${Math.min(percentual, 100)}%`;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarValor(valor: number): string {
    // Devolve o resultado deste bloco.
    return valor.toFixed(2).replace('.', ',');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterSegmentosGrafico(): SegmentoGrafico[] {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custosPorCategoria || this.custosPorCategoria.length === 0) {
      // Devolve o resultado deste bloco.
      return [];
    }

    // Cria uma variavel local para esta operacao.
    const perimetro = 2 * Math.PI * 70;
    // Cria uma variavel local para esta operacao.
    const segmentos: SegmentoGrafico[] = [];
    // Cria uma variavel local para esta operacao.
    let dashoffset = 0;

    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const categoria of this.custosPorCategoria) {
      // Cria uma variavel local para esta operacao.
      const dasharray = (categoria.percentual / 100) * perimetro;
      // Executa uma instrucao necessaria para este fluxo.
      segmentos.push({
        // Define um campo ou opcao de configuracao.
        categoria: categoria.categoriaLabel,
        // Define um campo ou opcao de configuracao.
        valor: categoria.total,
        // Define um campo ou opcao de configuracao.
        percentual: categoria.percentual,
        // Define um campo ou opcao de configuracao.
        cor: categoria.corHex,
        // Executa uma instrucao necessaria para este fluxo.
        dasharray,
        // Define um campo ou opcao de configuracao.
        dashgap: perimetro - dasharray,
        // Executa uma instrucao necessaria para este fluxo.
        dashoffset
      });
      // Executa uma instrucao necessaria para este fluxo.
      dashoffset -= dasharray;
    }

    // Devolve o resultado deste bloco.
    return segmentos;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  recarregar(): void {
    // Atualiza ou consulta estado da pagina.
    this.carregarCustos();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async gerarPdfCustosPorCategoria(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.gerandoPdf || this.partilhandoPdf || this.custos.length === 0) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.gerandoPdf = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Atualiza ou consulta estado da pagina.
      this.custosPdfService.gerarRelatorioPorCategoria({
        // Define um campo ou opcao de configuracao.
        custos: this.custos,
        // Define um campo ou opcao de configuracao.
        categorias: this.custosPorCategoria,
        // Define um campo ou opcao de configuracao.
        totalGeral: this.totalGeral
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('PDF de custos gerado com sucesso.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF de custos:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Erro ao gerar PDF de custos.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.gerandoPdf = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async partilharPdfCustosPorCategoria(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.partilhandoPdf || this.gerandoPdf || this.custos.length === 0) {
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
      const pdf = this.custosPdfService.criarRelatorioPorCategoria({
        // Define um campo ou opcao de configuracao.
        custos: this.custos,
        // Define um campo ou opcao de configuracao.
        categorias: this.custosPorCategoria,
        // Define um campo ou opcao de configuracao.
        totalGeral: this.totalGeral
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.pdfShareService.sharePdf(pdf, {
        // Define um campo ou opcao de configuracao.
        title: 'Relatorio de custos por categoria',
        // Define um campo ou opcao de configuracao.
        text: 'PDF com o resumo de custos por categoria.',
        // Define um campo ou opcao de configuracao.
        dialogTitle: 'Partilhar relatorio de custos'
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.message?.toLowerCase().includes('cancel')) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao partilhar PDF de custos:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao partilhar PDF de custos.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.partilhandoPdf = false;
    }
  }

  // Define um membro interno desta classe.
  private normalizarData(data: any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data?.toDate instanceof Function) {
      // Devolve o resultado deste bloco.
      return data.toDate();
    }

    // Cria uma variavel local para esta operacao.
    const dataConvertida = new Date(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(dataConvertida.getTime()) ? new Date() : dataConvertida;
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastController.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2000,
      // Define um campo ou opcao de configuracao.
      position: 'bottom',
      // Executa uma instrucao necessaria para este fluxo.
      color
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }
}
