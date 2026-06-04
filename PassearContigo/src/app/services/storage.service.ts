// app/services/storage.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

/**
 * StorageService
 * Serviço para gerenciar o armazenamento de dados locais
 * Utiliza Ionic Storage para persistência de dados
 */
@Injectable({
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class StorageService {
  private storageReady: Promise<Storage>;

  constructor(private storage: Storage) {
    this.storageReady = this.storage.create();
  }

  private async getStorage(): Promise<Storage> {
    return this.storageReady;
  }

  /**
   * Armazena um item no Ionic Storage
   * @param key - Chave do item
   * @param value - Valor a armazenar
   */
  async setItem(key: string, value: any): Promise<void> {
    const storage = await this.getStorage();
    await storage.set(key, value);
  }

  /**
   * Recupera um item do Ionic Storage
   * @param key - Chave do item
   * @returns Valor armazenado ou null
   */
  async getItem(key: string): Promise<any> {
    const storage = await this.getStorage();
    return storage.get(key);
  }

  /**
   * Remove um item do localStorage
   * @param key - Chave do item
   */
  async removeItem(key: string): Promise<void> {
    const storage = await this.getStorage();
    await storage.remove(key);
  }

  /**
   * Limpa todo o Ionic Storage
   */
  async clear(): Promise<void> {
    const storage = await this.getStorage();
    await storage.clear();
  }
}
