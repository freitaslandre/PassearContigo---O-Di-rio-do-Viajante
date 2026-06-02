import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

interface PreparedPhoto {
  base64: string;
  extension: string;
}

export interface PhotoShareOptions {
  title: string;
  text?: string;
  dialogTitle?: string;
  fileNamePrefix?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PhotoShareService {
  async canShare(): Promise<boolean> {
    const result = await Share.canShare();
    return result.value;
  }

  async sharePhoto(photoUrl: string, options: PhotoShareOptions): Promise<void> {
    const photo = await this.preparePhoto(photoUrl);
    const fileName = `${this.sanitizeFileName(options.fileNamePrefix || options.title)}-${Date.now()}.${photo.extension}`;

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: photo.base64,
      directory: Directory.Cache
    });

    await Share.share({
      title: options.title,
      text: options.text,
      files: [savedFile.uri],
      dialogTitle: options.dialogTitle || 'Partilhar foto'
    });
  }

  private async preparePhoto(photoUrl: string): Promise<PreparedPhoto> {
    if (photoUrl.startsWith('data:image')) {
      return this.prepareDataUrl(photoUrl);
    }

    let response: Response;
    try {
      response = await fetch(photoUrl);
    } catch (error) {
      if (photoUrl.startsWith('blob:')) {
        throw new Error('Esta foto temporária já não está disponível. Importe-a novamente para a poder partilhar.');
      }

      throw error;
    }

    if (!response.ok) {
      throw new Error('Nao foi possivel carregar a foto para partilha.');
    }

    const blob = await response.blob();
    const dataUrl = await this.blobToDataUrl(blob);
    const prepared = this.prepareDataUrl(dataUrl);

    return {
      ...prepared,
      extension: this.extensionFromMime(blob.type) || prepared.extension
    };
  }

  private prepareDataUrl(dataUrl: string): PreparedPhoto {
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      throw new Error('Formato de foto invalido para partilha.');
    }

    return {
      base64: match[2],
      extension: this.extensionFromMime(match[1]) || 'jpg'
    };
  }

  private blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Nao foi possivel preparar a foto para partilha.'));
      reader.readAsDataURL(blob);
    });
  }

  private extensionFromMime(mime?: string): string {
    const normalized = (mime || '').toLowerCase();

    if (normalized.includes('png')) return 'png';
    if (normalized.includes('webp')) return 'webp';
    if (normalized.includes('gif')) return 'gif';
    if (normalized.includes('heic')) return 'heic';
    if (normalized.includes('heif')) return 'heif';

    return 'jpg';
  }

  private sanitizeFileName(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40)
      || 'foto';
  }
}
