import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CustosService } from '../../services/custos.service';
import { CustosPdfService } from '../../services/custos-pdf.service';
import { PdfShareService } from '../../services/pdf-share.service';
import { ViagensService } from '../../services/viagens.service';
import { Custo, Viagem } from '../../models/viagem.model';
import { Unsubscribe } from 'firebase/firestore';
import { ToastController } from '@ionic/angular';

interface CustosPorCategoria {
  categoria: string;
  total: number;
  percentual: number;
  icone: string;
  cor: string;
  corHex: string;
}

interface SegmentoGrafico {
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
  dasharray: number;
  dashgap: number;
  dashoffset: number;
}

const CORES_CATEGORIA: Record<string, string> = {
  alimentacao: '#E75A5A',
  transporte: '#F6A23A',
  hospedagem: '#3F7CFF',
  alojamento: '#3F7CFF',
  compras: '#A855F7',
  cultura: '#14B8A6',
  natureza: '#22A65A',
  aventura: '#E56B2F',
  gastronomia: '#D9468F',
  outro: '#64748B',
  semcategoria: '#94A3B8'
};

@Component({
  selector: 'app-resumo-custos',
  standalone: false,
  templateUrl: './resumo-custos.page.html',
  styleUrls: ['./resumo-custos.page.scss']
})
export class ResumoCustosPage implements OnInit, OnDestroy {
  custos: Custo[] = [];
  custosPorCategoria: CustosPorCategoria[] = [];
  totalGeral = 0;
  carregando = true;
  erroCarregamento = '';
  gerandoPdf = false;
  partilhandoPdf = false;
  viagemSelecionadaId = 'todas';
  viagensDisponiveis: Viagem[] = [];
  usuarioNaoAutenticado = false;
  
  private unsubscribeCustos: Unsubscribe | null = null;
  private unsubscribeViagens: Unsubscribe | null = null;
  private unsubscribeAuth: any = null;
  private custosBase: Custo[] = [];
  private viagens: Viagem[] = [];
  private custosCarregados = false;
  private viagensCarregadas = false;
  private ultimoUsuario: any = null;

  constructor(
    private custosService: CustosService,
    private custosPdfService: CustosPdfService,
    private pdfShareService: PdfShareService,
    private viagensService: ViagensService,
    private toastController: ToastController,
    private afAuth: AngularFireAuth,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Subscrever ao estado de autenticação e recarregar custos quando mudar
    this.unsubscribeAuth = this.afAuth.authState.subscribe(user => {
      // Se o utilizador mudou (fez login, logout, ou muda de conta)
      if (user?.uid !== this.ultimoUsuario?.uid) {
        this.ultimoUsuario = user;
        this.carregarCustos();
      }
    });
  }

  ngOnDestroy(): void {
    this.limparSubscricoes();
    this.unsubscribeAuth?.unsubscribe?.();
  }

  private carregarCustos(): void {
    this.limparSubscricoes();

    this.carregando = true;
    this.erroCarregamento = '';
    this.usuarioNaoAutenticado = false;
    this.custosBase = [];
    this.viagens = [];
    this.custosCarregados = false;
    this.viagensCarregadas = false;

    this.unsubscribeCustos = this.custosService.subscribeToCustos(
      (custos: Custo[]) => {
        this.custosBase = custos;
        this.custosCarregados = true;
        this.atualizarResumo();
      },
      (error: any) => {
        console.error('Erro ao carregar custos:', error);
        if (error?.message?.includes('iniciar sessão')) {
          this.usuarioNaoAutenticado = true;
          this.erroCarregamento = '';
        } else {
          this.erroCarregamento = 'Erro ao carregar custos. Tente novamente.';
        }
        this.carregando = false;
      }
    );

    this.unsubscribeViagens = this.viagensService.subscribeToViagens(
      (viagens: Viagem[]) => {
        this.viagens = viagens;
        this.viagensDisponiveis = viagens;

        if (
          this.viagemSelecionadaId !== 'todas' &&
          !viagens.some(viagem => viagem.id === this.viagemSelecionadaId)
        ) {
          this.viagemSelecionadaId = 'todas';
        }

        this.viagensCarregadas = true;
        this.atualizarResumo();
      },
      (error: any) => {
        console.error('Erro ao carregar viagens para custos dos POIs:', error);
        if (error?.message?.includes('iniciar sessão')) {
          this.usuarioNaoAutenticado = true;
          this.erroCarregamento = '';
        } else {
          this.erroCarregamento = 'Erro ao carregar custos dos POIs. Tente novamente.';
        }
        this.carregando = false;
      }
    );
  }

