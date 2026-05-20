import { Injectable } from '@angular/core';

/**
 * StorageService
 * Serviço para gerenciar o armazenamento de dados locais
 * Utiliza Ionic Storage para persistência de dados
 */
@Injectable({
  providedIn: 'root'
})
export class StorageService {

  constructor() { }

  /**
   * Armazena um item no localStorage
   * @param key - Chave do item
   * @param value - Valor a armazenar
   */
  async setItem(key: string, value: any): Promise<void> {
    // TODO: Implementar com Ionic Storage
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Recupera um item do localStorage
   * @param key - Chave do item
   * @returns Valor armazenado ou null
   */
  async getItem(key: string): Promise<any> {
    // TODO: Implementar com Ionic Storage
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  }

  /**
   * Remove um item do localStorage
   * @param key - Chave do item
   */
  async removeItem(key: string): Promise<void> {
    // TODO: Implementar com Ionic Storage
    localStorage.removeItem(key);
  }

  /**
   * Limpa todo o localStorage
   */
  async clear(): Promise<void> {
    // TODO: Implementar com Ionic Storage
    localStorage.clear();
  }
}
