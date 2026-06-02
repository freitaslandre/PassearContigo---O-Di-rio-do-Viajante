import { Component, OnInit, OnDestroy } from '@angular/core';
import { CustosService } from '../../services/custos.service';
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
}

interface SegmentoGrafico {
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
  dasharray: number;
  dashoffset: number;
}

const CATEGORIAS_DISPONIVEIS = [
  'Alimentação',
  'Transporte',
  'Hospedagem',
  'Compras',
  'Cultura',
  'Natureza',
  'Aventura',
  'Gastronomia',
  'Sem categoria'
];

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
  categoriasDisponiveis = CATEGORIAS_DISPONIVEIS;
  atualizandoCustoId: string | null = null;
  
  private unsubscribeCustos: Unsubscribe | null = null;
  private unsubscribeViagens: Unsubscribe | null = null;
  private custosBase: Custo[] = [];
  private viagens: Viagem[] = [];
  private custosCarregados = false;
  private viagensCarregadas = false;

  constructor(
    private custosService: CustosService,
    private viagensService: ViagensService,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.carregarCustos();
  }

  ngOnDestroy(): void {
    this.limparSubscricoes();
  }

  private carregarCustos(): void {
    this.limparSubscricoes();

    this.carregando = true;
    this.erroCarregamento = '';
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
        this.erroCarregamento = 'Erro ao carregar custos. Tente novamente.';
        this.carregando = false;
      }
    );

    this.unsubscribeViagens = this.viagensService.subscribeToViagens(
      (viagens: Viagem[]) => {
        this.viagens = viagens;
        this.viagensCarregadas = true;
        this.atualizarResumo();
      },
      (error: any) => {
        console.error('Erro ao carregar viagens para custos dos POIs:', error);
        this.erroCarregamento = 'Erro ao carregar custos dos POIs. Tente novamente.';
        this.carregando = false;
      }
    );
  }

  private atualizarResumo(): void {
    if (!this.custosCarregados || !this.viagensCarregadas) {
      return;
    }

    this.custos = this.adicionarCustosDosPOIs(this.custosBase);
    this.processarCustos();
    this.carregando = false;
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

  private limparSubscricoes(): void {
    this.unsubscribeCustos?.();
    this.unsubscribeViagens?.();
    this.unsubscribeCustos = null;
    this.unsubscribeViagens = null;
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
      cor: this.obterCorCategoria(categoria)
    }));

    // Ordenar por total descendente
    this.custosPorCategoria.sort((a, b) => b.total - a.total);
  }

  private obterIconeCategoria(categoria: string): string {
    const iconesMap: Record<string, string> = {
      'Alimentação': 'restaurant',
      'Transporte': 'car',
      'Hospedagem': 'bed',
      'Compras': 'shopping-bag',
      'Cultura': 'ticket',
      'Natureza': 'leaf',
      'Aventura': 'bicycle',
      'Gastronomia': 'wine',
      'Sem categoria': 'ellipsis-horizontal'
    };
    return iconesMap[categoria] || 'cash';
  }

  private obterCorCategoria(categoria: string): string {
    const coresMap: Record<string, string> = {
      'Alimentação': 'danger',
      'Transporte': 'warning',
      'Hospedagem': 'primary',
      'Compras': 'secondary',
      'Cultura': 'tertiary',
      'Natureza': 'success',
      'Aventura': 'medium',
      'Gastronomia': 'warning',
      'Sem categoria': 'light'
    };
    return coresMap[categoria] || 'medium';
  }

  obterCorHexadecimal(corIonica: string): string {
    const coresMap: Record<string, string> = {
      'primary': '#3880FF',
      'secondary': '#2DD36F',
      'tertiary': '#FFC409',
      'success': '#2DD36F',
      'warning': '#FFC409',
      'danger': '#FF4755',
      'medium': '#92949C',
      'light': '#F4F5F8'
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
        cor: this.obterCorHexadecimal(categoria.cor),
        dasharray,
        dashoffset
      });
      dashoffset -= dasharray;
    }

    return segmentos;
  }

  recarregar(): void {
    this.carregarCustos();
  }

  ehCustoDoPOI(custo: Custo): boolean {
    return custo.id.startsWith('poi-custo-');
  }

  async atualizarCategoriaCusto(custoId: string, novaCategoria: string): Promise<void> {
    if (!novaCategoria) {
      return;
    }

    this.atualizandoCustoId = custoId;
    
    try {
      await this.custosService.updateCusto(custoId, { categoria: novaCategoria });
      
      const toast = await this.toastController.create({
        message: 'Categoria atualizada com sucesso',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();
    } catch (erro) {
      console.error('Erro ao atualizar categoria:', erro);
      
      const toast = await this.toastController.create({
        message: 'Erro ao atualizar categoria',
        duration: 2000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.atualizandoCustoId = null;
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
}