  private atualizarResumo(): void {
    if (!this.custosCarregados || !this.viagensCarregadas) {
      return;
    }

    this.custos = this.filtrarCustosPorViagem(this.adicionarCustosDosPOIs(this.custosBase));
    this.processarCustos();
    this.carregando = false;
  }

  selecionarViagem(viagemId: string | number | null | undefined): void {
    this.viagemSelecionadaId = viagemId ? String(viagemId) : 'todas';
    this.atualizarResumo();
  }

  private adicionarCustosDosPOIs(custosBase: Custo[]): Custo[] {
    const custosComPOIs = [...custosBase];
    const idsExistentes = new Set(custosComPOIs.map(custo => custo.id));

    try {
      this.viagens.forEach(viagem => {
        viagem.dias?.forEach(dia => {
          dia.pontosInteresse?.forEach(poi => {
            const valor = Number(poi.custo);

            if (!Number.isFinite(valor) || valor <= 0) {
              return;
            }

            const custoPOI: Custo = {
              id: `poi-custo-${poi.id}`,
              descricao: `${poi.nome} (POI)`,
              valor,
              moeda: 'EUR',
              data: this.normalizarData(dia.data),
              categoria: poi.categoria?.trim() || 'Sem categoria',
              viagemId: viagem.id,
              diaId: dia.id,
              poiId: poi.id
            };

            if (!idsExistentes.has(custoPOI.id)) {
              custosComPOIs.push(custoPOI);
              idsExistentes.add(custoPOI.id);
            }
          });
        });
      });
    } catch (error) {
      console.error('Erro ao adicionar custos dos POIs:', error);
    }

    return custosComPOIs;
  }

  private filtrarCustosPorViagem(custos: Custo[]): Custo[] {
    if (this.viagemSelecionadaId === 'todas') {
      return custos;
    }

    return custos.filter(custo => custo.viagemId === this.viagemSelecionadaId);
  }

  private limparSubscricoes(): void {
    this.unsubscribeCustos?.();
    this.unsubscribeViagens?.();
    this.unsubscribeCustos = null;
    this.unsubscribeViagens = null;
  }

  irParaPerfil(): void {
    this.router.navigate(['/tabs/perfil']);
  }

  private processarCustos(): void {
    // Agrupar por categoria
    const categorias = this.custosService.calcularCustosPorCategoria(this.custos);
    this.totalGeral = this.custosService.calcularTotalCustos(this.custos);

    // Converter para array e adicionar percentuais
    this.custosPorCategoria = Object.entries(categorias).map(([categoria, total]) => ({
      categoria,
      total,
      percentual: this.totalGeral > 0 ? (total / this.totalGeral) * 100 : 0,
      icone: this.obterIconeCategoria(categoria),
      cor: this.obterCorCategoria(categoria),
      corHex: this.obterCorHexadecimalCategoria(categoria)
    }));

    // Ordenar por total descendente
    this.custosPorCategoria.sort((a, b) => b.total - a.total);
  }

  private obterIconeCategoria(categoria: string): string {
    const iconesMap: Record<string, string> = {
      'Alimentação': 'restaurant',
      'alimentação': 'restaurant',
      'alimentacao': 'restaurant',
      'Transporte': 'car',
      'transporte': 'car',
      'Hospedagem': 'bed',
      'hospedagem': 'bed',
      'Alojamento': 'bed',
      'alojamento': 'bed',
      'Compras': 'bag-handle',
      'compras': 'bag-handle',
      'Cultura': 'ticket',
      'cultura': 'ticket',
      'Natureza': 'leaf',
      'natureza': 'leaf',
      'Aventura': 'bicycle',
      'aventura': 'bicycle',
      'Gastronomia': 'wine',
      'gastronomia': 'wine',
      'Outro': 'cash',
      'outro': 'cash',
      'Sem categoria': 'ellipsis-horizontal',
      'sem categoria': 'ellipsis-horizontal'
    };
    return iconesMap[categoria] || 'cash';
  }

