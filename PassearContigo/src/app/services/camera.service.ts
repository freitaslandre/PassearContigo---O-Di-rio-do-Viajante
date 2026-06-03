import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

/**
 * CameraService
 * Gere funcionalidades de câmara do dispositivo
 * Permite capturar fotos da câmera ou galeria
 */
@Injectable({
  providedIn: 'root'
})
export class CameraService {

  constructor() {}

  /**
   * Captura uma foto usando a câmera do dispositivo
   * @returns URL da foto capturada em base64
   */
  async takePicture(): Promise<string | undefined> {
    try {
      const permissaoOk = await this.garantirPermissaoCamera();
      if (!permissaoOk) {
        return undefined;
      }

      const image = await Camera.getPhoto({
        quality: 72,
        width: 1280,
        height: 1280,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });

      console.log('✓ Foto capturada com sucesso');
      return this.converterBase64ParaDataUrl(image.base64String);
    } catch (error) {
      console.warn('⚠ Erro ao capturar foto:', error);
      return undefined;
    }
  }

  /**
   * Seleciona uma foto da galeria do dispositivo
   * @returns URL da foto selecionada em base64
   */
  async selectPictureFromGallery(): Promise<string | undefined> {
    try {
      const permissaoOk = await this.garantirPermissaoGaleria();
      if (!permissaoOk) {
        return undefined;
      }

      const image = await Camera.getPhoto({
        quality: 72,
        width: 1280,
        height: 1280,
        allowEditing: true,
        resultType: CameraResultType.Base64,
        source: CameraSource.Photos
      });

      console.log('✓ Foto selecionada da galeria');
      return this.converterBase64ParaDataUrl(image.base64String);
    } catch (error) {
      console.warn('⚠ Erro ao selecionar foto:', error);
      return undefined;
    }
  }

  /**
   * Captura uma foto como arquivo
   * @returns Caminho do arquivo salvo
   */
  async takePictureAsFile(): Promise<string | undefined> {
    try {
      const permissaoOk = await this.garantirPermissaoCamera();
      if (!permissaoOk) {
        return undefined;
      }

      const image = await Camera.getPhoto({
        quality: 72,
        width: 1280,
        height: 1280,
        allowEditing: true,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });

      console.log('✓ Foto capturada como arquivo');
      return image.webPath;
    } catch (error) {
      console.warn('⚠ Erro ao capturar foto como arquivo:', error);
      return undefined;
    }
  }

  private async garantirPermissaoCamera(): Promise<boolean> {
    const permissions = await Camera.checkPermissions();

    if (permissions.camera === 'granted') {
      return true;
    }

    const requested = await Camera.requestPermissions({ permissions: ['camera'] });
    return requested.camera === 'granted';
  }

  private async garantirPermissaoGaleria(): Promise<boolean> {
    const permissions = await Camera.checkPermissions();

    if (permissions.photos === 'granted' || permissions.photos === 'limited') {
      return true;
    }

    const requested = await Camera.requestPermissions({ permissions: ['photos'] });
    return requested.photos === 'granted' || requested.photos === 'limited';
  }

  private converterBase64ParaDataUrl(base64?: string): string | undefined {
    return base64 ? `data:image/jpeg;base64,${base64}` : undefined;
  }
}
