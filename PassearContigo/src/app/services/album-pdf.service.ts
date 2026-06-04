import { Injectable } from '@angular/core';
import { PdfDocumentBase } from './pdf-document.base';
import { PdfGerado } from './pdf-share.service';
import { Viagem } from '../models/viagem.model';

export interface FotoAlbumPdf {
  url: string;
  titulo?: string;
  legenda?: string;
  poiNome?: string;
  subtitulo?: string;
  dataCaptura?: Date | string;
  origemLabel?: string;
}

export interface AlbumPdfData {
  viagem: Viagem;
  fotos: FotoAlbumPdf[];
}

@Injectable({
  providedIn: 'root'
})
export class AlbumPdfService extends PdfDocumentBase {
  async gerarAlbumDownload({ viagem, fotos }: AlbumPdfData): Promise<void> {
    const pdf = await this.criarAlbumPdf({ viagem, fotos });
    this.doc.save(pdf.fileName);
  }

  async criarAlbumPdf({ viagem, fotos }: AlbumPdfData): Promise<PdfGerado> {
    this.iniciarDocumento();

    const tituloViagem = viagem.titulo?.trim() || 'Álbum de viagem';
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.text(tituloViagem, this.marginX, this.y);
    this.y += 8;

    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(11);
    const periodo = `${this.formatarData(viagem.dataInicio, '')} - ${this.formatarData(viagem.dataFim, '')}`.trim();
    if (periodo && !periodo.startsWith(' - ')) {
      this.doc.text(periodo, this.marginX, this.y);
      this.y += 6;
    }
    if (viagem.local) {
      this.doc.text(`Local: ${viagem.local}`, this.marginX, this.y);
      this.y += 6;
    }

    this.adicionarEspaco(4);
    this.doc.setDrawColor(180, 180, 180);
    this.doc.setLineWidth(0.35);
    this.doc.line(this.marginX, this.y, this.pageWidth - this.marginX, this.y);
    this.adicionarEspaco(6);

    for (let index = 0; index < fotos.length; index += 1) {
      const foto = fotos[index];
      this.escreverTituloSecao(`${index + 1}. ${foto.titulo || 'Foto'}`);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(10);

      const metadados = [
        `Origem: ${foto.origemLabel || 'Álbum'}`,
        `POI: ${foto.poiNome || 'Sem POI'}`,
        `Data: ${this.formatarData(foto.dataCaptura, 'Sem data')}`
      ];

      metadados.forEach(item => {
        this.garantirEspaco(5);
        this.doc.text(item, this.marginX, this.y);
        this.y += 5;
      });

      if (foto.legenda) {
        this.escreverTexto(`Legenda: ${foto.legenda}`, 10);
      }

      this.adicionarEspaco(2);

      try {
        const dataUrl = await this.obterDataUrlFoto(foto.url);
        const imgSize = await this.obterTamanhoImagem(dataUrl);
        const dimensions = this.dimensionarImagem(imgSize.width, imgSize.height);

        this.garantirEspaco(dimensions.height + 4);
        this.doc.addImage(dataUrl, this.obterTipoImagem(dataUrl), this.marginX, this.y, dimensions.width, dimensions.height);
        this.y += dimensions.height + 6;
      } catch (error) {
        this.escreverTexto('Não foi possível carregar a imagem.', 10, 'normal', [150, 0, 0]);
        this.adicionarEspaco(6);
      }

      if (index < fotos.length - 1) {
        this.doc.setDrawColor(220, 220, 220);
        this.doc.setLineWidth(0.25);
        this.doc.line(this.marginX, this.y, this.pageWidth - this.marginX, this.y);
        this.adicionarEspaco(6);
      }
    }

    this.adicionarRodapes('Álbum de Fotos');

    return {
      fileName: `${this.sanitizarNomeFicheiro(viagem.titulo || 'album-de-fotos', 'album-de-fotos')}.pdf`,
      base64: this.obterBase64Pdf()
    };
  }

  private async obterDataUrlFoto(url: string): Promise<string> {
    if (url.startsWith('data:image')) {
      return url;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Não foi possível carregar a foto para o PDF.');
    }

    const blob = await response.blob();
    return this.blobToDataUrl(blob);
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Não foi possível preparar a imagem para o PDF.'));
      reader.readAsDataURL(blob);
    });
  }

  private async obterTamanhoImagem(dataUrl: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = () => reject(new Error('Não foi possível ler as dimensões da imagem.'));
      image.src = dataUrl;
    });
  }

  private obterTipoImagem(dataUrl: string): 'JPEG' | 'PNG' | 'WEBP' | 'GIF' {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,/);
    const mime = match?.[1]?.toLowerCase() || 'image/jpeg';

    if (mime.includes('png')) {
      return 'PNG';
    }
    if (mime.includes('webp')) {
      return 'WEBP';
    }
    if (mime.includes('gif')) {
      return 'GIF';
    }
    return 'JPEG';
  }

  private dimensionarImagem(originalWidth: number, originalHeight: number): { width: number; height: number } {
    const maxWidth = this.contentWidth;
    const maxHeight = 90;
    let width = maxWidth;
    let height = (originalHeight / originalWidth) * width;

    if (height > maxHeight) {
      height = maxHeight;
      width = (originalWidth / originalHeight) * height;
    }

    return { width, height };
  }
}
