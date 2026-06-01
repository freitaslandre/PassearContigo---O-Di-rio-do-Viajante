import { Injectable } from '@angular/core';

interface NominatimReverseResponse {
  display_name?: string;
  name?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
}

export interface NominatimReverseResult {
  endereco: string;
  nomeSugerido: string;
}

@Injectable({
  providedIn: 'root'
})
export class NominatimService {
  private readonly reverseUrl = 'https://nominatim.openstreetmap.org/reverse';
  private readonly cache = new Map<string, NominatimReverseResult>();
  private ultimoPedidoEm = 0;

  async obterEnderecoPorCoordenadas(latitude: number, longitude: number): Promise<string> {
    const resultado = await this.obterDetalhesPorCoordenadas(latitude, longitude);
    return resultado.endereco;
  }

  async obterDetalhesPorCoordenadas(latitude: number, longitude: number): Promise<NominatimReverseResult> {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const resultadoEmCache = this.cache.get(cacheKey);

    if (resultadoEmCache) {
      return resultadoEmCache;
    }

    await this.respeitarIntervaloEntrePedidos();

    const params = new URLSearchParams({
      format: 'jsonv2',
      lat: String(latitude),
      lon: String(longitude),
      addressdetails: '1',
      'accept-language': 'pt-PT'
    });

    const response = await fetch(`${this.reverseUrl}?${params.toString()}`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Nao foi possivel obter o endereco pelo OpenStreetMap.');
    }

    const data = await response.json() as NominatimReverseResponse;
    const endereco = this.formatarEndereco(data);
    const nomeSugerido = this.obterNomeSugerido(data);

    if (!endereco && !nomeSugerido) {
      throw new Error('Dados nao encontrados para estas coordenadas.');
    }

    const resultado = { endereco, nomeSugerido };
    this.cache.set(cacheKey, resultado);
    return resultado;
  }

  private formatarEndereco(data: NominatimReverseResponse): string {
    const address = data.address || {};
    const estrada = address['road'] || address['pedestrian'] || address['footway'] || address['path'];
    const numero = address['house_number'];
    const localidade = address['city'] || address['town'] || address['village'] || address['municipality'];
    const codigoPostal = address['postcode'];
    const pais = address['country'];

    const rua = [estrada, numero].filter(Boolean).join(' ');
    const partes = [rua, localidade, codigoPostal, pais].filter(Boolean);

    return partes.length > 0 ? partes.join(', ') : data.display_name || '';
  }

  private obterNomeSugerido(data: NominatimReverseResponse): string {
    const address = data.address || {};

    return data.name
      || address['amenity']
      || address['tourism']
      || address['shop']
      || address['leisure']
      || address['building']
      || address['historic']
      || address['road']
      || address['neighbourhood']
      || address['suburb']
      || address['city']
      || address['town']
      || address['village']
      || '';
  }

  private async respeitarIntervaloEntrePedidos(): Promise<void> {
    const agora = Date.now();
    const tempoDesdeUltimoPedido = agora - this.ultimoPedidoEm;
    const esperaMs = 1100 - tempoDesdeUltimoPedido;

    if (esperaMs > 0) {
      await new Promise(resolve => setTimeout(resolve, esperaMs));
    }

    this.ultimoPedidoEm = Date.now();
  }
}
