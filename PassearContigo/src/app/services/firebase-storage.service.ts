import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  async uploadPoiPhoto(viagemId: string, diaId: string, poiId: string, dataUrl: string): Promise<string> {
    const uid = getAuth().currentUser?.uid;

    if (!uid) {
      throw new Error('E necessario iniciar sessao para guardar fotos.');
    }

    const compressedDataUrl = await this.compressImage(dataUrl);
    const blob = await this.dataUrlToBlob(compressedDataUrl);

    const storage = getStorage();
    const timestamp = Date.now();
    const path = `users/${uid}/viagens/${viagemId}/dias/${diaId}/pois/${poiId}/${timestamp}.jpg`;
    const photoRef = ref(storage, path);

    await uploadBytes(photoRef, blob, { contentType: 'image/jpeg' });
    return getDownloadURL(photoRef);
  }

  private async compressImage(dataUrl: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > 1024) {
          height = (height * 1024) / width;
          width = 1024;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
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
}

