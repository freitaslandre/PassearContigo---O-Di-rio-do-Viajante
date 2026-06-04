// app/services/geolocation.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Geolocation, GeolocationPosition } from '@capacitor/geolocation';

/**
 * GeolocationService
 * Gere funcionalidades de geolocalização do dispositivo
 * Permite obter coordenadas GPS em tempo real
 */
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class GeolocationService {

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor() {}

  /**
   * Obtém a localização atual do dispositivo
   * @returns Objeto com latitude, longitude e acurácia
   */
  async getCurrentPosition(): Promise<GeolocationPosition | null> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const permissaoOk = await this.garantirPermissaoLocalizacao();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!permissaoOk) {
        // Devolve o resultado deste bloco.
        return null;
      }

      // Cria uma variavel local para esta operacao.
      const coordinates = await Geolocation.getCurrentPosition({
        // Define um campo ou opcao de configuracao.
        enableHighAccuracy: true,
        // Define um campo ou opcao de configuracao.
        timeout: 10000
      });
      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Localização obtida:', {
        // Define um campo ou opcao de configuracao.
        latitude: coordinates.coords.latitude,
        // Define um campo ou opcao de configuracao.
        longitude: coordinates.coords.longitude,
        // Define um campo ou opcao de configuracao.
        accuracy: coordinates.coords.accuracy
      });
      // Devolve o resultado deste bloco.
      return coordinates;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Erro ao obter localização:', error);
      // Devolve o resultado deste bloco.
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
    // Define um campo ou opcao de configuracao.
    callback: (position: GeolocationPosition) => void
  // Executa uma instrucao necessaria para este fluxo.
  ): Promise<string> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const permissaoOk = await this.garantirPermissaoLocalizacao();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!permissaoOk) {
        // Devolve o resultado deste bloco.
        return '';
      }

      // Cria uma variavel local para esta operacao.
      const watchId = await Geolocation.watchPosition({
        // Define um campo ou opcao de configuracao.
        enableHighAccuracy: true
      // Executa uma instrucao necessaria para este fluxo.
      }, (position) => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (position) {
          // Executa uma instrucao necessaria para este fluxo.
          console.log('📍 Localização atualizada:', {
            // Define um campo ou opcao de configuracao.
            latitude: position.coords.latitude,
            // Define um campo ou opcao de configuracao.
            longitude: position.coords.longitude
          });
          // Define um metodo chamado pela pagina ou por outros metodos.
          callback(position);
        }
      });

      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Monitoramento de localização iniciado');
      // Devolve o resultado deste bloco.
      return watchId as unknown as string;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('⚠ Erro ao monitorar localização:', error);
      // Devolve o resultado deste bloco.
      return '';
    }
  }

  /**
   * Para o monitoramento de localização
   * @param watchId ID retornado por watchPosition
   */
  async clearWatch(watchId: string): Promise<void> {
    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await Geolocation.clearWatch({ id: watchId });
      // Executa uma instrucao necessaria para este fluxo.
      console.log('✓ Monitoramento de localização cancelado');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
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
    // Define um campo ou opcao de configuracao.
    lat1: number,
    // Define um campo ou opcao de configuracao.
    lon1: number,
    // Define um campo ou opcao de configuracao.
    lat2: number,
    // Define um campo ou opcao de configuracao.
    lon2: number
  // Executa uma instrucao necessaria para este fluxo.
  ): number {
    // Fórmula de Haversine
    const R = 6371; // Raio da Terra em km
    // Cria uma variavel local para esta operacao.
    const dLat = (lat2 - lat1) * Math.PI / 180;
    // Cria uma variavel local para esta operacao.
    const dLon = (lon2 - lon1) * Math.PI / 180;
    // Cria uma variavel local para esta operacao.
    const a =
      // Executa uma instrucao necessaria para este fluxo.
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      // Executa uma instrucao necessaria para este fluxo.
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      // Executa uma instrucao necessaria para este fluxo.
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    // Cria uma variavel local para esta operacao.
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Devolve o resultado deste bloco.
    return R * c;
  }

  // Define um membro interno desta classe.
  private async garantirPermissaoLocalizacao(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const permissions = await Geolocation.checkPermissions();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (permissions.location === 'granted') {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Cria uma variavel local para esta operacao.
    const requested = await Geolocation.requestPermissions({ permissions: ['location'] });
    // Devolve o resultado deste bloco.
    return requested.location === 'granted';
  }
}
