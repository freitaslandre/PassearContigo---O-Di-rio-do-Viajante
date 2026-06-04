// app/services/album-pdf.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { PdfDocumentBase } from './pdf-document.base';
// Importa dependencias usadas neste ficheiro.
import { PdfGerado } from './pdf-share.service';
// Importa dependencias usadas neste ficheiro.
import { Viagem } from '../models/viagem.model';

// Contrato de dados usado para tipar objetos desta area.
export interface FotoAlbumPdf {
  // Define um campo ou opcao de configuracao.
  url: string;
  // Executa uma instrucao necessaria para este fluxo.
  titulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  legenda?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiNome?: string;
  // Executa uma instrucao necessaria para este fluxo.
  subtitulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  dataCaptura?: Date | string;
  // Executa uma instrucao necessaria para este fluxo.
  origemLabel?: string;
}

// Contrato de dados usado para tipar objetos desta area.
export interface AlbumPdfData {
  // Define um campo ou opcao de configuracao.
  viagem: Viagem;
  // Define um campo ou opcao de configuracao.
  fotos: FotoAlbumPdf[];
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AlbumPdfService extends PdfDocumentBase {
  // Define um metodo chamado pela pagina ou por outros metodos.
  async gerarAlbumDownload({ viagem, fotos }: AlbumPdfData): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const pdf = await this.criarAlbumPdf({ viagem, fotos });
    // Atualiza ou consulta estado da pagina.
    this.doc.save(pdf.fileName);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async criarAlbumPdf({ viagem, fotos }: AlbumPdfData): Promise<PdfGerado> {
    // Atualiza ou consulta estado da pagina.
    this.iniciarDocumento();

    // Cria uma variavel local para esta operacao.
    const tituloViagem = viagem.titulo?.trim() || 'Álbum de viagem';
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(18);
    // Atualiza ou consulta estado da pagina.
    this.doc.text(tituloViagem, this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.y += 8;

    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'normal');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(11);
    // Cria uma variavel local para esta operacao.
    const periodo = `${this.formatarData(viagem.dataInicio, '')} - ${this.formatarData(viagem.dataFim, '')}`.trim();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (periodo && !periodo.startsWith(' - ')) {
      // Atualiza ou consulta estado da pagina.
      this.doc.text(periodo, this.marginX, this.y);
      // Atualiza ou consulta estado da pagina.
      this.y += 6;
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.local) {
      // Atualiza ou consulta estado da pagina.
      this.doc.text(`Local: ${viagem.local}`, this.marginX, this.y);
      // Atualiza ou consulta estado da pagina.
      this.y += 6;
    }

    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(4);
    // Atualiza ou consulta estado da pagina.
    this.doc.setDrawColor(180, 180, 180);
    // Atualiza ou consulta estado da pagina.
    this.doc.setLineWidth(0.35);
    // Atualiza ou consulta estado da pagina.
    this.doc.line(this.marginX, this.y, this.pageWidth - this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(6);

    // Define um metodo chamado pela pagina ou por outros metodos.
    for (let index = 0; index < fotos.length; index += 1) {
      // Cria uma variavel local para esta operacao.
      const foto = fotos[index];
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao(`${index + 1}. ${foto.titulo || 'Foto'}`);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'normal');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFontSize(10);

      // Cria uma variavel local para esta operacao.
      const metadados = [
        // Executa uma instrucao necessaria para este fluxo.
        `Origem: ${foto.origemLabel || 'Álbum'}`,
        // Executa uma instrucao necessaria para este fluxo.
        `POI: ${foto.poiNome || 'Sem POI'}`,
        // Executa uma instrucao necessaria para este fluxo.
        `Data: ${this.formatarData(foto.dataCaptura, 'Sem data')}`
      ];

      // Executa uma instrucao necessaria para este fluxo.
      metadados.forEach(item => {
        // Atualiza ou consulta estado da pagina.
        this.garantirEspaco(5);
        // Atualiza ou consulta estado da pagina.
        this.doc.text(item, this.marginX, this.y);
        // Atualiza ou consulta estado da pagina.
        this.y += 5;
      });

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (foto.legenda) {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`Legenda: ${foto.legenda}`, 10);
      }

      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(2);

      // Inicia um bloco protegido contra erros.
      try {
        // Cria uma variavel local para esta operacao.
        const dataUrl = await this.obterDataUrlFoto(foto.url);
        // Cria uma variavel local para esta operacao.
        const imgSize = await this.obterTamanhoImagem(dataUrl);
        // Cria uma variavel local para esta operacao.
        const dimensions = this.dimensionarImagem(imgSize.width, imgSize.height);

        // Atualiza ou consulta estado da pagina.
        this.garantirEspaco(dimensions.height + 4);
        // Atualiza ou consulta estado da pagina.
        this.doc.addImage(dataUrl, this.obterTipoImagem(dataUrl), this.marginX, this.y, dimensions.width, dimensions.height);
        // Atualiza ou consulta estado da pagina.
        this.y += dimensions.height + 6;
      // Executa uma instrucao necessaria para este fluxo.
      } catch (error) {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto('Não foi possível carregar a imagem.', 10, 'normal', [150, 0, 0]);
        // Atualiza ou consulta estado da pagina.
        this.adicionarEspaco(6);
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (index < fotos.length - 1) {
        // Atualiza ou consulta estado da pagina.
        this.doc.setDrawColor(220, 220, 220);
        // Atualiza ou consulta estado da pagina.
        this.doc.setLineWidth(0.25);
        // Atualiza ou consulta estado da pagina.
        this.doc.line(this.marginX, this.y, this.pageWidth - this.marginX, this.y);
        // Atualiza ou consulta estado da pagina.
        this.adicionarEspaco(6);
      }
    }

    // Atualiza ou consulta estado da pagina.
    this.adicionarRodapes('Álbum de Fotos');

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      fileName: `${this.sanitizarNomeFicheiro(viagem.titulo || 'album-de-fotos', 'album-de-fotos')}.pdf`,
      // Define um campo ou opcao de configuracao.
      base64: this.obterBase64Pdf()
    };
  }

