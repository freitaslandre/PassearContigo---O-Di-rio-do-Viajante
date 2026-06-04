// app/services/nominatim.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';

// Contrato de dados usado para tipar objetos desta area.
interface NominatimReverseResponse {
  // Executa uma instrucao necessaria para este fluxo.
  display_name?: string;
  // Executa uma instrucao necessaria para este fluxo.
  name?: string;
  // Executa uma instrucao necessaria para este fluxo.
  category?: string;
  // Declara uma estrutura principal usada pela aplicacao.
  type?: string;
  // Executa uma instrucao necessaria para este fluxo.
  address?: Record<string, string>;
}

// Contrato de dados usado para tipar objetos desta area.
interface NominatimSearchResponse {
  // Executa uma instrucao necessaria para este fluxo.
  display_name?: string;
  // Executa uma instrucao necessaria para este fluxo.
  name?: string;
  // Executa uma instrucao necessaria para este fluxo.
  category?: string;
  // Declara uma estrutura principal usada pela aplicacao.
  type?: string;
  // Executa uma instrucao necessaria para este fluxo.
  lat?: string;
  // Executa uma instrucao necessaria para este fluxo.
  lon?: string;
  // Executa uma instrucao necessaria para este fluxo.
  address?: Record<string, string>;
}

// Contrato de dados usado para tipar objetos desta area.
export interface NominatimReverseResult {
  // Define um campo ou opcao de configuracao.
  endereco: string;
  // Define um campo ou opcao de configuracao.
  nomeSugerido: string;
  // Define um campo ou opcao de configuracao.
  categoria: string;
}

