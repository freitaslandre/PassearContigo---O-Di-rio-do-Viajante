// app/services/storage.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Storage } from '@ionic/storage-angular';

/**
 * StorageService
 * Serviço para gerenciar o armazenamento de dados locais
 * Utiliza Ionic Storage para persistência de dados
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class StorageService {
  // Define um membro interno desta classe.
  private storageReady: Promise<Storage>;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(private storage: Storage) {
    // Atualiza ou consulta estado da pagina.
    this.storageReady = this.storage.create();
  }

  // Define um membro interno desta classe.
  private async getStorage(): Promise<Storage> {
    // Devolve o resultado deste bloco.
    return this.storageReady;
  }

  /**
   * Armazena um item no Ionic Storage
   * @param key - Chave do item
   * @param value - Valor a armazenar
   */
  async setItem(key: string, value: any): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const storage = await this.getStorage();
    // Aguarda a conclusao de uma operacao assincrona.
    await storage.set(key, value);
  }

  /**
   * Recupera um item do Ionic Storage
   * @param key - Chave do item
   * @returns Valor armazenado ou null
   */
  async getItem(key: string): Promise<any> {
    // Cria uma variavel local para esta operacao.
    const storage = await this.getStorage();
    // Devolve o resultado deste bloco.
    return storage.get(key);
  }

  /**
   * Remove um item do localStorage
   * @param key - Chave do item
   */
  async removeItem(key: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const storage = await this.getStorage();
    // Aguarda a conclusao de uma operacao assincrona.
    await storage.remove(key);
  }

  /**
   * Limpa todo o Ionic Storage
   */
  async clear(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const storage = await this.getStorage();
    // Aguarda a conclusao de uma operacao assincrona.
    await storage.clear();
  }
}
