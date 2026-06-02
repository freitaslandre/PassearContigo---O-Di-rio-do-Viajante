import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface PdfGerado {
  fileName: string;
  base64: string;
}

export interface PdfShareOptions {
  title: string;
  text?: string;
  dialogTitle?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PdfShareService {
  async canShare(): Promise<boolean> {
    const result = await Share.canShare();
    return result.value;
  }

  async sharePdf(pdf: PdfGerado, options: PdfShareOptions): Promise<void> {
    const savedFile = await Filesystem.writeFile({
      path: this.sanitizeFileName(pdf.fileName),
      data: pdf.base64,
      directory: Directory.Cache
    });

    await Share.share({
      title: options.title,
      text: options.text,
      files: [savedFile.uri],
      dialogTitle: options.dialogTitle || 'Partilhar PDF'
    });
  }

  private sanitizeFileName(fileName: string): string {
    const normalized = fileName.trim().replace(/[^a-zA-Z0-9_.-]+/g, '-');
    return normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized || 'documento'}.pdf`;
  }
}
