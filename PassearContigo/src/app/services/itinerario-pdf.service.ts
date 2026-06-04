// app/services/itinerario-pdf.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
import { Dia, POI, Viagem } from '../models/viagem.model';
import { PdfDocumentBase } from './pdf-document.base';
import { PdfGerado } from './pdf-share.service';

// Contrato de dados usado para tipar objetos desta area.
interface ItinerarioPdfData {
  viagem: Viagem;
  dias: Dia[];
}

// Contrato de dados usado para tipar objetos desta area.
interface DiaPdfData {
  viagem: Viagem;
  dia: Dia;
  indexDia: number;
  totalDias: number;
}

@Injectable({
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ItinerarioPdfService extends PdfDocumentBase {
  /**
   * Gera um PDF do itinerário completo e faz download automático
   */
  gerarItinerarioDownload({ viagem, dias }: ItinerarioPdfData): void {
    const pdf = this.criarItinerarioPdf({ viagem, dias });
    this.doc.save(pdf.fileName);
  }

  /**
   * Gera um PDF de um único dia e faz download automático
   */
  gerarDiaDownload({ viagem, dia, indexDia, totalDias }: DiaPdfData): void {
    const pdf = this.criarDiaPdf({ viagem, dia, indexDia, totalDias });
    this.doc.save(pdf.fileName);
  }

  /**
   * Cria um PDF do itinerário completo e retorna objeto com fileName e base64
   */
  criarItinerarioPdf({ viagem, dias }: ItinerarioPdfData): PdfGerado {
    this.iniciarDocumento();

    // Adiciona capa
    this.adicionarCapa(viagem, dias);

    // Adiciona informações gerais
    this.adicionarInformacoesGerais(viagem, dias);

    // Adiciona cada dia
    dias.forEach((dia, index) => this.adicionarDiaItinerario(dia, index, dias.length));

    // Adiciona resumo de POIs
    this.adicionarResumoPois(viagem, dias);

    // Adiciona rodapés
    this.adicionarRodapes('Passear Contigo - Itinerário da Viagem');

    return {
      fileName: this.sanitizarNomeFicheiro(viagem.titulo || 'itinerario-viagem', 'itinerario'),
      base64: this.obterBase64Pdf()
    };
  }

  private adicionarCapa(viagem: Viagem, dias: Dia[]): void {
    this.doc.setTextColor(28, 105, 112);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(28);
    this.doc.text('ITINERÁRIO', this.marginX, this.y);
    this.y += 15;

    this.doc.setTextColor(45, 45, 45);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(22);
    this.escreverTexto(viagem.titulo || 'Viagem', 22, 'bold');

    this.y += 5;
    this.doc.setFontSize(12);
    this.doc.setFont('helvetica', 'normal');

    const localizacao = viagem.local ? `Localização: ${viagem.local}` : '';
    const datas = `Período: ${this.formatarData(viagem.dataInicio, 'Sem data')} - ${this.formatarData(viagem.dataFim, 'Sem data')}`;
    const duracao = dias.length > 0 ? `Duração: ${dias.length} dia${dias.length !== 1 ? 's' : ''}` : '';

    if (localizacao) this.escreverTexto(localizacao, 12);
    if (datas) this.escreverTexto(datas, 12);
    if (duracao) this.escreverTexto(duracao, 12);

    this.y += 10;

    if (viagem.descricao) {
      this.escreverTituloSecao('Descrição');
      this.escreverTexto(viagem.descricao, 11);
    }
  }

  private adicionarInformacoesGerais(viagem: Viagem, dias: Dia[]): void {
    this.garantirEspaco(15);
    this.escreverTituloSecao('Informações da Viagem');

    const totalPois = dias.reduce((total, dia) => total + (dia.pontosInteresse || []).length, 0);

    const informacoes = [
      `Data de início: ${this.formatarData(viagem.dataInicio, 'Sem data')}`,
      `Data de fim: ${this.formatarData(viagem.dataFim, 'Sem data')}`,
      viagem.local ? `Localização: ${viagem.local}` : '',
      `Número de dias: ${dias.length}`,
      `Total de pontos de interesse: ${totalPois}`,
      viagem.status ? `Estado: ${this.formatarStatus(viagem.status)}` : ''
    ].filter(Boolean).join('\n');

    this.escreverTexto(informacoes, 11);
  }

  private adicionarDiaItinerario(dia: Dia, index: number, totalDias: number): void {
    this.novaPagina();

    // Cabeçalho do dia
    this.doc.setTextColor(88, 88, 88);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(9);
    this.doc.text(`Dia ${index + 1} de ${totalDias}`, this.marginX, this.y);
    this.y += 5;

    // Título do dia
    this.doc.setTextColor(28, 105, 112);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.escreverTexto(dia.titulo || `Dia ${index + 1}`, 18, 'bold');

    // Data e local
    this.y += 2;
    this.doc.setFontSize(11);
    this.doc.setTextColor(45, 45, 45);
    this.doc.setFont('helvetica', 'normal');

    const dataLocal = [
      `Data: ${this.formatarData(dia.data, 'Sem data')}`,
      dia.local ? `Local: ${dia.local}` : ''
    ].filter(Boolean).join(' | ');

    if (dataLocal) {
      this.escreverTexto(dataLocal, 11);
      this.y += 3;
    }

    // Descrição do dia
    if (dia.descricao) {
      this.adicionarEspaco(2);
      this.escreverTituloSecao('Descrição do Dia');
      this.escreverTexto(dia.descricao, 10);
    }

    // Observações
    if (dia.observacoes) {
      this.adicionarEspaco(2);
      this.escreverTituloSecao('Observações');
      this.escreverTexto(dia.observacoes, 10);
    }

    // Pontos de interesse
    if (dia.pontosInteresse && dia.pontosInteresse.length > 0) {
      this.adicionarEspaco(3);
      this.adicionarPoisDia(dia);
    }
  }

  private adicionarPoisDia(dia: Dia): void {
    this.escreverTituloSecao(`Pontos de Interesse (${dia.pontosInteresse?.length || 0})`);

    const pois = dia.pontosInteresse || [];
    pois.forEach((poi, index) => {
      this.garantirEspaco(25);

      // Caixa de fundo para o POI
      this.doc.setFillColor(245, 247, 250);
      this.doc.roundedRect(this.marginX, this.y, this.contentWidth, 7, 1.5, 1.5, 'F');

      // Nome do POI
      this.doc.setTextColor(28, 105, 112);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setFontSize(11);
      this.doc.text(`${index + 1}. ${poi.nome || 'Ponto de Interesse'}`, this.marginX + 2, this.y + 4.5);
      this.y += 10;

      // Detalhes do POI
      this.doc.setTextColor(45, 45, 45);
      this.doc.setFont('helvetica', 'normal');

      const detalhes = [
        poi.tipo || poi.categoria ? `Tipo: ${poi.tipo || poi.categoria}` : '',
        poi.endereco ? `Endereço: ${poi.endereco}` : '',
        this.temLocalização(poi) ? `Coordenadas: ${poi.latitude?.toFixed(4)}, ${poi.longitude?.toFixed(4)}` : '',
        poi.horario ? `Horário: ${poi.horario}` : '',
        poi.avaliacao ? `Avaliação: ${poi.avaliacao}/5` : '',
        poi.custo ? `Custo aproximado: ${this.formatarValor(poi.custo)} EUR` : ''
      ].filter(Boolean);

      detalhes.forEach(detalhe => {
        this.escreverTexto(`- ${detalhe}`, 9);
      });

      // Descrição
      if (poi.descricao) {
        this.adicionarEspaco(1);
        this.escreverTexto(`Descrição: ${poi.descricao}`, 9);
      }

      // URL
      if (poi.url) {
        this.adicionarEspaco(1);
        this.escreverTexto(`Site: ${poi.url}`, 9);
      }

      // Nota pessoal
      if (poi.nota) {
        this.adicionarEspaco(1);
        this.escreverTexto(`Nota: ${poi.nota}`, 9);
      }

      this.adicionarEspaco(2);
    });
  }

  private adicionarResumoPois(viagem: Viagem, dias: Dia[]): void {
    this.novaPagina();
    this.escreverTituloSecao('Resumo de Todos os Pontos de Interesse');

    const todosPois: Array<{ poi: POI; dia: number; dataDia: string }> = [];

    dias.forEach((dia, diaIndex) => {
      (dia.pontosInteresse || []).forEach(poi => {
        todosPois.push({
          poi,
          dia: diaIndex + 1,
          dataDia: this.formatarData(dia.data, 'Sem data')
        });
      });
    });

    if (todosPois.length === 0) {
      this.escreverTexto('Nenhum ponto de interesse registado.', 10);
      return;
    }

    // Mapa índice de POIs
    todosPois.forEach((item, index) => {
      const linha = [
        `${index + 1}. ${item.poi.nome}`,
        `(Dia ${item.dia} - ${item.dataDia})`,
        item.poi.tipo ? `[${item.poi.tipo}]` : ''
      ].filter(Boolean).join(' ');

      this.escreverTexto(linha, 9);
    });
  }

  private temLocalização(poi: POI): boolean {
    return !!(poi.latitude && poi.longitude);
  }

  /**
   * Formata o status em texto legível em português
   */
  private formatarStatus(status?: string): string {
    const statusMap: { [key: string]: string } = {
      planejada: 'Planeada',
      'em-andamento': 'Em curso',
      concluida: 'Concluída',
      cancelada: 'Cancelada'
    };

    return statusMap[status || ''] || 'Estado desconhecido';
  }

  /**
   * Sobrescreve a formatação do nome do ficheiro com data ISO
   */
  protected override sanitizarNomeFicheiro(nome: string, tipo: string = 'documento'): string {
    const normalized = nome.trim().replace(/[^a-zA-Z0-9_.-]+/g, '-').toLowerCase();
    const baseFileName = normalized || tipo;
    return `${baseFileName}-${new Date().toISOString().split('T')[0]}.pdf`;
  }

  /**
   * Cria um PDF de um único dia e retorna objeto com fileName e base64
   */
  criarDiaPdf({ viagem, dia, indexDia, totalDias }: DiaPdfData): PdfGerado {
    this.iniciarDocumento();

    // Cabeçalho
    this.doc.setTextColor(28, 105, 112);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(24);
    this.doc.text('DIA DO ITINERÁRIO', this.marginX, this.y);
    this.y += 10;

    // Informações da viagem
    this.doc.setTextColor(45, 45, 45);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setFontSize(10);
    const infoViagem = `${viagem.titulo || 'Viagem'} - Dia ${indexDia} de ${totalDias}`;
    this.escreverTexto(infoViagem, 10);
    this.y += 3;

    // Título do dia
    this.doc.setFont('helvetica', 'bold');
    this.doc.setFontSize(18);
    this.doc.setTextColor(28, 105, 112);
    this.escreverTexto(dia.titulo || `Dia ${indexDia}`, 18, 'bold');

    // Data e local
    this.y += 2;
    const dataLocal = [
      `Data: ${this.formatarData(dia.data, 'Sem data')}`,
      dia.local ? `Local: ${dia.local}` : ''
    ].filter(Boolean).join(' | ');

    if (dataLocal) {
      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(11);
      this.doc.setTextColor(45, 45, 45);
      this.escreverTexto(dataLocal, 11);
      this.y += 3;
    }

    // Descrição
    if (dia.descricao) {
      this.adicionarEspaco(3);
      this.escreverTituloSecao('Descrição do Dia');
      this.escreverTexto(dia.descricao, 10);
    }

    // Observações
    if (dia.observacoes) {
      this.adicionarEspaco(3);
      this.escreverTituloSecao('Observações');
      this.escreverTexto(dia.observacoes, 10);
    }

    // Pontos de interesse
    if (dia.pontosInteresse && dia.pontosInteresse.length > 0) {
      this.adicionarEspaco(3);
      this.adicionarPoisDia(dia);
    } else {
      this.adicionarEspaco(3);
      this.escreverTituloSecao('Pontos de Interesse');
      this.escreverTexto('Nenhum ponto de interesse registado para este dia.', 10);
    }

    // Rodapés
    this.adicionarRodapes('Passear Contigo - Dia do Itinerário');

    const nomeDia = (dia.titulo || `Dia ${indexDia}`).replace(/[^a-zA-Z0-9_.-]+/g, '-').toLowerCase();
    return {
      fileName: `${nomeDia}-${new Date().toISOString().split('T')[0]}.pdf`,
      base64: this.obterBase64Pdf()
    };
  }
}

