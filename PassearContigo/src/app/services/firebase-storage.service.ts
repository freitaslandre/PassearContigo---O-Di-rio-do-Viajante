import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  private readonly photoUploadTimeoutMs = 8000;
  private readonly fallbackMaxLength = 700_000;

  async uploadViagemCover(viagemId: string, dataUrl: string, options: { optimize?: boolean } = {}): Promise<string> {
    const uid = getAuth().currentUser?.uid;

    if (!uid) {
      throw new Error('É necessário iniciar sessão para guardar fotos.');
    }

    const compressedDataUrl = options.optimize === false
      ? dataUrl
      : await this.optimizeImage(dataUrl, 1280, 0.72);
    const blob = await this.dataUrlToBlob(compressedDataUrl);

    const storage = getStorage();
    const timestamp = Date.now();
    const path = `users/${uid}/viagens/${viagemId}/capa/${timestamp}.jpg`;
    const photoRef = ref(storage, path);

    try {
      await this.withTimeout(
        uploadBytes(photoRef, blob, { contentType: 'image/jpeg' }),
        this.photoUploadTimeoutMs,
        'Não foi possível guardar a capa no Storage agora.'
      );
      return getDownloadURL(photoRef);
    } catch (error) {
      console.warn('Upload da capa falhou; a usar foto local comprimida.', error);
      return this.criarFallbackDataUrl(compressedDataUrl);
    }
  }

  async uploadPoiPhoto(viagemId: string, diaId: string, poiId: string, dataUrl: string): Promise<string> {
    const uid = getAuth().currentUser?.uid;

    if (!uid) {
      throw new Error('É necessário iniciar sessão para guardar fotos.');
    }

    const compressedDataUrl = await this.optimizeImage(dataUrl, 720, 0.55);
    const blob = await this.dataUrlToBlob(compressedDataUrl);

    const storage = getStorage();
    const timestamp = Date.now();
    const path = `users/${uid}/viagens/${viagemId}/dias/${diaId}/pois/${poiId}/${timestamp}.jpg`;
    const photoRef = ref(storage, path);

    try {
      await this.withTimeout(
        uploadBytes(photoRef, blob, { contentType: 'image/jpeg' }),
        this.photoUploadTimeoutMs,
        'Não foi possível guardar a foto do POI agora.'
      );
      return getDownloadURL(photoRef);
    } catch (error) {
      console.warn('Upload da foto do POI falhou; a usar foto local comprimida.', error);
      return this.criarFallbackDataUrl(compressedDataUrl);
    }
  }

  async optimizeImage(dataUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        const maiorDimensao = Math.max(width, height);

        if (maiorDimensao > maxWidth) {
          const ratio = maxWidth / maiorDimensao;
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  }

  private dataUrlToBlob(dataUrl: string): Promise<Blob> {
    return new Promise((resolve) => {
      const arr = dataUrl.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      const bstr = atob(arr[1]);
      const n = bstr.length;
      const u8arr = new Uint8Array(n);

      for (let i = 0; i < n; i++) {
        u8arr[i] = bstr.charCodeAt(i);
      }

      resolve(new Blob([u8arr], { type: mime }));
    });
  }

  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout>;

    const timeout = new Promise<T>((_, reject) => {
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  }

  private async criarFallbackDataUrl(dataUrl: string): Promise<string> {
    let fallback = dataUrl;

    if (fallback.length > this.fallbackMaxLength) {
      fallback = await this.optimizeImage(fallback, 640, 0.48);
    }

    if (fallback.length > this.fallbackMaxLength) {
      throw new Error('A foto é demasiado pesada para guardar offline. Escolha uma foto mais leve.');
    }

    return fallback;
  }
}
