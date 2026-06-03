import { Injectable } from '@angular/core';
import { Custo, Dia, POI, Viagem } from '../models/viagem.model';
import { PdfDocumentBase } from './pdf-document.base';
import { PdfGerado } from './pdf-share.service';

interface DiarioPdfData {
  viagem: Viagem;
  dias: Dia[];
  custos: Custo[];
}

@Injectable({
  providedIn: 'root'
})
export class DiarioPdfService extends PdfDocumentBase {
  gerarDiarioCompleto({ viagem, dias, custos }: DiarioPdfData): void {
    const pdf = this.criarDiarioCompleto({ viagem, dias, custos });
    this.doc.save(pdf.fileName);
  }

  criarDiarioCompleto({ viagem, dias, custos }: DiarioPdfData): PdfGerado {
    this.iniciarDocumento();

    this.adicionarCapa(viagem, dias, custos);
    dias.forEach((dia, index) => this.adicionarDia(dia, index, custos));
    this.adicionarRodapes('Passear Contigo - Diario do Viajante');

    return {
      fileName: `${this.sanitizarNomeFicheiro(viagem.titulo || 'diario-viagem', 'diario-viagem')}.pdf`,
      base64: this.obterBase64Pdf()
    };
  }

  private adicionarCapa(viagem: Viagem, dias: Dia[], custos: Custo[]): void {
    this.doc.setTextColor(35, 35, 35);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.escreverTexto(viagem.titulo || 'Diário da viagem', 22, 'bold');

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.escreverTexto([
      viagem.local ? `Local: ${viagem.local}` : '',
      `Período: ${this.formatarData(viagem.dataInicio, 'Sem data')} - ${this.formatarData(viagem.dataFim, 'Sem data')}`,
      viagem.status ? `Estado: ${this.formatarStatus(viagem.status)}` : '',
      `Dias no diário: ${dias.length}`,
      `POIs registados: ${dias.reduce((total, dia) => total + (dia.pontosInteresse || []).length, 0)}`,
      `Custo total: ${this.formatarValor(this.obterCustoTotal(dias, custos))} EUR`
    ].filter(Boolean).join('\n'), 11);

    if (viagem.descricao) {
      this.adicionarEspaco(5);
      this.escreverTituloSecao('Descrição');
      this.escreverTexto(viagem.descricao, 11);
    }

    this.adicionarEspaco(6);
    this.escreverTituloSecao('Resumo por dia');

    dias.forEach((dia, index) => {
      const linha = [
        `Dia ${index + 1}`,
        this.formatarData(dia.data, 'Sem data'),
        dia.titulo || 'Sem título',
        `${(dia.pontosInteresse || []).length} POIs`,
        `${this.formatarValor(this.obterCustoDia(dia, custos))} EUR`
      ].join(' | ');

      this.escreverTexto(linha, 10);
    });
  }

  private adicionarDia(dia: Dia, index: number, custos: Custo[]): void {
    this.novaPagina();
    this.escreverTexto(`Dia ${index + 1}`, 10, 'bold', [88, 88, 88]);
    this.escreverTexto(dia.titulo || 'Dia da viagem', 18, 'bold');
    this.escreverTexto([
      `Data: ${this.formatarData(dia.data, 'Sem data')}`,
      dia.local ? `Local: ${dia.local}` : '',
      `Custo do dia: ${this.formatarValor(this.obterCustoDia(dia, custos))} EUR`
    ].filter(Boolean).join('\n'), 10);

    if (dia.descricao || dia.observacoes) {
      this.adicionarEspaco(4);
      this.escreverTituloSecao('Entrada do dia');
      if (dia.descricao) {
        this.escreverTexto(dia.descricao, 11);
      }
      if (dia.observacoes) {
        this.escreverTexto(`Observacoes: ${dia.observacoes}`, 10);
      }
    }

    this.adicionarPois(dia, custos);
    this.adicionarCustosDia(dia, custos);
  }

