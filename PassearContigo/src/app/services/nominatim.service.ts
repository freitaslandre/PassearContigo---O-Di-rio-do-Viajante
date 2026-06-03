import { Injectable } from '@angular/core';

interface NominatimReverseResponse {
  display_name?: string;
  name?: string;
  category?: string;
  type?: string;
  address?: Record<string, string>;
}

interface NominatimSearchResponse {
  display_name?: string;
  name?: string;
  category?: string;
  type?: string;
  lat?: string;
  lon?: string;
  address?: Record<string, string>;
}

export interface NominatimReverseResult {
  endereco: string;
  nomeSugerido: string;
}

export interface NominatimSearchResult {
  nome: string;
  endereco: string;
  categoria: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root'
})
export class NominatimService {
  private readonly searchUrl = 'https://nominatim.openstreetmap.org/search';
  private readonly reverseUrl = 'https://nominatim.openstreetmap.org/reverse';
  private readonly cache = new Map<string, NominatimReverseResult>();
  private readonly searchCache = new Map<string, NominatimSearchResult[]>();
  private ultimoPedidoEm = 0;

  async pesquisarLocais(termo: string): Promise<NominatimSearchResult[]> {
    const termoLimpo = termo.trim();

    if (termoLimpo.length < 2) {
      return [];
    }

    const cacheKey = termoLimpo.toLowerCase();
    const resultadoEmCache = this.searchCache.get(cacheKey);

    if (resultadoEmCache) {
      return resultadoEmCache;
    }

    await this.respeitarIntervaloEntrePedidos();

    const params = new URLSearchParams({
      format: 'jsonv2',
      q: termoLimpo,
      addressdetails: '1',
      limit: '10',
      'accept-language': 'pt-PT'
    });

    const response = await fetch(`${this.searchUrl}?${params.toString()}`, {
      headers: {
        Accept: 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Não foi possível pesquisar locais pelo OpenStreetMap.');
    }

    const data = await response.json() as NominatimSearchResponse[];
    const resultados = data
      .map(item => this.converterResultadoPesquisa(item))
      .filter((item): item is NominatimSearchResult => !!item);

    this.searchCache.set(cacheKey, resultados);
    return resultados;
  }

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
      throw new Error('Não foi possível obter o endereço pelo OpenStreetMap.');
    }

    const data = await response.json() as NominatimReverseResponse;
    const endereco = this.formatarEndereco(data);
    const nomeSugerido = this.obterNomeSugerido(data);

    if (!endereco && !nomeSugerido) {
      throw new Error('Dados não encontrados para estas coordenadas.');
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

  private converterResultadoPesquisa(data: NominatimSearchResponse): NominatimSearchResult | null {
    const latitude = Number(data.lat);
    const longitude = Number(data.lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return null;
    }

    return {
      nome: this.obterNomeSugerido(data) || data.display_name?.split(',')[0] || 'Local',
      endereco: this.formatarEndereco(data),
      categoria: this.formatarCategoria(data),
      latitude,
      longitude
    };
  }

  private formatarCategoria(data: NominatimSearchResponse): string {
    const partes = [data.category, data.type]
      .filter(Boolean)
      .map(valor => valor!.replace(/_/g, ' '));

    return partes.length > 0 ? partes.join(' / ') : 'local';
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
