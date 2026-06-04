// app/services/pdf-share.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Directory, Filesystem } from '@capacitor/filesystem';
// Importa dependencias usadas neste ficheiro.
import { Share } from '@capacitor/share';

// Contrato de dados usado para tipar objetos desta area.
export interface PdfGerado {
  // Define um campo ou opcao de configuracao.
  fileName: string;
  // Define um campo ou opcao de configuracao.
  base64: string;
}

// Contrato de dados usado para tipar objetos desta area.
export interface PdfShareOptions {
  // Define um campo ou opcao de configuracao.
  title: string;
  // Executa uma instrucao necessaria para este fluxo.
  text?: string;
  // Executa uma instrucao necessaria para este fluxo.
  dialogTitle?: string;
}

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PdfShareService {
  // Define um metodo chamado pela pagina ou por outros metodos.
  async canShare(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const result = await Share.canShare();
    // Devolve o resultado deste bloco.
    return result.value;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async sharePdf(pdf: PdfGerado, options: PdfShareOptions): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const savedFile = await Filesystem.writeFile({
      // Define um campo ou opcao de configuracao.
      path: this.sanitizeFileName(pdf.fileName),
      // Define um campo ou opcao de configuracao.
      data: pdf.base64,
      // Define um campo ou opcao de configuracao.
      directory: Directory.Cache
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await Share.share({
      // Define um campo ou opcao de configuracao.
      title: options.title,
      // Define um campo ou opcao de configuracao.
      text: options.text,
      // Define um campo ou opcao de configuracao.
      files: [savedFile.uri],
      // Define um campo ou opcao de configuracao.
      dialogTitle: options.dialogTitle || 'Partilhar PDF'
    });
  }

  // Define um membro interno desta classe.
  private sanitizeFileName(fileName: string): string {
    // Cria uma variavel local para esta operacao.
    const normalized = fileName.trim().replace(/[^a-zA-Z0-9_.-]+/g, '-');
    // Devolve o resultado deste bloco.
    return normalized.toLowerCase().endsWith('.pdf') ? normalized : `${normalized || 'documento'}.pdf`;
  }
}
