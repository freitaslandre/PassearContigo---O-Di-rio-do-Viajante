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
    this.doc = new jsPDF({ unit: 'mm', format: 'a4' });
    this.y = 18;
  }

  /** Escreve um título de secção com a cor e espaçamento padrão. */
  protected escreverTituloSecao(texto: string): void {
    this.garantirEspaco(10);
    this.doc.setTextColor(28, 105, 112);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(13);
    this.doc.text(texto, this.marginX, this.y);
    this.y += 7;
  }

  /** Escreve texto corrido, quebrando linhas de acordo com a largura útil. */
  protected escreverTexto(
    texto: string,
    fontSize = 10,
    fontStyle: PdfFontStyle = 'normal',
    color: PdfRgbColor = [45, 45, 45]
  ): void {
    if (!texto) {
      return;
    }

    this.doc.setFont('helvetica', fontStyle);
    this.doc.setFontSize(fontSize);
    this.doc.setTextColor(...color);

    const linhas = this.doc.splitTextToSize(texto, this.contentWidth);
    linhas.forEach((linha: string) => {
      this.garantirEspaco(fontSize * 0.42 + 2);
      this.doc.text(linha, this.marginX, this.y);
      this.y += fontSize * 0.42 + 1.5;
    });
  }

  /** Adiciona rodapés numerados a todas as páginas do documento. */
  protected adicionarRodapes(prefixo: string): void {
    const totalPaginas = this.doc.getNumberOfPages();

    for (let pagina = 1; pagina <= totalPaginas; pagina += 1) {
      this.doc.setPage(pagina);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
      this.doc.setTextColor(130, 130, 130);
      this.doc.text(`${prefixo} | Pagina ${pagina}/${totalPaginas}`, this.marginX, 287);
    }
  }

  /** Garante que há espaço disponível ou cria uma nova página. */
  protected garantirEspaco(altura: number): void {
    if (this.y + altura > this.pageHeight - this.bottomMargin) {
      this.novaPagina();
    }
  }

  /** Cria uma nova página e repõe o cursor vertical. */
  protected novaPagina(): void {
    this.doc.addPage();
    this.y = 18;
  }

  /** Adiciona espaço vertical entre blocos. */
  protected adicionarEspaco(altura: number): void {
    this.y += altura;
  }

  /** Formata datas vindas de Date, string ou Timestamp do Firestore. */
  protected formatarData(data: Date | string | any, fallback = ''): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? fallback : date.toLocaleDateString('pt-PT');
  }

  /** Converte valores de data conhecidos para Date. */
  protected converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return data.toDate();
    }

    return new Date(data);
  }

  /** Formata um valor monetário com vírgula decimal. */
  protected formatarValor(valor: number): string {
    return (Number(valor) || 0).toFixed(2).replace('.', ',');
  }

  /** Sanitiza nomes de ficheiro mantendo apenas caracteres seguros. */
  protected sanitizarNomeFicheiro(nome: string, fallback: string, limite = 60): string {
    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, limite)
      || fallback;
  }

  /** Devolve o PDF actual em base64 puro. */
  protected obterBase64Pdf(): string {
    return this.doc.output('datauristring').split(',')[1];
  }
}
