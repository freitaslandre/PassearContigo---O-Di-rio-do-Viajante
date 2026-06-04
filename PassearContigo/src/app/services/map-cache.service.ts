// app/services/map-cache.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';

// Contrato de dados usado para tipar objetos desta area.
interface TileCacheEntry {
  url: string;
  data: Blob;
  timestamp: number;
  size: number;
}

@Injectable({
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class MapCacheService {
  private readonly DB_NAME = 'PassearContigo_MapCache';
  private readonly STORE_NAME = 'tiles';
  private readonly QUOTA_MAX = 10 * 1024 * 1024; // 10MB
  private db: IDBDatabase | null = null;
  private useIndexedDB = false;

  constructor() {
    this.inicializarDB();
  }

  private inicializarDB(): void {
    if (!('indexedDB' in window)) {
      console.warn('IndexedDB não disponível, usando fallback.');
      return;
    }

    const request = indexedDB.open(this.DB_NAME, 1);

    request.onerror = () => {
      console.error('Erro ao abrir IndexedDB:', request.error);
    };

    request.onsuccess = () => {
      this.db = request.result;
      this.useIndexedDB = true;
    };

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(this.STORE_NAME)) {
        db.createObjectStore(this.STORE_NAME, { keyPath: 'url' });
      }
    };
  }

  async obterTile(url: string): Promise<Blob | null> {
    if (this.useIndexedDB && this.db) {
      return this.obterTileIndexedDB(url);
    }
    return this.obterTileLocalStorage(url);
  }

  private obterTileIndexedDB(url: string): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(null);
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.get(url);

      request.onsuccess = () => {
        const entry = request.result as TileCacheEntry | undefined;
        if (entry) {
          resolve(entry.data);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => {
        console.error('Erro ao obter tile do IndexedDB:', request.error);
        resolve(null);
      };
    });
  }

  private obterTileLocalStorage(url: string): Blob | null {
    try {
      const key = this.gerarKeyLocalStorage(url);
      const item = localStorage.getItem(key);
      if (item) {
        const entry = JSON.parse(item) as { data: string; timestamp: number };
        return this.base64ToBlob(entry.data, 'image/png');
      }
    } catch (error) {
      console.error('Erro ao obter tile do localStorage:', error);
    }
    return null;
  }

  async cachearTile(url: string, blob: Blob): Promise<void> {
    if (this.useIndexedDB && this.db) {
      await this.cachearTileIndexedDB(url, blob);
    } else {
      this.cachearTileLocalStorage(url, blob);
    }
  }

  private cachearTileIndexedDB(url: string, blob: Blob): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const entry: TileCacheEntry = {
        url,
        data: blob,
        timestamp: Date.now(),
        size: blob.size
      };

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.put(entry);

      request.onsuccess = () => {
        this.limparCacheSeNecessario().then(() => resolve());
      };

      request.onerror = () => {
        console.error('Erro ao cachear tile no IndexedDB:', request.error);
        resolve();
      };
    });
  }

  private cachearTileLocalStorage(url: string, blob: Blob): void {
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        const key = this.gerarKeyLocalStorage(url);
        const entry = {
          data: base64,
          timestamp: Date.now()
        };
        localStorage.setItem(key, JSON.stringify(entry));
        this.limparCacheLocalStorageSeNecessario();
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Erro ao cachear tile no localStorage:', error);
    }
  }

  private async limparCacheSeNecessario(): Promise<void> {
    if (!this.db) return;

    const uso = await this.getUsoDisco();
    if (uso > this.QUOTA_MAX) {
      await this.removerTilesAntigos();
    }
  }

  private limparCacheLocalStorageSeNecessario(): void {
    let totalSize = 0;
    const entries: Array<{ key: string; timestamp: number }> = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tile_cache_')) {
        const item = localStorage.getItem(key);
        if (item) {
          try {
            const entry = JSON.parse(item);
            totalSize += item.length;
            entries.push({ key, timestamp: entry.timestamp });
          } catch (e) {
            localStorage.removeItem(key);
          }
        }
      }
    }

    if (totalSize > this.QUOTA_MAX) {
      entries.sort((a, b) => a.timestamp - b.timestamp);
      for (const entry of entries) {
        if (totalSize <= this.QUOTA_MAX * 0.8) break;
        totalSize -= (localStorage.getItem(entry.key) || '').length;
        localStorage.removeItem(entry.key);
      }
    }
  }

  private removerTilesAntigos(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = (request.result as TileCacheEntry[]).sort(
          (a, b) => a.timestamp - b.timestamp
        );

        const txWrite = this.db!.transaction([this.STORE_NAME], 'readwrite');
        const storeWrite = txWrite.objectStore(this.STORE_NAME);

        let totalRemoved = 0;
        for (const entry of entries) {
          if (totalRemoved > this.QUOTA_MAX * 0.2) break;
          totalRemoved += entry.size;
          storeWrite.delete(entry.url);
        }

        txWrite.oncomplete = () => resolve();
      };

      request.onerror = () => resolve();
    });
  }

  async getUsoDisco(): Promise<number> {
    if (this.useIndexedDB && this.db) {
      return this.getUsoDiscoIndexedDB();
    }
    return this.getUsoDiscoLocalStorage();
  }

  private getUsoDiscoIndexedDB(): Promise<number> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve(0);
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => {
        const entries = request.result as TileCacheEntry[];
        const total = entries.reduce((sum, entry) => sum + entry.size, 0);
        resolve(total);
      };

      request.onerror = () => resolve(0);
    });
  }

  private getUsoDiscoLocalStorage(): number {
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tile_cache_')) {
        const item = localStorage.getItem(key) || '';
        total += item.length;
      }
    }
    return total;
  }

  async limparCache(): Promise<void> {
    if (this.useIndexedDB && this.db) {
      return this.limparCacheIndexedDB();
    }
    this.limparCacheLocalStorage();
  }

  private limparCacheIndexedDB(): Promise<void> {
    return new Promise((resolve) => {
      if (!this.db) {
        resolve();
        return;
      }

      const transaction = this.db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => resolve();
    });
  }

  private limparCacheLocalStorage(): void {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('tile_cache_')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }

  private gerarKeyLocalStorage(url: string): string {
    return `tile_cache_${btoa(url)}`;
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }
}
