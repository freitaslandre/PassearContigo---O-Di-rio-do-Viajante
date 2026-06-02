import { Component, OnInit, OnDestroy } from '@angular/core';
import { CustosService } from '../../services/custos.service';
import { Custo } from '../../models/viagem.model';
import { Unsubscribe } from 'firebase/firestore';

interface CustosPorCategoria {
  categoria: string;
  total: number;
  percentual: number;
  icone: string;
  cor: string;
}

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
  
  private unsubscribe: Unsubscribe | null = null;

  constructor(private custosService: CustosService) {}

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

  obterLarguraPercentual(percentual: number): string {
    return `${Math.min(percentual, 100)}%`;
  }

  formatarValor(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  recarregar(): void {
    this.carregarCustos();
  }
}
