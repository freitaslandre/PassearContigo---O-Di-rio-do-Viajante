// app/services/firebase-storage.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { getAuth } from 'firebase/auth';
// Importa dependencias usadas neste ficheiro.
import { getDownloadURL, getStorage, ref, uploadBytes } from 'firebase/storage';

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class FirebaseStorageService {
  // Define um membro interno desta classe.
  private readonly photoUploadTimeoutMs = 8000;
  // Define um membro interno desta classe.
  private readonly fallbackMaxLength = 700_000;

  // Define um metodo chamado pela pagina ou por outros metodos.
  async uploadViagemCover(viagemId: string, dataUrl: string, options: { optimize?: boolean } = {}): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const uid = getAuth().currentUser?.uid;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!uid) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para guardar fotos.');
    }

    // Cria uma variavel local para esta operacao.
    const compressedDataUrl = options.optimize === false
      // Executa uma instrucao necessaria para este fluxo.
      ? dataUrl
      // Executa uma instrucao necessaria para este fluxo.
      : await this.optimizeImage(dataUrl, 1280, 0.72);
    // Cria uma variavel local para esta operacao.
    const blob = await this.dataUrlToBlob(compressedDataUrl);

    // Cria uma variavel local para esta operacao.
    const storage = getStorage();
    // Cria uma variavel local para esta operacao.
    const timestamp = Date.now();
    // Cria uma variavel local para esta operacao.
    const path = `users/${uid}/viagens/${viagemId}/capa/${timestamp}.jpg`;
    // Cria uma variavel local para esta operacao.
    const photoRef = ref(storage, path);

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.withTimeout(
        // Define um metodo chamado pela pagina ou por outros metodos.
        uploadBytes(photoRef, blob, { contentType: 'image/jpeg' }),
        // Atualiza ou consulta estado da pagina.
        this.photoUploadTimeoutMs,
        // Executa uma instrucao necessaria para este fluxo.
        'Não foi possível guardar a capa no Storage agora.'
      );
      // Devolve o resultado deste bloco.
      return getDownloadURL(photoRef);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Upload da capa falhou; a usar foto local comprimida.', error);
      // Devolve o resultado deste bloco.
      return this.criarFallbackDataUrl(compressedDataUrl);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async uploadPoiPhoto(viagemId: string, diaId: string, poiId: string, dataUrl: string): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const uid = getAuth().currentUser?.uid;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!uid) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para guardar fotos.');
    }

    // Cria uma variavel local para esta operacao.
    const compressedDataUrl = await this.optimizeImage(dataUrl, 720, 0.55);
    // Cria uma variavel local para esta operacao.
    const blob = await this.dataUrlToBlob(compressedDataUrl);

    // Cria uma variavel local para esta operacao.
    const storage = getStorage();
    // Cria uma variavel local para esta operacao.
    const timestamp = Date.now();
    // Cria uma variavel local para esta operacao.
    const path = `users/${uid}/viagens/${viagemId}/dias/${diaId}/pois/${poiId}/${timestamp}.jpg`;
    // Cria uma variavel local para esta operacao.
    const photoRef = ref(storage, path);

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.withTimeout(
        // Define um metodo chamado pela pagina ou por outros metodos.
        uploadBytes(photoRef, blob, { contentType: 'image/jpeg' }),
        // Atualiza ou consulta estado da pagina.
        this.photoUploadTimeoutMs,
        // Executa uma instrucao necessaria para este fluxo.
        'Não foi possível guardar a foto do POI agora.'
      );
      // Devolve o resultado deste bloco.
      return getDownloadURL(photoRef);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Upload da foto do POI falhou; a usar foto local comprimida.', error);
      // Devolve o resultado deste bloco.
      return this.criarFallbackDataUrl(compressedDataUrl);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async optimizeImage(dataUrl: string, maxWidth = 1024, quality = 0.7): Promise<string> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Cria uma variavel local para esta operacao.
      const img = new Image();
      // Executa uma instrucao necessaria para este fluxo.
      img.onload = () => {
        // Cria uma variavel local para esta operacao.
        const canvas = document.createElement('canvas');
        // Cria uma variavel local para esta operacao.
        let width = img.width;
        // Cria uma variavel local para esta operacao.
        let height = img.height;

        // Cria uma variavel local para esta operacao.
        const maiorDimensao = Math.max(width, height);

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (maiorDimensao > maxWidth) {
          // Cria uma variavel local para esta operacao.
          const ratio = maxWidth / maiorDimensao;
          // Atribui um valor a esta propriedade.
          width = Math.round(width * ratio);
          // Atribui um valor a esta propriedade.
          height = Math.round(height * ratio);
        }

        // Executa uma instrucao necessaria para este fluxo.
        canvas.width = width;
        // Executa uma instrucao necessaria para este fluxo.
        canvas.height = height;
        // Cria uma variavel local para esta operacao.
        const ctx = canvas.getContext('2d');
        // Executa uma instrucao necessaria para este fluxo.
        ctx?.drawImage(img, 0, 0, width, height);

        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      // Executa uma instrucao necessaria para este fluxo.
      img.onerror = () => resolve(dataUrl);
      // Executa uma instrucao necessaria para este fluxo.
      img.src = dataUrl;
    });
  }

  // Define um membro interno desta classe.
  private dataUrlToBlob(dataUrl: string): Promise<Blob> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Cria uma variavel local para esta operacao.
      const arr = dataUrl.split(',');
      // Cria uma variavel local para esta operacao.
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
      // Cria uma variavel local para esta operacao.
      const bstr = atob(arr[1]);
      // Cria uma variavel local para esta operacao.
      const n = bstr.length;
      // Cria uma variavel local para esta operacao.
      const u8arr = new Uint8Array(n);

      // Define um metodo chamado pela pagina ou por outros metodos.
      for (let i = 0; i < n; i++) {
        // Executa uma instrucao necessaria para este fluxo.
        u8arr[i] = bstr.charCodeAt(i);
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      resolve(new Blob([u8arr], { type: mime }));
    });
  }

  // Define um membro interno desta classe.
  private withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
    // Cria uma variavel local para esta operacao.
    let timeoutId: ReturnType<typeof setTimeout>;

    // Cria uma variavel local para esta operacao.
    const timeout = new Promise<T>((_, reject) => {
      // Atribui um valor a esta propriedade.
      timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    });

    // Devolve o resultado deste bloco.
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  }

  // Define um membro interno desta classe.
  private async criarFallbackDataUrl(dataUrl: string): Promise<string> {
    // Cria uma variavel local para esta operacao.
    let fallback = dataUrl;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (fallback.length > this.fallbackMaxLength) {
      // Atribui um valor a esta propriedade.
      fallback = await this.optimizeImage(fallback, 640, 0.48);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (fallback.length > this.fallbackMaxLength) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('A foto é demasiado pesada para guardar offline. Escolha uma foto mais leve.');
    }

    // Devolve o resultado deste bloco.
    return fallback;
  }
}
