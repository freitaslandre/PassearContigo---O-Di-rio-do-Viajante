import { Injectable } from '@angular/core';

interface NominatimReverseResponse {
  display_name?: string;
  address?: Record<string, string>;
}

@Injectable({
  providedIn: 'root'
})
export class NominatimService {
  private readonly reverseUrl = 'https://nominatim.openstreetmap.org/reverse';
  private readonly cache = new Map<string, string>();
  private ultimoPedidoEm = 0;

  async obterEnderecoPorCoordenadas(latitude: number, longitude: number): Promise<string> {
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    const enderecoEmCache = this.cache.get(cacheKey);

    if (enderecoEmCache) {
      return enderecoEmCache;
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

    if (!endereco) {
      throw new Error('Endereco nao encontrado para estas coordenadas.');
    }

    this.cache.set(cacheKey, endereco);
    return endereco;
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
