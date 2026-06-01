import { Component } from '@angular/core';
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';
import { GeolocationService } from '../../services/geolocation.service';

interface ResultadoDescobrir extends NominatimSearchResult {
  distanciaKm?: number;
  distanciaTexto: string;
}

/**
 * DescubrirPage - Página de Descobrir
 * Exibe viagens recomendadas e exploração de locais
 */
@Component({
  selector: 'app-descobrir',
  templateUrl: 'descobrir.page.html',
  styleUrls: ['descobrir.page.scss'],
  standalone: false,
})
export class DescubrirPage {
  termoPesquisa = '';
  resultados: ResultadoDescobrir[] = [];
  carregando = false;
  pesquisou = false;
  erro = '';

  private pesquisaAtual = 0;
  private localizacaoAtual?: { latitude: number; longitude: number };

  constructor(
    private nominatimService: NominatimService,
    private geolocationService: GeolocationService
  ) {}

  async pesquisar(event?: CustomEvent) {
    const valor = (event?.detail as { value?: string } | undefined)?.value;

    if (typeof valor === 'string') {
      this.termoPesquisa = valor;
    }

    const termo = this.termoPesquisa.trim();
    const pesquisaId = ++this.pesquisaAtual;
    this.erro = '';

    if (termo.length < 2) {
      this.resultados = [];
      this.pesquisou = false;
      this.carregando = false;
      return;
    }

    this.carregando = true;
    this.pesquisou = true;

    try {
      await this.carregarLocalizacaoAtual();
      const resultados = await this.nominatimService.pesquisarLocais(termo);

      if (pesquisaId !== this.pesquisaAtual) {
        return;
      }

      this.resultados = resultados
        .map(local => this.adicionarDistancia(local))
        .sort((a, b) => (a.distanciaKm ?? Number.MAX_SAFE_INTEGER) - (b.distanciaKm ?? Number.MAX_SAFE_INTEGER));
    } catch (error: any) {
      if (pesquisaId !== this.pesquisaAtual) {
        return;
      }

      this.resultados = [];
      this.erro = error?.message || 'Erro ao pesquisar locais.';
    } finally {
      if (pesquisaId === this.pesquisaAtual) {
        this.carregando = false;
      }
    }
  }

  limparPesquisa() {
    this.termoPesquisa = '';
    this.resultados = [];
    this.pesquisou = false;
    this.erro = '';
    this.carregando = false;
    this.pesquisaAtual++;
  }

  abrirMapa(local: NominatimSearchResult) {
    const url = `https://www.openstreetmap.org/?mlat=${local.latitude}&mlon=${local.longitude}#map=16/${local.latitude}/${local.longitude}`;
    window.open(url, '_blank');
  }

  private async carregarLocalizacaoAtual() {
    if (this.localizacaoAtual) {
      return;
    }

    const posicao = await this.geolocationService.getCurrentPosition();

    if (posicao) {
      this.localizacaoAtual = {
        latitude: posicao.coords.latitude,
        longitude: posicao.coords.longitude
      };
    }
  }

  private adicionarDistancia(local: NominatimSearchResult): ResultadoDescobrir {
    if (!this.localizacaoAtual) {
      return {
        ...local,
        distanciaTexto: 'Distancia indisponivel'
      };
    }

    const distanciaKm = this.geolocationService.calculateDistance(
      this.localizacaoAtual.latitude,
      this.localizacaoAtual.longitude,
      local.latitude,
      local.longitude
    );

    return {
      ...local,
      distanciaKm,
      distanciaTexto: this.formatarDistancia(distanciaKm)
    };
  }

  private formatarDistancia(distanciaKm: number): string {
    if (distanciaKm < 1) {
      return `${Math.round(distanciaKm * 1000)} m`;
    }

    return `${distanciaKm.toFixed(1).replace('.', ',')} km`;
  }
}
