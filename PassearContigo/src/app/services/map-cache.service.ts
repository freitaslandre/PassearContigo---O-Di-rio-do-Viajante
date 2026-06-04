// app/services/map-cache.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';

// Contrato de dados usado para tipar objetos desta area.
interface TileCacheEntry {
  // Define um campo ou opcao de configuracao.
  url: string;
  // Define um campo ou opcao de configuracao.
  data: Blob;
  // Define um campo ou opcao de configuracao.
  timestamp: number;
  // Define um campo ou opcao de configuracao.
  size: number;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class MapCacheService {
  // Define um membro interno desta classe.
  private readonly DB_NAME = 'PassearContigo_MapCache';
  // Define um membro interno desta classe.
  private readonly STORE_NAME = 'tiles';
  // Define um membro interno desta classe.
  private readonly QUOTA_MAX = 10 * 1024 * 1024; // 10MB
  // Define um membro interno desta classe.
  private db: IDBDatabase | null = null;
  // Define um membro interno desta classe.
  private useIndexedDB = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor() {
    // Atualiza ou consulta estado da pagina.
    this.inicializarDB();
  }

  // Define um membro interno desta classe.
  private inicializarDB(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!('indexedDB' in window)) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('IndexedDB não disponível, usando fallback.');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const request = indexedDB.open(this.DB_NAME, 1);

    // Executa uma instrucao necessaria para este fluxo.
    request.onerror = () => {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao abrir IndexedDB:', request.error);
    };

    // Executa uma instrucao necessaria para este fluxo.
    request.onsuccess = () => {
      // Atualiza ou consulta estado da pagina.
      this.db = request.result;
      // Atualiza ou consulta estado da pagina.
      this.useIndexedDB = true;
    };

    // Executa uma instrucao necessaria para este fluxo.
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      // Cria uma variavel local para esta operacao.
      const db = (event.target as IDBOpenDBRequest).result;
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        // Executa uma instrucao necessaria para este fluxo.
        db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
      }
    };
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async obterTile(url: string): Promise<Blob | null> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.useIndexedDB && this.db) {
      // Devolve o resultado deste bloco.
      return this.obterTileIndexedDB(url);
    }
    // Devolve o resultado deste bloco.
    return this.obterTileLocalStorage(url);
  }

  // Define um membro interno desta classe.
  private obterTileIndexedDB(url: string): Promise<Blob | null> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.db) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve(null);
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      // Cria uma variavel local para esta operacao.
      const store = transaction.objectStore(this.STORE_NAME);
      // Cria uma variavel local para esta operacao.
      const request = store.get(url);

      // Executa uma instrucao necessaria para este fluxo.
      request.onsuccess = () => {
        // Cria uma variavel local para esta operacao.
        const entry = request.result as TileCacheEntry | undefined;
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (entry) {
          // Define um metodo chamado pela pagina ou por outros metodos.
          resolve(entry.data);
        // Executa uma instrucao necessaria para este fluxo.
        } else {
          // Define um metodo chamado pela pagina ou por outros metodos.
          resolve(null);
        }
      };

      // Executa uma instrucao necessaria para este fluxo.
      request.onerror = () => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao obter tile do IndexedDB:', request.error);
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve(null);
      };
    });
  }

  // Define um membro interno desta classe.
  private obterTileLocalStorage(url: string): Blob | null {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const key = this.gerarKeyLocalStorage(url);
      // Cria uma variavel local para esta operacao.
      const item = localStorage.getItem(key);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (item) {
        // Cria uma variavel local para esta operacao.
        const entry = JSON.parse(item) as { data: string; timestamp: number };
        // Devolve o resultado deste bloco.
        return this.base64ToBlob(entry.data, 'image/png');
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao obter tile do localStorage:', error);
    }
    // Devolve o resultado deste bloco.
    return null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async cachearTile(url: string, blob: Blob): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.useIndexedDB && this.db) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.cachearTileIndexedDB(url, blob);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.cachearTileLocalStorage(url, blob);
    }
  }

  // Define um membro interno desta classe.
  private cachearTileIndexedDB(url: string, blob: Blob): Promise<void> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.db) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve();
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const entry: TileCacheEntry = {
        // Executa uma instrucao necessaria para este fluxo.
        url,
        // Define um campo ou opcao de configuracao.
        data: blob,
        // Define um campo ou opcao de configuracao.
        timestamp: Date.now(),
        // Define um campo ou opcao de configuracao.
        size: blob.size
      };

      // Cria uma variavel local para esta operacao.
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      // Cria uma variavel local para esta operacao.
      const store = transaction.objectStore(this.STORE_NAME);
      // Cria uma variavel local para esta operacao.
      const request = store.put(entry);

      // Executa uma instrucao necessaria para este fluxo.
      request.onsuccess = () => {
        // Atualiza ou consulta estado da pagina.
        this.limparCacheSeNecessario().then(() => resolve());
      };

      // Executa uma instrucao necessaria para este fluxo.
      request.onerror = () => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao cachear tile no IndexedDB:', request.error);
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve();
      };
    });
  }

  // Define um membro interno desta classe.
  private cachearTileLocalStorage(url: string, blob: Blob): void {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const reader = new FileReader();
      // Executa uma instrucao necessaria para este fluxo.
      reader.onload = () => {
        // Cria uma variavel local para esta operacao.
        const base64 = (reader.result as string).split(',')[1];
        // Cria uma variavel local para esta operacao.
        const key = this.gerarKeyLocalStorage(url);
        // Cria uma variavel local para esta operacao.
        const entry = {
          // Define um campo ou opcao de configuracao.
          data: base64,
          // Define um campo ou opcao de configuracao.
          timestamp: Date.now()
        };
        // Executa uma instrucao necessaria para este fluxo.
        localStorage.setItem(key, JSON.stringify(entry));
        // Atualiza ou consulta estado da pagina.
        this.limparCacheLocalStorageSeNecessario();
      };
      // Executa uma instrucao necessaria para este fluxo.
      reader.readAsDataURL(blob);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao cachear tile no localStorage:', error);
    }
  }

  // Define um membro interno desta classe.
  private async limparCacheSeNecessario(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.db) return;

    // Cria uma variavel local para esta operacao.
    const uso = await this.getUsoDisco();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (uso > this.QUOTA_MAX) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.removerTilesAntigos();
    }
  }

  // Define um membro interno desta classe.
  private limparCacheLocalStorageSeNecessario(): void {
    // Cria uma variavel local para esta operacao.
    let totalSize = 0;
    // Cria uma variavel local para esta operacao.
    const entries: Array<{ key: string; timestamp: number }> = [];

    // Define um metodo chamado pela pagina ou por outros metodos.
    for (let i = 0; i < localStorage.length; i++) {
      // Cria uma variavel local para esta operacao.
      const key = localStorage.key(i);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (key && key.startsWith('tile_cache_')) {
        // Cria uma variavel local para esta operacao.
        const item = localStorage.getItem(key);
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (item) {
          // Inicia um bloco protegido contra erros.
          try {
            // Cria uma variavel local para esta operacao.
            const entry = JSON.parse(item);
            // Executa uma instrucao necessaria para este fluxo.
            totalSize += item.length;
            // Executa uma instrucao necessaria para este fluxo.
            entries.push({ key, timestamp: entry.timestamp });
          // Executa uma instrucao necessaria para este fluxo.
          } catch (e) {
            // Executa uma instrucao necessaria para este fluxo.
            localStorage.removeItem(key);
          }
        }
      }
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (totalSize > this.QUOTA_MAX) {
      // Executa uma instrucao necessaria para este fluxo.
      entries.sort((a, b) => a.timestamp - b.timestamp);
      // Define um metodo chamado pela pagina ou por outros metodos.
      for (const entry of entries) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (totalSize <= this.QUOTA_MAX * 0.8) break;
        // Executa uma instrucao necessaria para este fluxo.
        totalSize -= (localStorage.getItem(entry.key) || '').length;
        // Executa uma instrucao necessaria para este fluxo.
        localStorage.removeItem(entry.key);
      }
    }
  }

  // Define um membro interno desta classe.
  private removerTilesAntigos(): Promise<void> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.db) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve();
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      // Cria uma variavel local para esta operacao.
      const store = transaction.objectStore(this.STORE_NAME);
      // Cria uma variavel local para esta operacao.
      const request = store.getAll();

      // Executa uma instrucao necessaria para este fluxo.
      request.onsuccess = () => {
        // Cria uma variavel local para esta operacao.
        const entries = (request.result as TileCacheEntry[]).sort(
          // Executa uma instrucao necessaria para este fluxo.
          (a, b) => a.timestamp - b.timestamp
        );

        // Cria uma variavel local para esta operacao.
        const txWrite = this.db!.transaction([this.STORE_NAME], 'readwrite');
        // Cria uma variavel local para esta operacao.
        const storeWrite = txWrite.objectStore(this.STORE_NAME);

        // Cria uma variavel local para esta operacao.
        let totalRemoved = 0;
        // Define um metodo chamado pela pagina ou por outros metodos.
        for (const entry of entries) {
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (totalRemoved > this.QUOTA_MAX * 0.2) break;
          // Executa uma instrucao necessaria para este fluxo.
          totalRemoved += entry.size;
          // Executa uma instrucao necessaria para este fluxo.
          storeWrite.delete(entry.url);
        }

        // Executa uma instrucao necessaria para este fluxo.
        txWrite.oncomplete = () => resolve();
      };

      // Executa uma instrucao necessaria para este fluxo.
      request.onerror = () => resolve();
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async getUsoDisco(): Promise<number> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.useIndexedDB && this.db) {
      // Devolve o resultado deste bloco.
      return this.getUsoDiscoIndexedDB();
    }
    // Devolve o resultado deste bloco.
    return this.getUsoDiscoLocalStorage();
  }

  // Define um membro interno desta classe.
  private getUsoDiscoIndexedDB(): Promise<number> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.db) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve(0);
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      // Cria uma variavel local para esta operacao.
      const store = transaction.objectStore(this.STORE_NAME);
      // Cria uma variavel local para esta operacao.
      const request = store.getAll();

      // Executa uma instrucao necessaria para este fluxo.
      request.onsuccess = () => {
        // Cria uma variavel local para esta operacao.
        const entries = request.result as TileCacheEntry[];
        // Cria uma variavel local para esta operacao.
        const total = entries.reduce((sum, entry) => sum + entry.size, 0);
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve(total);
      };

      // Executa uma instrucao necessaria para este fluxo.
      request.onerror = () => resolve(0);
    });
  }

  // Define um membro interno desta classe.
  private getUsoDiscoLocalStorage(): number {
    // Cria uma variavel local para esta operacao.
    let total = 0;
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (let i = 0; i < localStorage.length; i++) {
      // Cria uma variavel local para esta operacao.
      const key = localStorage.key(i);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (key && key.startsWith('tile_cache_')) {
        // Cria uma variavel local para esta operacao.
        const item = localStorage.getItem(key) || '';
        // Executa uma instrucao necessaria para este fluxo.
        total += item.length;
      }
    }
    // Devolve o resultado deste bloco.
    return total;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async limparCache(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.useIndexedDB && this.db) {
      // Devolve o resultado deste bloco.
      return this.limparCacheIndexedDB();
    }
    // Atualiza ou consulta estado da pagina.
    this.limparCacheLocalStorage();
  }

  // Define um membro interno desta classe.
  private limparCacheIndexedDB(): Promise<void> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.db) {
        // Define um metodo chamado pela pagina ou por outros metodos.
        resolve();
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      // Cria uma variavel local para esta operacao.
      const store = transaction.objectStore(this.STORE_NAME);
      // Cria uma variavel local para esta operacao.
      const request = store.clear();

      // Executa uma instrucao necessaria para este fluxo.
      request.onsuccess = () => resolve();
      // Executa uma instrucao necessaria para este fluxo.
      request.onerror = () => resolve();
    });
  }

  // Define um membro interno desta classe.
  private limparCacheLocalStorage(): void {
    // Cria uma variavel local para esta operacao.
    const keysToRemove: string[] = [];
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (let i = 0; i < localStorage.length; i++) {
      // Cria uma variavel local para esta operacao.
      const key = localStorage.key(i);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (key && key.startsWith('tile_cache_')) {
        // Executa uma instrucao necessaria para este fluxo.
        keysToRemove.push(key);
      }
    }
    // Executa uma instrucao necessaria para este fluxo.
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  // Define um membro interno desta classe.
  private gerarKeyLocalStorage(url: string): string {
    // Devolve o resultado deste bloco.
    return `tile_cache_${btoa(url)}`;
  }

  // Define um membro interno desta classe.
  private base64ToBlob(base64: string, mimeType: string): Blob {
    // Cria uma variavel local para esta operacao.
    const byteCharacters = atob(base64);
    // Cria uma variavel local para esta operacao.
    const byteNumbers = new Array(byteCharacters.length);
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (let i = 0; i < byteCharacters.length; i++) {
      // Executa uma instrucao necessaria para este fluxo.
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    // Cria uma variavel local para esta operacao.
    const byteArray = new Uint8Array(byteNumbers);
    // Devolve o resultado deste bloco.
    return new Blob([byteArray], { type: mimeType });
  }
}
