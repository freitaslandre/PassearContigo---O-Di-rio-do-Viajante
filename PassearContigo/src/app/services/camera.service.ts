// app/services/camera.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * CameraService
 * Gere funcionalidades de câmara do dispositivo
 * Permite capturar fotos da câmera ou galeria
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class CameraService {

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor() {}

  /**
   * Captura uma foto usando a câmera do dispositivo
   * @returns URL da foto capturada em base64
   */
  async takePicture(): Promise<string | undefined> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const permissaoOk = await this.garantirPermissaoCamera();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!permissaoOk) {
        // Devolve o resultado deste bloco.
        return undefined;
      }

      // Cria uma variavel local para esta operacao.
      const image = await Camera.getPhoto({
        // Define um campo ou opcao de configuracao.
        quality: 72,
        // Define um campo ou opcao de configuracao.
        width: 1280,
        // Define um campo ou opcao de configuracao.
        height: 1280,
        // Define um campo ou opcao de configuracao.
        allowEditing: true,
        // Define um campo ou opcao de configuracao.
        resultType: CameraResultType.Base64,
        // Define um campo ou opcao de configuracao.
        source: CameraSource.Camera
      });

      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Foto capturada com sucesso');
      // Devolve o resultado deste bloco.
      return this.converterBase64ParaDataUrl(image.base64String);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Erro ao capturar foto:', error);
      // Devolve o resultado deste bloco.
      return undefined;
    }
  }

  /**
   * Seleciona uma foto da galeria do dispositivo
   * @returns URL da foto selecionada em base64
   */
  async selectPictureFromGallery(): Promise<string | undefined> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const permissaoOk = await this.garantirPermissaoGaleria();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!permissaoOk) {
        // Devolve o resultado deste bloco.
        return undefined;
      }

      // Cria uma variavel local para esta operacao.
      const image = await Camera.getPhoto({
        // Define um campo ou opcao de configuracao.
        quality: 72,
        // Define um campo ou opcao de configuracao.
        width: 1280,
        // Define um campo ou opcao de configuracao.
        height: 1280,
        // Define um campo ou opcao de configuracao.
        allowEditing: true,
        // Define um campo ou opcao de configuracao.
        resultType: CameraResultType.Base64,
        // Define um campo ou opcao de configuracao.
        source: CameraSource.Photos
      });

      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Foto selecionada da galeria');
      // Devolve o resultado deste bloco.
      return this.converterBase64ParaDataUrl(image.base64String);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Erro ao selecionar foto:', error);
      // Devolve o resultado deste bloco.
      return undefined;
    }
  }

  /**
   * Captura uma foto como arquivo
   * @returns Caminho do arquivo salvo
   */
  async takePictureAsFile(): Promise<string | undefined> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const permissaoOk = await this.garantirPermissaoCamera();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!permissaoOk) {
        // Devolve o resultado deste bloco.
        return undefined;
      }

      // Cria uma variavel local para esta operacao.
      const image = await Camera.getPhoto({
        // Define um campo ou opcao de configuracao.
        quality: 72,
        // Define um campo ou opcao de configuracao.
        width: 1280,
        // Define um campo ou opcao de configuracao.
        height: 1280,
        // Define um campo ou opcao de configuracao.
        allowEditing: true,
        // Define um campo ou opcao de configuracao.
        resultType: CameraResultType.Uri,
        // Define um campo ou opcao de configuracao.
        source: CameraSource.Camera
      });

      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Foto capturada como arquivo');
      // Devolve o resultado deste bloco.
      return image.webPath;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Erro ao capturar foto como arquivo:', error);
      // Devolve o resultado deste bloco.
      return undefined;
    }
  }

  // Define um membro interno desta classe.
  private async garantirPermissaoCamera(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const permissions = await Camera.checkPermissions();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (permissions.camera === 'granted') {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Cria uma variavel local para esta operacao.
    const requested = await Camera.requestPermissions({ permissions: ['camera'] });
    // Devolve o resultado deste bloco.
    return requested.camera === 'granted';
  }

  // Define um membro interno desta classe.
  private async garantirPermissaoGaleria(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const permissions = await Camera.checkPermissions();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (permissions.photos === 'granted' || permissions.photos === 'limited') {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Cria uma variavel local para esta operacao.
    const requested = await Camera.requestPermissions({ permissions: ['photos'] });
    // Devolve o resultado deste bloco.
    return requested.photos === 'granted' || requested.photos === 'limited';
  }

  // Define um membro interno desta classe.
  private converterBase64ParaDataUrl(base64?: string): string | undefined {
    // Devolve o resultado deste bloco.
    return base64 ? `data:image/jpeg;base64,${base64}` : undefined;
  }
}
