// app/services/diario-pdf.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Custo, Dia, POI, Viagem } from '../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { PdfDocumentBase } from './pdf-document.base';
// Importa dependencias usadas neste ficheiro.
import { PdfGerado } from './pdf-share.service';

// Contrato de dados usado para tipar objetos desta area.
interface DiarioPdfData {
  // Define um campo ou opcao de configuracao.
  viagem: Viagem;
  // Define um campo ou opcao de configuracao.
  dias: Dia[];
  // Define um campo ou opcao de configuracao.
  custos: Custo[];
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiarioPdfService extends PdfDocumentBase {
  // Define um metodo chamado pela pagina ou por outros metodos.
  gerarDiarioCompleto({ viagem, dias, custos }: DiarioPdfData): void {
    // Cria uma variavel local para esta operacao.
    const pdf = this.criarDiarioCompleto({ viagem, dias, custos });
    // Atualiza ou consulta estado da pagina.
    this.doc.save(pdf.fileName);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  criarDiarioCompleto({ viagem, dias, custos }: DiarioPdfData): PdfGerado {
    // Atualiza ou consulta estado da pagina.
    this.iniciarDocumento();

    // Atualiza ou consulta estado da pagina.
    this.adicionarCapa(viagem, dias, custos);
    // Executa uma instrucao necessaria para este fluxo.
    dias.forEach((dia, index) => this.adicionarDia(dia, index, custos));
    // Atualiza ou consulta estado da pagina.
    this.adicionarRodapes('Passear Contigo - Diario do Viajante');

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      fileName: `${this.sanitizarNomeFicheiro(viagem.titulo || 'diario-viagem', 'diario-viagem')}.pdf`,
      // Define um campo ou opcao de configuracao.
      base64: this.obterBase64Pdf()
    };
  }

  // Define um membro interno desta classe.
  private adicionarCapa(viagem: Viagem, dias: Dia[], custos: Custo[]): void {
    // Atualiza ou consulta estado da pagina.
    this.doc.setTextColor(35, 35, 35);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'bold');
    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(22);
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(viagem.titulo || 'Diário da viagem', 22, 'bold');

    // Atualiza ou consulta estado da pagina.
    this.doc.setFontSize(11);
    // Atualiza ou consulta estado da pagina.
    this.doc.setFont('helvetica', 'normal');
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto([
      // Executa uma instrucao necessaria para este fluxo.
      viagem.local ? `Local: ${viagem.local}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      `Período: ${this.formatarData(viagem.dataInicio, 'Sem data')} - ${this.formatarData(viagem.dataFim, 'Sem data')}`,
      // Executa uma instrucao necessaria para este fluxo.
      viagem.status ? `Estado: ${this.formatarStatus(viagem.status)}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      `Dias no diário: ${dias.length}`,
      // Executa uma instrucao necessaria para este fluxo.
      `POIs registados: ${dias.reduce((total, dia) => total + (dia.pontosInteresse || []).length, 0)}`,
      // Executa uma instrucao necessaria para este fluxo.
      `Custo total: ${this.formatarValor(this.obterCustoTotal(dias, custos))} EUR`
    // Executa uma instrucao necessaria para este fluxo.
    ].filter(Boolean).join('\n'), 11);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.descricao) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(5);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Descrição');
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(viagem.descricao, 11);
    }

    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(6);
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Resumo por dia');

    // Executa uma instrucao necessaria para este fluxo.
    dias.forEach((dia, index) => {
      // Cria uma variavel local para esta operacao.
      const linha = [
        // Executa uma instrucao necessaria para este fluxo.
        `Dia ${index + 1}`,
        // Atualiza ou consulta estado da pagina.
        this.formatarData(dia.data, 'Sem data'),
        // Executa uma instrucao necessaria para este fluxo.
        dia.titulo || 'Sem título',
        // Executa uma instrucao necessaria para este fluxo.
        `${(dia.pontosInteresse || []).length} POIs`,
        // Executa uma instrucao necessaria para este fluxo.
        `${this.formatarValor(this.obterCustoDia(dia, custos))} EUR`
      // Executa uma instrucao necessaria para este fluxo.
      ].join(' | ');

      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(linha, 10);
    });
  }

  // Define um membro interno desta classe.
  private adicionarDia(dia: Dia, index: number, custos: Custo[]): void {
    // Atualiza ou consulta estado da pagina.
    this.novaPagina();
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(`Dia ${index + 1}`, 10, 'bold', [88, 88, 88]);
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto(dia.titulo || 'Dia da viagem', 18, 'bold');
    // Atualiza ou consulta estado da pagina.
    this.escreverTexto([
      // Executa uma instrucao necessaria para este fluxo.
      `Data: ${this.formatarData(dia.data, 'Sem data')}`,
      // Executa uma instrucao necessaria para este fluxo.
      dia.local ? `Local: ${dia.local}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      `Custo do dia: ${this.formatarValor(this.obterCustoDia(dia, custos))} EUR`
    // Executa uma instrucao necessaria para este fluxo.
    ].filter(Boolean).join('\n'), 10);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (dia.descricao || dia.observacoes) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(4);
      // Atualiza ou consulta estado da pagina.
      this.escreverTituloSecao('Entrada do dia');
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (dia.descricao) {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(dia.descricao, 11);
      }
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (dia.observacoes) {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`Observacoes: ${dia.observacoes}`, 10);
      }
    }

    // Atualiza ou consulta estado da pagina.
    this.adicionarPois(dia, custos);
    // Atualiza ou consulta estado da pagina.
    this.adicionarCustosDia(dia, custos);
  }

  // Define um membro interno desta classe.
  private adicionarPois(dia: Dia, custos: Custo[]): void {
    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(5);
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Pontos de interesse');

    // Cria uma variavel local para esta operacao.
    const pois = dia.pontosInteresse || [];
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (pois.length === 0) {
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto('Sem pontos de interesse registados.', 10);
      // Devolve o resultado deste bloco.
      return;
    }

    // Executa uma instrucao necessaria para este fluxo.
    pois.forEach((poi, index) => {
      // Atualiza ou consulta estado da pagina.
      this.garantirEspaco(34);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFillColor(245, 247, 250);
      // Atualiza ou consulta estado da pagina.
      this.doc.roundedRect(this.marginX, this.y, this.contentWidth, 8, 1.5, 1.5, 'F');
      // Atualiza ou consulta estado da pagina.
      this.doc.setTextColor(35, 35, 35);
      // Atualiza ou consulta estado da pagina.
      this.doc.setFont('helvetica', 'bold');
      // Atualiza ou consulta estado da pagina.
      this.doc.setFontSize(11);
      // Atualiza ou consulta estado da pagina.
      this.doc.text(`${index + 1}. ${poi.nome || 'Ponto de interesse'}`, this.marginX + 3, this.y + 5.5);
      // Atualiza ou consulta estado da pagina.
      this.y += 11;

      // Cria uma variavel local para esta operacao.
      const detalhes = [
        // Executa uma instrucao necessaria para este fluxo.
        poi.tipo || poi.categoria ? `Tipo: ${poi.tipo || poi.categoria}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.endereco ? `Endereço: ${poi.endereco}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.horario ? `Horário: ${poi.horario}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.avaliacao ? `Avaliação: ${poi.avaliacao}/5` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.url ? `Site: ${poi.url}` : '',
        // Atualiza ou consulta estado da pagina.
        this.temLocalização(poi) ? `Localização: ${poi.latitude}, ${poi.longitude}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.descricao ? `Descrição: ${poi.descricao}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        poi.nota ? `Nota: ${poi.nota}` : ''
      // Executa uma instrucao necessaria para este fluxo.
      ].filter(Boolean).join('\n');

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (detalhes) {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(detalhes, 10);
      }

      // Cria uma variavel local para esta operacao.
      const custosPoi = this.obterCustosPoi(poi, custos);
      // Cria uma variavel local para esta operacao.
      const custoDireto = Number(poi.custo) || 0;
      // Cria uma variavel local para esta operacao.
      const totalPoi = custoDireto + custosPoi.reduce((total, custo) => total + (Number(custo.valor) || 0), 0);
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(`Custo total do POI: ${this.formatarValor(totalPoi)} EUR`, 10, 'bold');

      // Executa uma instrucao necessaria para este fluxo.
      custosPoi.forEach(custo => {
        // Atualiza ou consulta estado da pagina.
        this.escreverTexto(`- ${custo.descricao}: ${this.formatarValor(custo.valor)} ${custo.moeda || 'EUR'}`, 9);
      });

      // Atualiza ou consulta estado da pagina.
      this.adicionarEspaco(3);
    });
  }

  // Define um membro interno desta classe.
  private adicionarCustosDia(dia: Dia, custos: Custo[]): void {
    // Atualiza ou consulta estado da pagina.
    this.adicionarEspaco(3);
    // Atualiza ou consulta estado da pagina.
    this.escreverTituloSecao('Custos do dia');

    // Cria uma variavel local para esta operacao.
    const custosDia = this.obterCustosDia(dia, custos).filter(custo => !custo.poiId);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (custosDia.length === 0) {
      // Atualiza ou consulta estado da pagina.
      this.escreverTexto('Sem custos soltos registados neste dia.', 10);
      // Devolve o resultado deste bloco.
      return;
    }

    // Executa uma instrucao necessaria para este fluxo.
    custosDia.forEach(custo => {
      // Cria uma variavel local para esta operacao.
      const detalhe = [
        // Executa uma instrucao necessaria para este fluxo.
        custo.descricao || 'Custo',
        // Executa uma instrucao necessaria para este fluxo.
        custo.categoria ? `Categoria: ${custo.categoria}` : '',
        // Executa uma instrucao necessaria para este fluxo.
        `Valor: ${this.formatarValor(custo.valor)} ${custo.moeda || 'EUR'}`,
        // Executa uma instrucao necessaria para este fluxo.
        custo.data ? `Data: ${this.formatarData(custo.data)}` : ''
      // Executa uma instrucao necessaria para este fluxo.
      ].filter(Boolean).join(' | ');

      // Atualiza ou consulta estado da pagina.
      this.escreverTexto(`- ${detalhe}`, 10);
    });
  }

  // Define um membro interno desta classe.
  private obterCustoTotal(dias: Dia[], custos: Custo[]): number {
    // Devolve o resultado deste bloco.
    return dias.reduce((total, dia) => total + this.obterCustoDia(dia, custos), 0);
  }

  // Define um membro interno desta classe.
  private obterCustoDia(dia: Dia, custos: Custo[]): number {
    // Cria uma variavel local para esta operacao.
    const pois = dia.pontosInteresse || [];
    // Cria uma variavel local para esta operacao.
    const poiIds = new Set(pois.map(poi => poi.id));
    // Cria uma variavel local para esta operacao.
    const custosDia = [
      // Executa uma instrucao necessaria para este fluxo.
      ...custos.filter(custo => custo.diaId === dia.id || (custo.poiId ? poiIds.has(custo.poiId) : false)),
      // Executa uma instrucao necessaria para este fluxo.
      ...(dia.custos || [])
    ];
    // Cria uma variavel local para esta operacao.
    const custosSemDuplicados = this.removerCustosDuplicados(custosDia);
    // Cria uma variavel local para esta operacao.
    const custoPoisDireto = pois.reduce((total, poi) => total + (Number(poi.custo) || 0), 0);

    // Devolve o resultado deste bloco.
    return custoPoisDireto + custosSemDuplicados.reduce((total, custo) => total + (Number(custo.valor) || 0), 0);
  }

  // Define um membro interno desta classe.
  private obterCustosDia(dia: Dia, custos: Custo[]): Custo[] {
    // Cria uma variavel local para esta operacao.
    const poiIds = new Set((dia.pontosInteresse || []).map(poi => poi.id));
    // Devolve o resultado deste bloco.
    return this.removerCustosDuplicados([
      // Executa uma instrucao necessaria para este fluxo.
      ...custos.filter(custo => custo.diaId === dia.id || (custo.poiId ? poiIds.has(custo.poiId) : false)),
      // Executa uma instrucao necessaria para este fluxo.
      ...(dia.custos || [])
    ]);
  }

  // Define um membro interno desta classe.
  private obterCustosPoi(poi: POI, custos: Custo[]): Custo[] {
    // Devolve o resultado deste bloco.
    return custos.filter(custo => custo.poiId === poi.id);
  }

  // Define um membro interno desta classe.
  private removerCustosDuplicados(custos: Custo[]): Custo[] {
    // Cria uma variavel local para esta operacao.
    const ids = new Set<string>();

    // Devolve o resultado deste bloco.
    return custos.filter(custo => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!custo.id) {
        // Devolve o resultado deste bloco.
        return true;
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (ids.has(custo.id)) {
        // Devolve o resultado deste bloco.
        return false;
      }

      // Executa uma instrucao necessaria para este fluxo.
      ids.add(custo.id);
      // Devolve o resultado deste bloco.
      return true;
    });
  }

  // Define um membro interno desta classe.
  private formatarStatus(status: string): string {
    // Cria uma variavel local para esta operacao.
    const labels: Record<string, string> = {
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
    return labels[status] || status;
  }

  // Define um membro interno desta classe.
  private temLocalização(poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return typeof poi.latitude === 'number' && typeof poi.longitude === 'number';
  }

}
