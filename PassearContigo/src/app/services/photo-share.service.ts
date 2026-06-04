// app/services/photo-share.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Directory, Filesystem } from '@capacitor/filesystem';
// Importa dependencias usadas neste ficheiro.
import { Share } from '@capacitor/share';

// Contrato de dados usado para tipar objetos desta area.
interface PreparedPhoto {
  // Define um campo ou opcao de configuracao.
  base64: string;
  // Define um campo ou opcao de configuracao.
  extension: string;
}

// Contrato de dados usado para tipar objetos desta area.
export interface PhotoShareOptions {
  // Define um campo ou opcao de configuracao.
  title: string;
  // Executa uma instrucao necessaria para este fluxo.
  text?: string;
  // Executa uma instrucao necessaria para este fluxo.
  dialogTitle?: string;
  // Executa uma instrucao necessaria para este fluxo.
  fileNamePrefix?: string;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PhotoShareService {
  // Define um metodo chamado pela pagina ou por outros metodos.
  async canShare(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const result = await Share.canShare();
    // Devolve o resultado deste bloco.
    return result.value;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async sharePhoto(photoUrl: string, options: PhotoShareOptions): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const photo = await this.preparePhoto(photoUrl);
    // Cria uma variavel local para esta operacao.
    const fileName = `${this.sanitizeFileName(options.fileNamePrefix || options.title)}-${Date.now()}.${photo.extension}`;

    // Cria uma variavel local para esta operacao.
    const savedFile = await Filesystem.writeFile({
      // Define um campo ou opcao de configuracao.
      path: fileName,
      // Define um campo ou opcao de configuracao.
      data: photo.base64,
      // Define um campo ou opcao de configuracao.
      directory: Directory.Cache
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await Share.share({
      // Define um campo ou opcao de configuracao.
      title: options.title,
      // Define um campo ou opcao de configuracao.
      text: options.text,
      // Define um campo ou opcao de configuracao.
      files: [savedFile.uri],
      // Define um campo ou opcao de configuracao.
      dialogTitle: options.dialogTitle || 'Partilhar foto'
    });
  }

  // Define um membro interno desta classe.
  private async preparePhoto(photoUrl: string): Promise<PreparedPhoto> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (photoUrl.startsWith('data:image')) {
      // Devolve o resultado deste bloco.
      return this.prepareDataUrl(photoUrl);
    }

    // Cria uma variavel local para esta operacao.
    let response: Response;
    // Inicia um bloco protegido contra erros.
    try {
      // Atribui um valor a esta propriedade.
      response = await fetch(photoUrl);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (photoUrl.startsWith('blob:')) {
        // Executa uma instrucao necessaria para este fluxo.
        throw new Error('Esta foto temporária já não está disponível. Importe-a novamente para a poder partilhar.');
      }

      // Executa uma instrucao necessaria para este fluxo.
      throw error;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!response.ok) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não foi possível carregar a foto para partilha.');
    }

    // Cria uma variavel local para esta operacao.
    const blob = await response.blob();
    // Cria uma variavel local para esta operacao.
    const dataUrl = await this.blobToDataUrl(blob);
    // Cria uma variavel local para esta operacao.
    const prepared = this.prepareDataUrl(dataUrl);

    // Devolve o resultado deste bloco.
    return {
      // Executa uma instrucao necessaria para este fluxo.
      ...prepared,
      // Define um campo ou opcao de configuracao.
      extension: this.extensionFromMime(blob.type) || prepared.extension
    };
  }

  // Define um membro interno desta classe.
  private prepareDataUrl(dataUrl: string): PreparedPhoto {
    // Cria uma variavel local para esta operacao.
    const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!match) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Formato de foto inválido para partilha.');
    }

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      base64: match[2],
      // Define um campo ou opcao de configuracao.
      extension: this.extensionFromMime(match[1]) || 'jpg'
    };
  }

  // Define um membro interno desta classe.
  private blobToDataUrl(blob: Blob): Promise<string> {
    // Devolve o resultado deste bloco.
    return new Promise((resolve, reject) => {
      // Cria uma variavel local para esta operacao.
      const reader = new FileReader();
      // Executa uma instrucao necessaria para este fluxo.
      reader.onload = () => resolve(String(reader.result || ''));
      // Executa uma instrucao necessaria para este fluxo.
      reader.onerror = () => reject(new Error('Não foi possível preparar a foto para partilha.'));
      // Executa uma instrucao necessaria para este fluxo.
      reader.readAsDataURL(blob);
    });
  }

  // Define um membro interno desta classe.
  private extensionFromMime(mime?: string): string {
    // Cria uma variavel local para esta operacao.
    const normalized = (mime || '').toLowerCase();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (normalized.includes('png')) return 'png';
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (normalized.includes('webp')) return 'webp';
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (normalized.includes('gif')) return 'gif';
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (normalized.includes('heic')) return 'heic';
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (normalized.includes('heif')) return 'heif';

    // Devolve o resultado deste bloco.
    return 'jpg';
  }

  // Define um membro interno desta classe.
  private sanitizeFileName(value: string): string {
    // Devolve o resultado deste bloco.
    return value
      // Executa uma instrucao necessaria para este fluxo.
      .normalize('NFD')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/[\u0300-\u036f]/g, '')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/[^a-zA-Z0-9_-]+/g, '-')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/^-+|-+$/g, '')
      // Executa uma instrucao necessaria para este fluxo.
      .slice(0, 40)
      // Executa uma instrucao necessaria para este fluxo.
      || 'foto';
  }
}
