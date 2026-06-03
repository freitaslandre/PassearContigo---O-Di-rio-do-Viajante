import { Injectable } from '@angular/core';
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation';

/**
 * GeolocationService
 * Gere funcionalidades de geolocalização do dispositivo
 * Permite obter coordenadas GPS em tempo real
 */
@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() {}

  /**
   * Obtém a localização atual do dispositivo
   * @returns Objeto com latitude, longitude e acurácia
   */
  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    try {
      const permissaoOk = await this.garantirPermissaoLocalizacao();

      if (!permissaoOk) {
        return null;
      }

      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });
      console.log('✓ Localização obtida:', {
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
        accuracy: coordinates.coords.accuracy
      });
      return coordinates;
    } catch (error) {
      console.warn('⚠ Erro ao obter localização:', error);
      return null;
    }
  }

  /**
   * Monitora a localização em tempo real
   * Chama a callback a cada mudança de localização
   * @param callback Função chamada com novas coordenadas
   * @returns ID do watch (para cancelar depois)
   */
  async watchPosition(
    callback: (position: GeolocationPosition) => void
  ): Promise<string> {
    try {
      const permissaoOk = await this.garantirPermissaoLocalizacao();

      if (!permissaoOk) {
        return '';
      }

      const watchId = await Geolocation.watchPosition({
        enableHighAccuracy: true
      }, (position) => {
        if (position) {
          console.log('📍 Localização atualizada:', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
          callback(position);
        }
      });

      console.log('✓ Monitoramento de localização iniciado');
      return watchId as unknown as string;
    } catch (error) {
      console.warn('⚠ Erro ao monitorar localização:', error);
      return '';
    }
  }

  /**
   * Para o monitoramento de localização
   * @param watchId ID retornado por watchPosition
   */
  async clearWatch(watchId: string): Promise<void> {
    try {
      await Geolocation.clearWatch({ id: watchId });
      console.log('✓ Monitoramento de localização cancelado');
    } catch (error) {
      console.warn('⚠ Erro ao cancelar monitoramento:', error);
    }
  }

  /**
   * Calcula a distância entre duas coordenadas em km
   * @param lat1 Latitude do ponto 1
   * @param lon1 Longitude do ponto 1
   * @param lat2 Latitude do ponto 2
   * @param lon2 Longitude do ponto 2
   * @returns Distância em quilômetros
   */
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    // Fórmula de Haversine
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private async garantirPermissaoLocalizacao(): Promise<boolean> {
    const permissions = await Geolocation.checkPermissions();

    if (permissions.location === 'granted') {
      return true;
    }

    const requested = await Geolocation.requestPermissions({ permissions: ['location'] });
    return requested.location === 'granted';
  }
}
