// app/services/custos-pdf.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Custo } from '../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { PdfDocumentBase } from './pdf-document.base';
// Importa dependencias usadas neste ficheiro.
import { PdfGerado } from './pdf-share.service';

// Contrato de dados usado para tipar objetos desta area.
export interface CategoriaRelatorioCusto {
  // Define um campo ou opcao de configuracao.
  categoria: string;
  // Define um campo ou opcao de configuracao.
  total: number;
  // Define um campo ou opcao de configuracao.
  percentual: number;
  // Executa uma instrucao necessaria para este fluxo.
  cor?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface CustosPdfData {
  // Define um campo ou opcao de configuracao.
  custos: Custo[];
  // Define um campo ou opcao de configuracao.
  categorias: CategoriaRelatorioCusto[];
  // Define um campo ou opcao de configuracao.
  totalGeral: number;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class CustosPdfService extends PdfDocumentBase {
  // Define um metodo chamado pela pagina ou por outros metodos.
  gerarRelatorioPorCategoria({ custos, categorias, totalGeral }: CustosPdfData): void {
    // Cria uma variavel local para esta operacao.
    const pdf = this.criarRelatorioPorCategoria({ custos, categorias, totalGeral });
    // Atualiza ou consulta estado da pagina.
    this.doc.save(pdf.fileName);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  criarRelatorioPorCategoria({ custos, categorias, totalGeral }: CustosPdfData): PdfGerado {
    // Atualiza ou consulta estado da pagina.
    this.iniciarDocumento();

    // Atualiza ou consulta estado da pagina.
    this.adicionarCabecalho(custos, categorias, totalGeral);
    // Atualiza ou consulta estado da pagina.
    this.adicionarResumoCategorias(categorias, totalGeral);
    // Atualiza ou consulta estado da pagina.
    this.adicionarDetalheCategorias(custos, categorias);
    // Atualiza ou consulta estado da pagina.
    this.adicionarRodapes('Passear Contigo - Relatorio de Custos');

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      fileName: `relatorio-custos-${this.obterDataFicheiro()}.pdf`,
      // Define um campo ou opcao de configuracao.
      base64: this.obterBase64Pdf()
    };
  }

  // Define um membro interno desta classe.
  private adicionarCabecalho(custos: Custo[], categorias: CategoriaRelatorioCusto[], totalGeral: number): void {
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(35, 35, 35);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(21);
    // Atualiza ou consulta estado da pagina.
    this.doc.text('Relatorio de Custos por Categoria', this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.y += 10;

    // Atualiza ou consulta estado da pagina.
    this.escreverTexto([
      // Executa uma instrucao necessaria para este fluxo.
      `Gerado em: ${new Date().toLocaleDateString('pt-PT')}`,
      // Executa uma instrucao necessaria para este fluxo.
      `Total de custos: ${custos.length}`,
      // Executa uma instrucao necessaria para este fluxo.
      `Categorias: ${categorias.length}`,
      // Executa uma instrucao necessaria para este fluxo.
      `Total geral: ${this.formatarValor(totalGeral)} EUR`
    // Executa uma instrucao necessaria para este fluxo.
    ].join('\n'), 11);
  }

  // Define um membro interno desta classe.
  private adicionarResumoCategorias(categorias: CategoriaRelatorioCusto[], totalGeral: number): void {
    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(6);
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Resumo');

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (categorias.length === 0) {
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto('Sem custos para apresentar.', 10);
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.garantirEspaco(12);
    // Atualiza ou consulta estado da pagina.
    this.desenharLinhaTabela(['Categoria', 'Total', 'Percentagem'], true);

    // Executa uma instrucao necessaria para este fluxo.
    categorias.forEach(categoria => {
      // Atualiza ou consulta estado da pagina.
      this.desenharLinhaTabela([
        // Executa uma instrucao necessaria para este fluxo.
        categoria.categoria,
        // Executa uma instrucao necessaria para este fluxo.
        `${this.formatarValor(categoria.total)} EUR`,
        // Executa uma instrucao necessaria para este fluxo.
        `${categoria.percentual.toFixed(1)}%`
      ]);

      // Atualiza ou consulta estado da pagina.
      this.desenharBarraPercentual(categoria.percentual, this.obterCorRgb(categoria.cor));
    });

    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(3);
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(`Total: ${this.formatarValor(totalGeral)} EUR`, 11, 'bold');
  }

  // Define um membro interno desta classe.
  private adicionarDetalheCategorias(custos: Custo[], categorias: CategoriaRelatorioCusto[]): void {
    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(6);
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Detalhe por categoria');

    // Executa uma instrucao necessaria para este fluxo.
    categorias.forEach(categoria => {
      // Cria uma variavel local para esta operacao.
      const custosCategoria = custos.filter(custo => this.obterCategoriaCusto(custo) === categoria.categoria);

      // Atualiza ou consulta estado da pagina.
      this.garantirEspaco(18);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFillColor(...this.obterCorRgb(categoria.cor, true));
      // Atualiza ou consulta estado da pagina.
      this.doc.roundedRect(this.marginX, this.y, this.contentWidth, 9, 1.5, 1.5, 'F');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'bold');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFontSize(11);
      // Atualiza ou consulta estado da pagina.
      this.doc.setTextColor(35, 35, 35);
      // Atualiza ou consulta estado da pagina.
      this.doc.text(
        // Executa uma instrucao necessaria para este fluxo.
        `${categoria.categoria} - ${this.formatarValor(categoria.total)} EUR (${categoria.percentual.toFixed(1)}%)`,
        // Atualiza ou consulta estado da pagina.
        this.marginX + 3,
        // Atualiza ou consulta estado da pagina.
        this.y + 6
      );
      // Atualiza ou consulta estado da pagina.
      this.y += 12;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (custosCategoria.length === 0) {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto('Sem movimentos nesta categoria.', 9);
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      custosCategoria.forEach(custo => {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(this.formatarLinhaCusto(custo), 9);
      });

      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
    });
  }

  // Define um membro interno desta classe.
  private desenharLinhaTabela(colunas: string[], header = false): void {
    // Atualiza ou consulta estado da pagina.
    this.garantirEspaco(8);
    // Cria uma variavel local para esta operacao.
    const widths = [90, 42, 42];
    // Cria uma variavel local para esta operacao.
    const x = [this.marginX, this.marginX + widths[0], this.marginX + widths[0] + widths[1]];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (header) {
      // Atualiza ou consulta estado da pagina.
      this.doc.setFillColor(28, 105, 112);
      // Atualiza ou consulta estado da pagina.
      this.doc.rect(this.marginX, this.y - 5, this.contentWidth, 8, 'F');
      // Atualiza ou consulta estado da pagina.
      this.doc.setTextColor(255, 255, 255);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'bold');
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.doc.setTextColor(45, 45, 45);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'normal');
    }

    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(9);
    // Executa uma instrucao necessaria para este fluxo.
    colunas.forEach((coluna, index) => {
      // Atualiza ou consulta estado da pagina.
      this.doc.text(coluna, x[index] + 2, this.y);
    });

    // Atualiza ou consulta estado da pagina.
    this.y += 8;
  }

  // Define um membro interno desta classe.
  private desenharBarraPercentual(percentual: number, cor: [number, number, number]): void {
    // Cria uma variavel local para esta operacao.
    const largura = Math.max(0, Math.min(percentual, 100)) * (this.contentWidth / 100);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFillColor(232, 236, 241);
    // Atualiza ou consulta estado da pagina.
    this.doc.rect(this.marginX, this.y - 3, this.contentWidth, 2.2, 'F');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFillColor(...cor);
    // Atualiza ou consulta estado da pagina.
    this.doc.rect(this.marginX, this.y - 3, largura, 2.2, 'F');
    // Atualiza ou consulta estado da pagina.
    this.y += 3;
  }

  // Define um membro interno desta classe.
  private formatarLinhaCusto(custo: Custo): string {
    // Cria uma variavel local para esta operacao.
    const partes = [
      // Executa uma instrucao necessaria para este fluxo.
      `- ${custo.descricao || 'Custo'}`,
      // Executa uma instrucao necessaria para este fluxo.
      `${this.formatarValor(custo.valor)} ${custo.moeda || 'EUR'}`,
      // Atualiza ou consulta estado da pagina.
      this.formatarData(custo.data),
      // Executa uma instrucao necessaria para este fluxo.
      custo.viagemId ? `Viagem: ${custo.viagemId}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      custo.poiId ? 'POI' : ''
    ];

    // Devolve o resultado deste bloco.
    return partes.filter(Boolean).join(' | ');
  }

  // Define um membro interno desta classe.
  private obterCategoriaCusto(custo: Custo): string {
    // Devolve o resultado deste bloco.
    return custo.categoria?.trim() || 'Sem categoria';
  }

  // Define um membro interno desta classe.
  private obterDataFicheiro(): string {
    // Devolve o resultado deste bloco.
    return new Date().toISOString().slice(0, 10);
  }

  // Define um membro interno desta classe.
  private obterCorRgb(cor?: string, suave = false): [number, number, number] {
    // Cria uma variavel local para esta operacao.
    const cores: Record<string, [number, number, number]> = {
      // Define um campo ou opcao de configuracao.
      primary: [56, 128, 255],
      // Define um campo ou opcao de configuracao.
      secondary: [45, 211, 111],
      // Define um campo ou opcao de configuracao.
      tertiary: [255, 196, 9],
      // Define um campo ou opcao de configuracao.
      success: [45, 211, 111],
      // Define um campo ou opcao de configuracao.
      warning: [255, 196, 9],
      // Define um campo ou opcao de configuracao.
      danger: [255, 71, 85],
      // Define um campo ou opcao de configuracao.
      medium: [146, 148, 156],
      // Define um campo ou opcao de configuracao.
      light: [244, 245, 248]
    };

    // Cria uma variavel local para esta operacao.
    const rgb = cores[cor || 'primary'] || cores['primary'];
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!suave) {
      // Devolve o resultado deste bloco.
      return rgb;
    }

    // Devolve o resultado deste bloco.
    return [
      // Executa uma instrucao necessaria para este fluxo.
      Math.round((rgb[0] + 255 * 3) / 4),
      // Executa uma instrucao necessaria para este fluxo.
      Math.round((rgb[1] + 255 * 3) / 4),
      // Executa uma instrucao necessaria para este fluxo.
      Math.round((rgb[2] + 255 * 3) / 4)
    ];
  }

}