  private adicionarPois(dia: Dia, custos: Custo[]): void {
    this.adicionarEspaco(5);
    this.escreverTituloSecao('Pontos de interesse');

    const pois = dia.pontosInteresse || [];
    if (pois.length === 0) {
      this.escreverTexto('Sem pontos de interesse registados.', 10);
      return;
    }

    pois.forEach((poi, index) => {
      this.garantirEspaco(34);
      this.doc.setFillColor(245, 247, 250);
      this.doc.roundedRect(this.marginX, this.y, this.contentWidth, 8, 1.5, 1.5, 'F');
      this.doc.setTextColor(35, 35, 35);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.text(`${index + 1}. ${poi.nome || 'Ponto de interesse'}`, this.marginX + 3, this.y + 5.5);
      this.y += 11;

      const detalhes = [
        poi.tipo || poi.categoria ? `Tipo: ${poi.tipo || poi.categoria}` : '',
        poi.endereco ? `Endereço: ${poi.endereco}` : '',
        poi.horario ? `Horário: ${poi.horario}` : '',
        poi.avaliacao ? `Avaliação: ${poi.avaliacao}/5` : '',
        poi.url ? `Site: ${poi.url}` : '',
        this.temLocalização(poi) ? `Localização: ${poi.latitude}, ${poi.longitude}` : '',
        poi.descricao ? `Descrição: ${poi.descricao}` : '',
        poi.nota ? `Nota: ${poi.nota}` : ''
      ].filter(Boolean).join('\n');

      if (detalhes) {
        this.escreverTexto(detalhes, 10);
      }

      const custosPoi = this.obterCustosPoi(poi, custos);
      const custoDireto = Number(poi.custo) || 0;
      const totalPoi = custoDireto + custosPoi.reduce((total, custo) => total + (Number(custo.valor) || 0), 0);
      this.escreverTexto(`Custo total do POI: ${this.formatarValor(totalPoi)} EUR`, 10, 'bold');

      custosPoi.forEach(custo => {
        this.escreverTexto(`- ${custo.descricao}: ${this.formatarValor(custo.valor)} ${custo.moeda || 'EUR'}`, 9);
      });

      this.adicionarEspaco(3);
    });
  }

  private adicionarCustosDia(dia: Dia, custos: Custo[]): void {
    this.adicionarEspaco(3);
    this.escreverTituloSecao('Custos do dia');

    const custosDia = this.obterCustosDia(dia, custos).filter(custo => !custo.poiId);
    if (custosDia.length === 0) {
      this.escreverTexto('Sem custos soltos registados neste dia.', 10);
      return;
    }

    custosDia.forEach(custo => {
      const detalhe = [
        custo.descricao || 'Custo',
        custo.categoria ? `Categoria: ${custo.categoria}` : '',
        `Valor: ${this.formatarValor(custo.valor)} ${custo.moeda || 'EUR'}`,
        custo.data ? `Data: ${this.formatarData(custo.data)}` : ''
      ].filter(Boolean).join(' | ');

      this.escreverTexto(`- ${detalhe}`, 10);
    });
  }

  private obterCustoTotal(dias: Dia[], custos: Custo[]): number {
    return dias.reduce((total, dia) => total + this.obterCustoDia(dia, custos), 0);
  }

  private obterCustoDia(dia: Dia, custos: Custo[]): number {
    const pois = dia.pontosInteresse || [];
    const poiIds = new Set(pois.map(poi => poi.id));
    const custosDia = [
      ...custos.filter(custo => custo.diaId === dia.id || (custo.poiId ? poiIds.has(custo.poiId) : false)),
      ...(dia.custos || [])
    ];
    const custosSemDuplicados = this.removerCustosDuplicados(custosDia);
    const custoPoisDireto = pois.reduce((total, poi) => total + (Number(poi.custo) || 0), 0);

    return custoPoisDireto + custosSemDuplicados.reduce((total, custo) => total + (Number(custo.valor) || 0), 0);
  }

  private obterCustosDia(dia: Dia, custos: Custo[]): Custo[] {
    const poiIds = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    return this.removerCustosDuplicados([
      ...custos.filter(custo => custo.diaId === dia.id || (custo.poiId ? poiIds.has(custo.poiId) : false)),
      ...(dia.custos || [])
    ]);
  }

  private obterCustosPoi(poi: POI, custos: Custo[]): Custo[] {
    return custos.filter(custo => custo.poiId === poi.id);
  }

  private removerCustosDuplicados(custos: Custo[]): Custo[] {
    const ids = new Set<string>();

    return custos.filter(custo => {
      if (!custo.id) {
        return true;
      }

      if (ids.has(custo.id)) {
        return false;
      }

      ids.add(custo.id);
      return true;
    });
  }

  private formatarStatus(status: string): string {
    const labels: Record<string, string> = {
      planejada: 'Planeada',
      'em-andamento': 'Em curso',
      concluida: 'Concluída',
      cancelada: 'Cancelada'
    };

    return labels[status] || status;
  }

  private temLocalização(poi: POI): boolean {
    return typeof poi.latitude === 'number' && typeof poi.longitude === 'number';
  }

}
