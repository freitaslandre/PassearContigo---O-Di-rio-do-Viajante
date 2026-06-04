// app/services/pdf-document.base.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { jsPDF } from 'jspdf';

/** Estilo de letra usado nas linhas geradas pelos relatórios PDF. */
export type PdfFontStyle = 'normal' | 'bold';

/** Cor RGB usada pelo jsPDF. */
export type PdfRgbColor = [number, number, number];

/** Base comum para serviços que constroem PDFs paginados em A4. */
export abstract class PdfDocumentBase {
  /** Documento PDF activo durante a geração. */
  protected doc!: jsPDF;
  /** Posição vertical actual no documento. */
  protected y = 0;
  /** Margem horizontal comum aos relatórios. */
  protected readonly marginX = 16;
  /** Largura da página A4 em milímetros. */
  protected readonly pageWidth = 210;
  /** Altura da página A4 em milímetros. */
  protected readonly pageHeight = 297;
  /** Largura útil para texto e blocos. */
  protected readonly contentWidth = this.pageWidth - this.marginX * 2;
  /** Margem inferior usada para criar nova página antes de sobrepor o rodapé. */
  protected readonly bottomMargin = 18;

  /** Cria um novo documento A4 e reinicia a posição de escrita. */
  protected iniciarDocumento(): void {
    // Atualiza ou consulta estado da pagina.
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    // Atualiza ou consulta estado da pagina.
    this.y = 18;
  }

  /** Escreve um título de secção com a cor e espaçamento padrão. */
  protected escreverTituloSecao(texto: string): void {
    // Atualiza ou consulta estado da pagina.
    this.garantirEspaco(10);
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(28, 105, 112);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(13);
    // Atualiza ou consulta estado da pagina.
    this.doc.text(texto, this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.y += 7;
  }

  /** Escreve texto corrido, quebrando linhas de acordo com a largura útil. */
  protected escreverTexto(
    // Define um campo ou opcao de configuracao.
    texto: string,
    // Atribui um valor a esta propriedade.
    fontSize = 10,
    // Define um campo ou opcao de configuracao.
    fontStyle: PdfFontStyle = 'normal',
    // Define um campo ou opcao de configuracao.
    color: PdfRgbColor = [45, 45, 45]
  // Executa uma instrucao necessaria para este fluxo.
  ): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!texto) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', fontStyle);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(fontSize);
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(...color);

    // Cria uma variavel local para esta operacao.
    const linhas = this.doc.splitTextToSize(texto, this.contentWidth);
    // Executa uma instrucao necessaria para este fluxo.
    linhas.forEach((linha: string) => {
      // Atualiza ou consulta estado da pagina.
      this.garantirEspaco(fontSize * 0.42 + 2);
      // Atualiza ou consulta estado da pagina.
      this.doc.text(linha, this.marginX, this.y);
      // Atualiza ou consulta estado da pagina.
      this.y += fontSize * 0.42 + 1.5;
    });
  }

  /** Adiciona rodapés numerados a todas as páginas do documento. */
  protected adicionarRodapes(prefixo: string): void {
    // Cria uma variavel local para esta operacao.
    const totalPaginas = this.doc.getNumberOfPages();

    // Define um metodo chamado pela pagina ou por outros metodos.
    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      // Atualiza ou consulta estado da pagina.
      this.doc.setPage(pagina);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'normal');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFontSize(8);
      // Atualiza ou consulta estado da pagina.
      this.doc.setTextColor(130, 130, 130);
      // Atualiza ou consulta estado da pagina.
      this.doc.text(`${prefixo} | Pagina ${pagina}/${totalPaginas}`, this.marginX, 287);
    }
  }

  /** Garante que há espaço disponível ou cria uma nova página. */
  protected garantirEspaco(altura: number): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.y + altura > this.pageHeight - this.bottomMargin) {
      // Atualiza ou consulta estado da pagina.
      this.novaPagina();
    }
  }

  /** Cria uma nova página e repõe o cursor vertical. */
  protected novaPagina(): void {
    // Atualiza ou consulta estado da pagina.
    this.doc.addPage();
    // Atualiza ou consulta estado da pagina.
    this.y = 18;
  }

  /** Adiciona espaço vertical entre blocos. */
  protected adicionarEspaco(altura: number): void {
    // Atualiza ou consulta estado da pagina.
    this.y += altura;
  }

  /** Formata datas vindas de Date, string ou Timestamp do Firestore. */
  protected formatarData(data: Date | string | any, fallback = ''): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('pt-PT');
  }

  /** Converte valores de data conhecidos para Date. */
  protected converterParaDate(data: Date | string | any): Date {
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

  /** Formata um valor monetário com vírgula decimal. */
  protected formatarValor(valor: number): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (Number(valor) || 0).toFixed(2).replace('.', ',');
  }

  /** Sanitiza nomes de ficheiro mantendo apenas caracteres seguros. */
  protected sanitizarNomeFicheiro(nome: string, fallback: string, limite = 60): string {
    // Devolve o resultado deste bloco.
    return nome
      // Executa uma instrucao necessaria para este fluxo.
      .normalize('NFD')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/[\u0300-\u036f]/g, '')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/^-+|-+$/g, '')
      // Executa uma instrucao necessaria para este fluxo.
      .slice(0, limite)
      // Executa uma instrucao necessaria para este fluxo.
      || fallback;
  }

  /** Devolve o PDF actual em base64 puro. */
  protected obterBase64Pdf(): string {
    // Devolve o resultado deste bloco.
    return this.doc.output('datauristring').split(',')[1];
  }
}