  private obterCorCategoria(categoria: string): string {
    const coresMap: Record<string, string> = {
      'Alimentação': 'danger',
      'alimentação': 'danger',
      'alimentacao': 'danger',
      'Transporte': 'warning',
      'transporte': 'warning',
      'Hospedagem': 'primary',
      'hospedagem': 'primary',
      'Alojamento': 'primary',
      'alojamento': 'primary',
      'Compras': 'secondary',
      'compras': 'secondary',
      'Cultura': 'tertiary',
      'cultura': 'tertiary',
      'Natureza': 'success',
      'natureza': 'success',
      'Aventura': 'medium',
      'aventura': 'medium',
      'Gastronomia': 'warning',
      'gastronomia': 'warning',
      'Outro': 'medium',
      'outro': 'medium',
      'Sem categoria': 'light',
      'sem categoria': 'light'
    };
    return coresMap[categoria] || 'medium';
  }

  private obterChaveCategoria(categoria: string): string {
    return (categoria || 'sem categoria')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, '')
      .toLowerCase();
  }

  obterCorHexadecimalCategoria(categoria: string): string {
    const chave = this.obterChaveCategoria(categoria);
    return CORES_CATEGORIA[chave] || this.obterCorHexadecimal(this.obterCorCategoria(categoria));
  }

  obterCorHexadecimal(corIonica: string): string {
    const coresMap: Record<string, string> = {
      'primary': '#3880FF',
      'secondary': '#A855F7',
      'tertiary': '#14B8A6',
      'success': '#2DD36F',
      'warning': '#FFC409',
      'danger': '#FF4755',
      'medium': '#64748B',
      'light': '#94A3B8'
    };
    return coresMap[corIonica] || '#3880FF';
  }

  obterLarguraPercentual(percentual: number): string {
    return `${Math.min(percentual, 100)}%`;
  }

  formatarValor(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  obterSegmentosGrafico(): SegmentoGrafico[] {
    if (!this.custosPorCategoria || this.custosPorCategoria.length === 0) {
      return [];
    }

    const perimetro = 2 * Math.PI * 70;
    const segmentos: SegmentoGrafico[] = [];
    let dashoffset = 0;

    for (const categoria of this.custosPorCategoria) {
      const dasharray = (categoria.percentual / 100) * perimetro;
      segmentos.push({
        categoria: categoria.categoria,
        valor: categoria.total,
        percentual: categoria.percentual,
        cor: categoria.corHex,
        dasharray,
        dashgap: perimetro - dasharray,
        dashoffset
      });
      dashoffset -= dasharray;
    }

    return segmentos;
  }

  recarregar(): void {
    this.carregarCustos();
  }

  async gerarPdfCustosPorCategoria(): Promise<void> {
    if (this.gerandoPdf || this.partilhandoPdf || this.custos.length === 0) {
      return;
    }

    this.gerandoPdf = true;

    try {
      this.custosPdfService.gerarRelatorioPorCategoria({
        custos: this.custos,
        categorias: this.custosPorCategoria,
        totalGeral: this.totalGeral
      });

      await this.mostrarToast('PDF de custos gerado com sucesso.', 'success');
    } catch (error) {
      console.error('Erro ao gerar PDF de custos:', error);
      await this.mostrarToast('Erro ao gerar PDF de custos.', 'danger');
    } finally {
      this.gerandoPdf = false;
    }
  }

  async partilharPdfCustosPorCategoria(): Promise<void> {
    if (this.partilhandoPdf || this.gerandoPdf || this.custos.length === 0) {
      return;
    }

    this.partilhandoPdf = true;

    try {
      const podePartilhar = await this.pdfShareService.canShare();
      if (!podePartilhar) {
        await this.mostrarToast('Partilha de PDF não disponível neste dispositivo.', 'danger');
        return;
      }

      const pdf = this.custosPdfService.criarRelatorioPorCategoria({
        custos: this.custos,
        categorias: this.custosPorCategoria,
        totalGeral: this.totalGeral
      });

      await this.pdfShareService.sharePdf(pdf, {
        title: 'Relatorio de custos por categoria',
        text: 'PDF com o resumo de custos por categoria.',
        dialogTitle: 'Partilhar relatorio de custos'
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('cancel')) {
        return;
      }

      console.error('Erro ao partilhar PDF de custos:', error);
      await this.mostrarToast(error?.message || 'Erro ao partilhar PDF de custos.', 'danger');
    } finally {
      this.partilhandoPdf = false;
    }
  }

  private normalizarData(data: any): Date {
    if (data instanceof Date) {
      return data;
    }

    if (data?.toDate instanceof Function) {
      return data.toDate();
    }

    const dataConvertida = new Date(data);
    return Number.isNaN(dataConvertida.getTime()) ? new Date() : dataConvertida;
  }

  private async mostrarToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}
