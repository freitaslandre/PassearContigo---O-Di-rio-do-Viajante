// app/services/itinerario-pdf.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Dia, POI, Viagem } from '../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { PdfDocumentBase } from './pdf-document.base';
// Importa dependencias usadas neste ficheiro.
import { PdfGerado } from './pdf-share.service';

// Contrato de dados usado para tipar objetos desta area.
interface ItinerarioPdfData {
  // Define um campo ou opcao de configuracao.
  viagem: Viagem;
  // Define um campo ou opcao de configuracao.
  dias: Dia[];
}

// Contrato de dados usado para tipar objetos desta area.
interface DiaPdfData {
  // Define um campo ou opcao de configuracao.
  viagem: Viagem;
  // Define um campo ou opcao de configuracao.
  dia: Dia;
  // Define um campo ou opcao de configuracao.
  indexDia: number;
  // Define um campo ou opcao de configuracao.
  totalDias: number;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ItinerarioPdfService extends PdfDocumentBase {
  /**
   * Gera um PDF do itinerário completo e faz download automático
   */
  gerarItinerarioDownload({ viagem, dias }: ItinerarioPdfData): void {
    // Cria uma variavel local para esta operacao.
    const pdf = this.criarItinerarioPdf({ viagem, dias });
    // Atualiza ou consulta estado da pagina.
    this.doc.save(pdf.fileName);
  }

  /**
   * Gera um PDF de um único dia e faz download automático
   */
  gerarDiaDownload({ viagem, dia, indexDia, totalDias }: DiaPdfData): void {
    // Cria uma variavel local para esta operacao.
    const pdf = this.criarDiaPdf({ viagem, dia, indexDia, totalDias });
    // Atualiza ou consulta estado da pagina.
    this.doc.save(pdf.fileName);
  }

  /**
   * Cria um PDF do itinerário completo e retorna objeto com fileName e base64
   */
  criarItinerarioPdf({ viagem, dias }: ItinerarioPdfData): PdfGerado {
    // Atualiza ou consulta estado da pagina.
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

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      fileName: this.sanitizarNomeFicheiro(viagem.titulo || 'itinerario-viagem', 'itinerario'),
      // Define um campo ou opcao de configuracao.
      base64: this.obterBase64Pdf()
    };
  }

