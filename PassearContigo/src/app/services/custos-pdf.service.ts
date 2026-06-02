import { Injectable } from '@angular/core';
import { Custo } from '../models/viagem.model';
import { PdfDocumentBase } from './pdf-document.base';
import { PdfGerado } from './pdf-share.service';

export interface CategoriaRelatorioCusto {
  categoria: string;
  total: number;
  percentual: number;
  cor?: string;
}

interface CustosPdfData {
  custos: Custo[];
  categorias: CategoriaRelatorioCusto[];
  totalGeral: number;
}

@Injectable({
  providedIn: 'root'
})
export class CustosPdfService extends PdfDocumentBase {
  gerarRelatorioPorCategoria({ custos, categorias, totalGeral }: CustosPdfData): void {
    const pdf = this.criarRelatorioPorCategoria({ custos, categorias, totalGeral });
    this.doc.save(pdf.fileName);
  }

  criarRelatorioPorCategoria({ custos, categorias, totalGeral }: CustosPdfData): PdfGerado {
    this.iniciarDocumento();

    this.adicionarCabecalho(custos, categorias, totalGeral);
    this.adicionarResumoCategorias(categorias, totalGeral);
    this.adicionarDetalheCategorias(custos, categorias);
    this.adicionarRodapes('Passear Contigo - Relatorio de Custos');

    return {
      fileName: `relatorio-custos-${this.obterDataFicheiro()}.pdf`,
      base64: this.obterBase64Pdf()
    };
  }

  private adicionarCabecalho(custos: Custo[], categorias: CategoriaRelatorioCusto[], totalGeral: number): void {
    this.doc.setTextColor(35, 35, 35);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(21);
    this.doc.text('Relatorio de Custos por Categoria', this.marginX, this.y);
    this.y += 10;

    this.escreverTexto([
      `Gerado em: ${new Date().toLocaleDateString('pt-PT')}`,
      `Total de custos: ${custos.length}`,
      `Categorias: ${categorias.length}`,
      `Total geral: ${this.formatarValor(totalGeral)} EUR`
    ].join('\n'), 11);
  }

  private adicionarResumoCategorias(categorias: CategoriaRelatorioCusto[], totalGeral: number): void {
    this.adicionarEspaco(6);
    this.escreverTituloSecao('Resumo');

    if (categorias.length === 0) {
      this.escreverTexto('Sem custos para apresentar.', 10);
      return;
    }

    this.garantirEspaco(12);
    this.desenharLinhaTabela(['Categoria', 'Total', 'Percentagem'], true);

    categorias.forEach(categoria => {
      this.desenharLinhaTabela([
        categoria.categoria,
        `${this.formatarValor(categoria.total)} EUR`,
        `${categoria.percentual.toFixed(1)}%`
      ]);

      this.desenharBarraPercentual(categoria.percentual, this.obterCorRgb(categoria.cor));
    });

    this.adicionarEspaco(3);
    this.escreverTexto(`Total: ${this.formatarValor(totalGeral)} EUR`, 11, 'bold');
  }

  private adicionarDetalheCategorias(custos: Custo[], categorias: CategoriaRelatorioCusto[]): void {
    this.adicionarEspaco(6);
    this.escreverTituloSecao('Detalhe por categoria');

    categorias.forEach(categoria => {
      const custosCategoria = custos.filter(custo => this.obterCategoriaCusto(custo) === categoria.categoria);

      this.garantirEspaco(18);
      this.doc.setFillColor(...this.obterCorRgb(categoria.cor, true));
      this.doc.roundedRect(this.marginX, this.y, this.contentWidth, 9, 1.5, 1.5, 'F');
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.setTextColor(35, 35, 35);
      this.doc.text(
        `${categoria.categoria} - ${this.formatarValor(categoria.total)} EUR (${categoria.percentual.toFixed(1)}%)`,
        this.marginX + 3,
        this.y + 6
      );
      this.y += 12;

      if (custosCategoria.length === 0) {
        this.escreverTexto('Sem movimentos nesta categoria.', 9);
        return;
      }

      custosCategoria.forEach(custo => {
        this.escreverTexto(this.formatarLinhaCusto(custo), 9);
      });

      this.adicionarEspaco(3);
    });
  }

  private desenharLinhaTabela(colunas: string[], header = false): void {
    this.garantirEspaco(8);
    const widths = [90, 42, 42];
    const x = [this.marginX, this.marginX + widths[0], this.marginX + widths[0] + widths[1]];

    if (header) {
      this.doc.setFillColor(28, 105, 112);
      this.doc.rect(this.marginX, this.y - 5, this.contentWidth, 8, 'F');
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFont('helvetica', 'bold');
    } else {
      this.doc.setTextColor(45, 45, 45);
      this.doc.setFont('helvetica', 'normal');
    }

    this.doc.setFontSize(9);
    colunas.forEach((coluna, index) => {
      this.doc.text(coluna, x[index] + 2, this.y);
    });

    this.y += 8;
  }

  private desenharBarraPercentual(percentual: number, cor: [number, number, number]): void {
    const largura = Math.max(0, Math.min(percentual, 100)) * (this.contentWidth / 100);
    this.doc.setFillColor(232, 236, 241);
    this.doc.rect(this.marginX, this.y - 3, this.contentWidth, 2.2, 'F');
    this.doc.setFillColor(...cor);
    this.doc.rect(this.marginX, this.y - 3, largura, 2.2, 'F');
    this.y += 3;
  }

  private formatarLinhaCusto(custo: Custo): string {
    const partes = [
      `- ${custo.descricao || 'Custo'}`,
      `${this.formatarValor(custo.valor)} ${custo.moeda || 'EUR'}`,
      this.formatarData(custo.data),
      custo.viagemId ? `Viagem: ${custo.viagemId}` : '',
      custo.poiId ? 'POI' : ''
    ];

    return partes.filter(Boolean).join(' | ');
  }

  private obterCategoriaCusto(custo: Custo): string {
    return custo.categoria?.trim() || 'Sem categoria';
  }

  private obterDataFicheiro(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private obterCorRgb(cor?: string, suave = false): [number, number, number] {
    const cores: Record<string, [number, number, number]> = {
      primary: [56, 128, 255],
      secondary: [45, 211, 111],
      tertiary: [255, 196, 9],
      success: [45, 211, 111],
      warning: [255, 196, 9],
      danger: [255, 71, 85],
      medium: [146, 148, 156],
      light: [244, 245, 248]
    };

    const rgb = cores[cor || 'primary'] || cores['primary'];
    if (!suave) {
      return rgb;
    }

    return [
      Math.round((rgb[0] + 255 * 3) / 4),
      Math.round((rgb[1] + 255 * 3) / 4),
      Math.round((rgb[2] + 255 * 3) / 4)
    ];
  }

}
