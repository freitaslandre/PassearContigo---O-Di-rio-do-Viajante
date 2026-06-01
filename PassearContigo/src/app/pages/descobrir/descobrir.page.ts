import { Component } from '@angular/core';
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';

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
  resultados: NominatimSearchResult[] = [];
  carregando = false;
  pesquisou = false;
  erro = '';

  private pesquisaAtual = 0;

  constructor(private nominatimService: NominatimService) {}

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
      const resultados = await this.nominatimService.pesquisarLocais(termo);

      if (pesquisaId !== this.pesquisaAtual) {
        return;
      }

      this.resultados = resultados;
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

}