// Contrato de dados usado para tipar objetos desta area.
export interface NominatimSearchResult {
  // Define um campo ou opcao de configuracao.
  nome: string;
  // Define um campo ou opcao de configuracao.
  endereco: string;
  // Define um campo ou opcao de configuracao.
  categoria: string;
  // Define um campo ou opcao de configuracao.
  latitude: number;
  // Define um campo ou opcao de configuracao.
  longitude: number;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class NominatimService {
  // Define um membro interno desta classe.
  private readonly searchUrl = 'https://nominatim.openstreetmap.org/search';
  // Define um membro interno desta classe.
  private readonly reverseUrl = 'https://nominatim.openstreetmap.org/reverse';
  // Define um membro interno desta classe.
  private readonly cache = new Map<string, NominatimReverseResult>();
  // Define um membro interno desta classe.
  private readonly searchCache = new Map<string, NominatimSearchResult[]>();
  // Define um membro interno desta classe.
  private ultimoPedidoEm = 0;

  // Define um metodo chamado pela pagina ou por outros metodos.
  async pesquisarLocais(termo: string): Promise<NominatimSearchResult[]> {
    // Cria uma variavel local para esta operacao.
    const termoLimpo = termo.trim();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (termoLimpo.length < 2) {
      // Devolve o resultado deste bloco.
      return [];
    }

    // Cria uma variavel local para esta operacao.
    const cacheKey = termoLimpo.toLowerCase();
    // Cria uma variavel local para esta operacao.
    const resultadoEmCache = this.searchCache.get(cacheKey);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (resultadoEmCache) {
      // Devolve o resultado deste bloco.
      return resultadoEmCache;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.respeitarIntervaloEntrePedidos();

    // Cria uma variavel local para esta operacao.
    const params = new URLSearchParams({
      // Define um campo ou opcao de configuracao.
      format: 'jsonv2',
      // Define um campo ou opcao de configuracao.
      q: termoLimpo,
      // Define um campo ou opcao de configuracao.
      addressdetails: '1',
      // Define um campo ou opcao de configuracao.
      limit: '10',
      // Executa uma instrucao necessaria para este fluxo.
      'accept-language': 'pt-PT'
    });

    // Cria uma variavel local para esta operacao.
    const response = await fetch(`${this.searchUrl}?${params.toString()}`, {
      // Define um campo ou opcao de configuracao.
      headers: {
        // Define um campo ou opcao de configuracao.
        Accept: 'application/json'
      }
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!response.ok) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não foi possível pesquisar locais pelo OpenStreetMap.');
    }

    // Cria uma variavel local para esta operacao.
    const data = await response.json() as NominatimSearchResponse[];
    // Cria uma variavel local para esta operacao.
    const resultados = data
      // Executa uma instrucao necessaria para este fluxo.
      .map(item => this.converterResultadoPesquisa(item))
      // Executa uma instrucao necessaria para este fluxo.
      .filter((item): item is NominatimSearchResult => !!item);

    // Atualiza ou consulta estado da pagina.
    this.searchCache.set(cacheKey, resultados);
    // Devolve o resultado deste bloco.
    return resultados;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async obterEnderecoPorCoordenadas(latitude: number, longitude: number): Promise<string> {
    // Cria uma variavel local para esta operacao.
    const resultado = await this.obterDetalhesPorCoordenadas(latitude, longitude);
    // Devolve o resultado deste bloco.
    return resultado.endereco;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async obterDetalhesPorCoordenadas(latitude: number, longitude: number): Promise<NominatimReverseResult> {
    // Cria uma variavel local para esta operacao.
    const cacheKey = `${latitude.toFixed(5)},${longitude.toFixed(5)}`;
    // Cria uma variavel local para esta operacao.
    const resultadoEmCache = this.cache.get(cacheKey);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (resultadoEmCache) {
      // Devolve o resultado deste bloco.
      return resultadoEmCache;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.respeitarIntervaloEntrePedidos();

    // Cria uma variavel local para esta operacao.
    const params = new URLSearchParams({
      // Define um campo ou opcao de configuracao.
      format: 'jsonv2',
      // Define um campo ou opcao de configuracao.
      lat: String(latitude),
      // Define um campo ou opcao de configuracao.
      lon: String(longitude),
      // Define um campo ou opcao de configuracao.
      addressdetails: '1',
      // Executa uma instrucao necessaria para este fluxo.
      'accept-language': 'pt-PT'
    });

    // Cria uma variavel local para esta operacao.
    const response = await fetch(`${this.reverseUrl}?${params.toString()}`, {
      // Define um campo ou opcao de configuracao.
      headers: {
        // Define um campo ou opcao de configuracao.
        Accept: 'application/json'
      }
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!response.ok) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não foi possível obter o endereço pelo OpenStreetMap.');
    }

    // Cria uma variavel local para esta operacao.
    const data = await response.json() as NominatimReverseResponse;
    // Cria uma variavel local para esta operacao.
    const endereco = this.formatarEndereco(data);
    // Cria uma variavel local para esta operacao.
    const nomeSugerido = this.obterNomeSugerido(data);
    // Cria uma variavel local para esta operacao.
    const categoria = this.formatarCategoria(data);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!endereco && !nomeSugerido && !categoria) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Dados não encontrados para estas coordenadas.');
    }

    // Cria uma variavel local para esta operacao.
    const resultado = { endereco, nomeSugerido, categoria };
    // Atualiza ou consulta estado da pagina.
    this.cache.set(cacheKey, resultado);
    // Devolve o resultado deste bloco.
    return resultado;
  }

  // Define um membro interno desta classe.
  private formatarEndereco(data: NominatimReverseResponse): string {
    // Cria uma variavel local para esta operacao.
    const address = data.address || {};
    // Cria uma variavel local para esta operacao.
    const estrada = address['road'] || address['pedestrian'] || address['footway'] || address['path'];
    // Cria uma variavel local para esta operacao.
    const numero = address['house_number'];
    // Cria uma variavel local para esta operacao.
    const localidade = address['city'] || address['town'] || address['village'] || address['municipality'];
    // Cria uma variavel local para esta operacao.
    const codigoPostal = address['postcode'];
    // Cria uma variavel local para esta operacao.
    const pais = address['country'];

    // Cria uma variavel local para esta operacao.
    const rua = [estrada, numero].filter(Boolean).join(' ');
    // Cria uma variavel local para esta operacao.
    const partes = [rua, localidade, codigoPostal, pais].filter(Boolean);

    // Devolve o resultado deste bloco.
    return partes.length > 0 ? partes.join(', ') : data.display_name || '';
  }

  // Define um membro interno desta classe.
  private converterResultadoPesquisa(data: NominatimSearchResponse): NominatimSearchResult | null {
    // Cria uma variavel local para esta operacao.
    const latitude = Number(data.lat);
    // Cria uma variavel local para esta operacao.
    const longitude = Number(data.lon);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      nome: this.obterNomeSugerido(data) || data.display_name?.split(',')[0] || 'Local',
      // Define um campo ou opcao de configuracao.
      endereco: this.formatarEndereco(data),
      // Define um campo ou opcao de configuracao.
      categoria: this.formatarCategoria(data),
      // Executa uma instrucao necessaria para este fluxo.
      latitude,
      // Executa uma instrucao necessaria para este fluxo.
      longitude
    };
  }

  // Define um membro interno desta classe.
  private formatarCategoria(data: NominatimReverseResponse): string {
    // Cria uma variavel local para esta operacao.
    const partes = [data.category, data.type]
      // Executa uma instrucao necessaria para este fluxo.
      .filter(Boolean)
      // Executa uma instrucao necessaria para este fluxo.
      .map(valor => valor!.replace(/_/g, ' '));

    // Devolve o resultado deste bloco.
    return partes.length > 0 ? partes.join(' / ') : 'local';
  }

  // Define um membro interno desta classe.
  private obterNomeSugerido(data: NominatimReverseResponse): string {
    // Cria uma variavel local para esta operacao.
    const address = data.address || {};

    // Devolve o resultado deste bloco.
    return data.name
      // Executa uma instrucao necessaria para este fluxo.
      || address['amenity']
      // Executa uma instrucao necessaria para este fluxo.
      || address['tourism']
      // Executa uma instrucao necessaria para este fluxo.
      || address['shop']
      // Executa uma instrucao necessaria para este fluxo.
      || address['leisure']
      // Executa uma instrucao necessaria para este fluxo.
      || address['building']
      // Executa uma instrucao necessaria para este fluxo.
      || address['historic']
      // Executa uma instrucao necessaria para este fluxo.
      || address['road']
      // Executa uma instrucao necessaria para este fluxo.
      || address['neighbourhood']
      // Executa uma instrucao necessaria para este fluxo.
      || address['suburb']
      // Executa uma instrucao necessaria para este fluxo.
      || address['city']
      // Executa uma instrucao necessaria para este fluxo.
      || address['town']
      // Executa uma instrucao necessaria para este fluxo.
      || address['village']
      // Executa uma instrucao necessaria para este fluxo.
      || '';
  }

  // Define um membro interno desta classe.
  private async respeitarIntervaloEntrePedidos(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const agora = Date.now();
    // Cria uma variavel local para esta operacao.
    const tempoDesdeUltimoPedido = agora - this.ultimoPedidoEm;
    // Cria uma variavel local para esta operacao.
    const esperaMs = 1100 - tempoDesdeUltimoPedido;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (esperaMs > 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await new Promise(resolve => setTimeout(resolve, esperaMs));
    }

    // Atualiza ou consulta estado da pagina.
    this.ultimoPedidoEm = Date.now();
  }
}