  // Define um membro interno desta classe.
  private adicionarCapa(viagem: Viagem, dias: Dia[]): void {
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(28, 105, 112);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(28);
    // Atualiza ou consulta estado da pagina.
    this.doc.text('ITINERÁRIO', this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.y += 15;

    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(45, 45, 45);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(22);
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(viagem.titulo || 'Viagem', 22, 'bold');

    // Atualiza ou consulta estado da pagina.
    this.y += 5;
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(12);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'normal');

    // Cria uma variavel local para esta operacao.
    const localizacao = viagem.local ? `Localização: ${viagem.local}` : '';
    // Cria uma variavel local para esta operacao.
    const datas = `Período: ${this.formatarData(viagem.dataInicio, 'Sem data')} - ${this.formatarData(viagem.dataFim, 'Sem data')}`;
    // Cria uma variavel local para esta operacao.
    const duracao = dias.length > 0 ? `Duração: ${dias.length} dia${dias.length !== 1 ? 's' : ''}` : '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (localizacao) this.escreverTexto(localizacao, 12);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (datas) this.escreverTexto(datas, 12);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (duracao) this.escreverTexto(duracao, 12);

    // Atualiza ou consulta estado da pagina.
    this.y += 10;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.descricao) {
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Descrição');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(viagem.descricao, 11);
    }
  }

  // Define um membro interno desta classe.
  private adicionarInformacoesGerais(viagem: Viagem, dias: Dia[]): void {
    // Atualiza ou consulta estado da pagina.
    this.garantirEspaco(15);
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Informações da Viagem');

    // Cria uma variavel local para esta operacao.
    const totalPois = dias.reduce((total, dia) => total + (dia.pontosInteresse || []).length, 0);

    // Cria uma variavel local para esta operacao.
    const informacoes = [
      // Executa uma instrucao necessaria para este fluxo.
      `Data de início: ${this.formatarData(viagem.dataInicio, 'Sem data')}`,
      // Executa uma instrucao necessaria para este fluxo.
      `Data de fim: ${this.formatarData(viagem.dataFim, 'Sem data')}`,
      // Executa uma instrucao necessaria para este fluxo.
      viagem.local ? `Localização: ${viagem.local}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      `Número de dias: ${dias.length}`,
      // Executa uma instrucao necessaria para este fluxo.
      `Total de pontos de interesse: ${totalPois}`,
      // Executa uma instrucao necessaria para este fluxo.
      viagem.status ? `Estado: ${this.formatarStatus(viagem.status)}` : ''
    // Executa uma instrucao necessaria para este fluxo.
    ].filter(Boolean).join('\n');

    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(informacoes, 11);
  }

  // Define um membro interno desta classe.
  private adicionarDiaItinerario(dia: Dia, index: number, totalDias: number): void {
    // Atualiza ou consulta estado da pagina.
    this.novaPagina();

    // Cabeçalho do dia
    this.doc.setTextColor(88, 88, 88);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'normal');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(9);
    // Atualiza ou consulta estado da pagina.
    this.doc.text(`Dia ${index + 1} de ${totalDias}`, this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.y += 5;

    // Título do dia
    this.doc.setTextColor(28, 105, 112);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(18);
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(dia.titulo || `Dia ${index + 1}`, 18, 'bold');

    // Data e local
    this.y += 2;
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(11);
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(45, 45, 45);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'normal');

    // Cria uma variavel local para esta operacao.
    const dataLocal = [
      // Executa uma instrucao necessaria para este fluxo.
      `Data: ${this.formatarData(dia.data, 'Sem data')}`,
      // Executa uma instrucao necessaria para este fluxo.
      dia.local ? `Local: ${dia.local}` : ''
    // Executa uma instrucao necessaria para este fluxo.
    ].filter(Boolean).join(' | ');

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (dataLocal) {
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(dataLocal, 11);
      // Atualiza ou consulta estado da pagina.
      this.y += 3;
    }

    // Descrição do dia
    if (dia.descricao) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(2);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Descrição do Dia');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(dia.descricao, 10);
    }

    // Observações
    if (dia.observacoes) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(2);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Observações');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(dia.observacoes, 10);
    }

    // Pontos de interesse
    if (dia.pontosInteresse && dia.pontosInteresse.length > 0) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
      // Atualiza ou consulta estado da pagina.
      this.adicionarPoisDia(dia);
    }
  }

  // Define um membro interno desta classe.
  private adicionarPoisDia(dia: Dia): void {
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao(`Pontos de Interesse (${dia.pontosInteresse?.length || 0})`);

    // Cria uma variavel local para esta operacao.
    const pois = dia.pontosInteresse || [];
    // Executa uma instrucao necessaria para este fluxo.
    pois.forEach((poi, index) => {
      // Atualiza ou consulta estado da pagina.
      this.garantirEspaco(25);

      // Caixa de fundo para o POI
      this.doc.setFillColor(245, 247, 250);
      // Atualiza ou consulta estado da pagina.
      this.doc.roundedRect(this.marginX, this.y, this.contentWidth, 7, 1.5, 1.5, 'F');

      // Nome do POI
      this.doc.setTextColor(28, 105, 112);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'bold');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFontSize(11);
      // Atualiza ou consulta estado da pagina.
      this.doc.text(`${index + 1}. ${poi.nome || 'Ponto de Interesse'}`, this.marginX + 2, this.y + 4.5);
      // Atualiza ou consulta estado da pagina.
      this.y += 10;

      // Detalhes do POI
      this.doc.setTextColor(45, 45, 45);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'normal');

      // Cria uma variavel local para esta operacao.
      const detalhes = [
        // Executa uma instrucao necessaria para este fluxo.
        poi.tipo || poi.categoria ? `Tipo: ${poi.tipo || poi.categoria}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.endereco ? `Endereço: ${poi.endereco}` : '',
        // Atualiza ou consulta estado da pagina.
        this.temLocalização(poi) ? `Coordenadas: ${poi.latitude?.toFixed(4)}, ${poi.longitude?.toFixed(4)}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.horario ? `Horário: ${poi.horario}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.avaliacao ? `Avaliação: ${poi.avaliacao}/5` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.custo ? `Custo aproximado: ${this.formatarValor(poi.custo)} EUR` : ''
      // Executa uma instrucao necessaria para este fluxo.
      ].filter(Boolean);

      // Executa uma instrucao necessaria para este fluxo.
      detalhes.forEach(detalhe => {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`- ${detalhe}`, 9);
      });

      // Descrição
      if (poi.descricao) {
        // Atualiza ou consulta estado da pagina.
        this.adicionarEspaco(1);
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`Descrição: ${poi.descricao}`, 9);
      }

      // URL
      if (poi.url) {
        // Atualiza ou consulta estado da pagina.
        this.adicionarEspaco(1);
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`Site: ${poi.url}`, 9);
      }

      // Nota pessoal
      if (poi.nota) {
        // Atualiza ou consulta estado da pagina.
        this.adicionarEspaco(1);
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`Nota: ${poi.nota}`, 9);
      }

      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(2);
    });
  }

  // Define um membro interno desta classe.
  private adicionarResumoPois(viagem: Viagem, dias: Dia[]): void {
    // Atualiza ou consulta estado da pagina.
    this.novaPagina();
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Resumo de Todos os Pontos de Interesse');

    // Cria uma variavel local para esta operacao.
    const todosPois: Array<{ poi: POI; dia: number; dataDia: string }> = [];

    // Executa uma instrucao necessaria para este fluxo.
    dias.forEach((dia, diaIndex) => {
      // Executa uma instrucao necessaria para este fluxo.
      (dia.pontosInteresse || []).forEach(poi => {
        // Executa uma instrucao necessaria para este fluxo.
        todosPois.push({
          // Executa uma instrucao necessaria para este fluxo.
          poi,
          // Define um campo ou opcao de configuracao.
          dia: diaIndex + 1,
          // Define um campo ou opcao de configuracao.
          dataDia: this.formatarData(dia.data, 'Sem data')
        });
      });
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (todosPois.length === 0) {
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto('Nenhum ponto de interesse registado.', 10);
      // Devolve o resultado deste bloco.
      return;
    }

    // Mapa índice de POIs
    todosPois.forEach((item, index) => {
      // Cria uma variavel local para esta operacao.
      const linha = [
        // Executa uma instrucao necessaria para este fluxo.
        `${index + 1}. ${item.poi.nome}`,
        // Executa uma instrucao necessaria para este fluxo.
        `(Dia ${item.dia} - ${item.dataDia})`,
        // Executa uma instrucao necessaria para este fluxo.
        item.poi.tipo ? `[${item.poi.tipo}]` : ''
      // Executa uma instrucao necessaria para este fluxo.
      ].filter(Boolean).join(' ');

      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(linha, 9);
    });
  }

  // Define um membro interno desta classe.
  private temLocalização(poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return !!(poi.latitude && poi.longitude);
  }

  /**
   * Formata o status em texto legível em português
   */
  private formatarStatus(status?: string): string {
    // Cria uma variavel local para esta operacao.
    const statusMap: { [key: string]: string } = {
      // Define um campo ou opcao de configuracao.
      planejada: 'Planeada',
      // Executa uma instrucao necessaria para este fluxo.
      'em-andamento': 'Em curso',
      // Define um campo ou opcao de configuracao.
      concluida: 'Concluída',
      // Define um campo ou opcao de configuracao.
      cancelada: 'Cancelada'
    };

    // Devolve o resultado deste bloco.
    return statusMap[status || ''] || 'Estado desconhecido';
  }

  /**
   * Sobrescreve a formatação do nome do ficheiro com data ISO
   */
  protected override sanitizarNomeFicheiro(nome: string, tipo: string = 'documento'): string {
    // Cria uma variavel local para esta operacao.
    const normalized = nome.trim().replace(/[^a-zA-Z0-9_.-]+/g, '-').toLowerCase();
    // Cria uma variavel local para esta operacao.
    const baseFileName = normalized || tipo;
    // Devolve o resultado deste bloco.
    return `${baseFileName}-${new Date().toISOString().split('T')[0]}.pdf`;
  }

  /**
   * Cria um PDF de um único dia e retorna objeto com fileName e base64
   */
  criarDiaPdf({ viagem, dia, indexDia, totalDias }: DiaPdfData): PdfGerado {
    // Atualiza ou consulta estado da pagina.
    this.iniciarDocumento();

    // Cabeçalho
    this.doc.setTextColor(28, 105, 112);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(24);
    // Atualiza ou consulta estado da pagina.
    this.doc.text('DIA DO ITINERÁRIO', this.marginX, this.y);
    // Atualiza ou consulta estado da pagina.
    this.y += 10;

    // Informações da viagem
    this.doc.setTextColor(45, 45, 45);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'normal');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(10);
    // Cria uma variavel local para esta operacao.
    const infoViagem = `${viagem.titulo || 'Viagem'} - Dia ${indexDia} de ${totalDias}`;
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(infoViagem, 10);
    // Atualiza ou consulta estado da pagina.
    this.y += 3;

    // Título do dia
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(18);
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(28, 105, 112);
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(dia.titulo || `Dia ${indexDia}`, 18, 'bold');

    // Data e local
    this.y += 2;
    // Cria uma variavel local para esta operacao.
    const dataLocal = [
      // Executa uma instrucao necessaria para este fluxo.
      `Data: ${this.formatarData(dia.data, 'Sem data')}`,
      // Executa uma instrucao necessaria para este fluxo.
      dia.local ? `Local: ${dia.local}` : ''
    // Executa uma instrucao necessaria para este fluxo.
    ].filter(Boolean).join(' | ');

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (dataLocal) {
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'normal');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFontSize(11);
      // Atualiza ou consulta estado da pagina.
      this.doc.setTextColor(45, 45, 45);
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(dataLocal, 11);
      // Atualiza ou consulta estado da pagina.
      this.y += 3;
    }

    // Descrição
    if (dia.descricao) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Descrição do Dia');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(dia.descricao, 10);
    }

    // Observações
    if (dia.observacoes) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Observações');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(dia.observacoes, 10);
    }

    // Pontos de interesse
    if (dia.pontosInteresse && dia.pontosInteresse.length > 0) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
      // Atualiza ou consulta estado da pagina.
      this.adicionarPoisDia(dia);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Pontos de Interesse');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto('Nenhum ponto de interesse registado para este dia.', 10);
    }

    // Rodapés
    this.adicionarRodapes('Passear Contigo - Dia do Itinerário');

    // Cria uma variavel local para esta operacao.
    const nomeDia = (dia.titulo || `Dia ${indexDia}`).replace(/[^a-zA-Z0-9_.-]+/g, '-').toLowerCase();
    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      fileName: `${nomeDia}-${new Date().toISOString().split('T')[0]}.pdf`,
      // Define um campo ou opcao de configuracao.
      base64: this.obterBase64Pdf()
    };
  }
}