  // Define um membro interno desta classe.
  private async obterDataUrlFoto(url: string): Promise<string> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (url.startsWith('data:image')) {
      // Devolve o resultado deste bloco.
      return url;
    }

    // Cria uma variavel local para esta operacao.
    const response = await fetch(url);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!response.ok) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não foi possível carregar a foto para o PDF.');
    }

    // Cria uma variavel local para esta operacao.
    const blob = await response.blob();
    // Devolve o resultado deste bloco.
    return this.blobToDataUrl(blob);
  }

  // Define um membro interno desta classe.
  private blobToDataUrl(blob: Blob): Promise<string> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve, reject) => {
      // Cria uma variavel local para esta operacao.
      const reader = new FileReader();
      // Executa uma instrucao necessaria para este fluxo.
      reader.onload = () => resolve(String(reader.result || ''));
      // Executa uma instrucao necessaria para este fluxo.
      reader.onerror = () => reject(new Error('Não foi possível preparar a imagem para o PDF.'));
      // Executa uma instrucao necessaria para este fluxo.
      reader.readAsDataURL(blob);
    });
  }

  // Define um membro interno desta classe.
  private async obterTamanhoImagem(dataUrl: string): Promise<{ width: number; height: number }> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve, reject) => {
      // Cria uma variavel local para esta operacao.
      const image = new Image();
      // Executa uma instrucao necessaria para este fluxo.
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      // Executa uma instrucao necessaria para este fluxo.
      image.onerror = () => reject(new Error('Não foi possível ler as dimensões da imagem.'));
      // Executa uma instrucao necessaria para este fluxo.
      image.src = dataUrl;
    });
  }

  // Define um membro interno desta classe.
  private obterTipoImagem(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' | 'GIF' {
    // Cria uma variavel local para esta operacao.
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    // Cria uma variavel local para esta operacao.
    const mime = match?.[1]?.toLowerCase() || 'image/jpeg';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (mime.includes('png')) {
      // Devolve o resultado deste bloco.
      return 'PNG';
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (mime.includes('webp')) {
      // Devolve o resultado deste bloco.
      return 'WEBP';
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (mime.includes('gif')) {
      // Devolve o resultado deste bloco.
      return 'GIF';
    }
    // Devolve o resultado deste bloco.
    return 'JPEG';
  }

  // Define um membro interno desta classe.
  private dimensionarImagem(originalWidth: number, originalHeight: number): { width: number; height: number } {
    // Cria uma variavel local para esta operacao.
    const maxWidth = this.contentWidth;
    // Cria uma variavel local para esta operacao.
    const maxHeight = 90;
    // Cria uma variavel local para esta operacao.
    let width = maxWidth;
    // Cria uma variavel local para esta operacao.
    let height = (originalHeight / originalWidth) * width;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (height > maxHeight) {
      // Atribui um valor a esta propriedade.
      height = maxHeight;
      // Atribui um valor a esta propriedade.
      width = (originalWidth / originalHeight) * height;
    }

    // Devolve o resultado deste bloco.
    return { width, height };
  }
}
