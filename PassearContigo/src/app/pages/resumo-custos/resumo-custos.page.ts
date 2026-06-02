import { Component, OnInit, OnDestroy } from '@angular/core';
import { CustosService } from '../../services/custos.service';
import { Custo } from '../../models/viagem.model';
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
  
  private unsubscribe: Unsubscribe | null = null;

  constructor(
    private custosService: CustosService,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.carregarCustos();
  }

  ngOnDestroy(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  private carregarCustos(): void {
    this.carregando = true;
    this.erroCarregamento = '';

    this.unsubscribe = this.custosService.subscribeToCustos(
      (custos: Custo[]) => {
        this.custos = custos;
        this.processarCustos();
        this.carregando = false;
      },
      (error: any) => {
        console.error('Erro ao carregar custos:', error);
        this.erroCarregamento = 'Erro ao carregar custos. Tente novamente.';
        this.carregando = false;
      }
    );
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
}
