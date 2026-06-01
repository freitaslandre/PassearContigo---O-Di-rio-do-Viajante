import { Injectable } from '@angular/core';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, getStorage, ref, uploadString } from 'firebase/storage';

@Injectable({
  providedIn: 'root'
})
export class FirebaseStorageService {
  async uploadPoiPhoto(viagemId: string, diaId: string, poiId: string, dataUrl: string): Promise<string> {
    const uid = getAuth().currentUser?.uid;

    if (!uid) {
      throw new Error('E necessario iniciar sessao para guardar fotos.');
    }

    const storage = getStorage();
    const timestamp = Date.now();
    const path = `users/${uid}/viagens/${viagemId}/dias/${diaId}/pois/${poiId}/${timestamp}.jpg`;
    const photoRef = ref(storage, path);

    await uploadString(photoRef, dataUrl, 'data_url');
    return getDownloadURL(photoRef);
  }
}
