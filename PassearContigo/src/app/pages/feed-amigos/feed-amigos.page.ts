// app/pages/feed-amigos/feed-amigos.page.ts | Controlador da pagina feed amigos, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnDestroy, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Unsubscribe } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { getAuth } from 'firebase/auth';
// Importa dependencias usadas neste ficheiro.
import { ComentarioPublicacao, Publicacao, ReacaoPublicacao } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { PublicacoesService } from '../../services/publicacoes.service';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-feed-amigos',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './feed-amigos.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./feed-amigos.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class FeedAmigosPage implements OnInit, OnDestroy {
  // Define um campo ou opcao de configuracao.
  publicacoes: Publicacao[] = [];
  // Define um campo ou opcao de configuracao.
  comentariosPorPublicacao: Record<string, ComentarioPublicacao[]> = {};
  // Define um campo ou opcao de configuracao.
  reacoesPorPublicacao: Record<string, ReacaoPublicacao[]> = {};
  // Define um campo ou opcao de configuracao.
  comentarioNovo: Record<string, string> = {};
  // Define um campo ou opcao de configuracao.
  comentando: Record<string, boolean> = {};
  // Define um campo ou opcao de configuracao.
  reagindo: Record<string, boolean> = {};
  // Define um campo ou opcao de configuracao.
  comentariosExpandidos: Record<string, boolean> = {};
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  erro = '';

  // Define um membro interno desta classe.
  private unsubscribe: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private comentariosSubs: Record<string, Unsubscribe> = {};
  // Define um membro interno desta classe.
  private reacoesSubs: Record<string, Unsubscribe> = {};

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private publicacoesService: PublicacoesService,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private toastController: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit(): void {
    // Atualiza ou consulta estado da pagina.
    this.carregarFeed();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy(): void {
    // Atualiza ou consulta estado da pagina.
    this.unsubscribe?.();
    // Atualiza ou consulta estado da pagina.
    this.limparSubscricoesInteracoes();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  carregarFeed(): void {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';

    // Atualiza ou consulta estado da pagina.
    this.unsubscribe?.();
    // Atualiza ou consulta estado da pagina.
    this.unsubscribe = this.publicacoesService.subscribeToFeedPublicacoes(
      // Executa uma instrucao necessaria para este fluxo.
      (publicacoes) => {
        // Atualiza ou consulta estado da pagina.
        this.publicacoes = publicacoes;
        // Atualiza ou consulta estado da pagina.
        this.erro = '';
        // Atualiza ou consulta estado da pagina.
        this.sincronizarSubscricoesInteracoes(publicacoes);
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error) => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar feed:', error);
        // Atualiza ou consulta estado da pagina.
        this.erro = error?.message || 'Erro ao carregar feed.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      }
    );
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar(): void {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'perfil']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirPublicacao(publicacao: Publicacao): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!publicacao.viagemId) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', publicacao.viagemId]);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarData(data: Date | string | any): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTextoVisibilidade(publicacao: Publicacao): string {
    // Devolve o resultado deste bloco.
    return publicacao.visibilidade === 'publica' ? 'Público' : 'Apenas eu';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCorVisibilidade(publicacao: Publicacao): string {
    // Devolve o resultado deste bloco.
    return publicacao.visibilidade === 'publica' ? 'success' : 'secondary';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterComentarios(publicacao: Publicacao): ComentarioPublicacao[] {
    // Devolve o resultado deste bloco.
    return this.comentariosPorPublicacao[publicacao.id] || [];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterComentariosVisiveis(publicacao: Publicacao): ComentarioPublicacao[] {
    // Cria uma variavel local para esta operacao.
    const comentarios = this.obterComentarios(publicacao);
    // Devolve o resultado deste bloco.
    return this.comentariosExpandidos[publicacao.id] ? comentarios.slice(0, 3) : [];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  temComentariosOcultos(publicacao: Publicacao): boolean {
    // Devolve o resultado deste bloco.
    return this.obterComentarios(publicacao).length > 0;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  alternarComentarios(publicacao: Publicacao, event?: Event): void {
    // Executa uma instrucao necessaria para este fluxo.
    event?.stopPropagation();
    // Atualiza ou consulta estado da pagina.
    this.comentariosExpandidos[publicacao.id] = !this.comentariosExpandidos[publicacao.id];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterReacoes(publicacao: Publicacao): ReacaoPublicacao[] {
    // Devolve o resultado deste bloco.
    return this.reacoesPorPublicacao[publicacao.id] || [];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  totalReacoes(publicacao: Publicacao): number {
    // Devolve o resultado deste bloco.
    return this.obterReacoes(publicacao).length || publicacao.gostos || 0;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  totalComentarios(publicacao: Publicacao): number {
    // Devolve o resultado deste bloco.
    return this.obterComentarios(publicacao).length || publicacao.comentariosCount || 0;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  utilizadorReagiu(publicacao: Publicacao): boolean {
    // Cria uma variavel local para esta operacao.
    const uid = getAuth().currentUser?.uid;
    // Devolve o resultado deste bloco.
    return !!uid && this.obterReacoes(publicacao).some(reacao => reacao.uidUtilizador === uid);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async alternarReacao(publicacao: Publicacao): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.reagindo[publicacao.id]) return;

    // Cria uma variavel local para esta operacao.
    const currentUser = getAuth().currentUser;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!currentUser) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Inicie sessão para dar gosto nesta publicação.');
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.reagindo[publicacao.id] = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.publicacoesService.alternarReacao(publicacao.id);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao reagir à publicação:', error);
      // Atualiza ou consulta estado da pagina.
      this.erro = error?.message || 'Erro ao reagir à publicação.';
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.reagindo[publicacao.id] = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarComentario(publicacao: Publicacao): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.comentando[publicacao.id]) return;

    // Cria uma variavel local para esta operacao.
    const currentUser = getAuth().currentUser;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!currentUser) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Inicie sessão para comentar esta publicação.');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const texto = (this.comentarioNovo[publicacao.id] || '').trim();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!texto) return;

    // Atualiza ou consulta estado da pagina.
    this.comentando[publicacao.id] = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.publicacoesService.adicionarComentario(publicacao.id, texto);
      // Atualiza ou consulta estado da pagina.
      this.comentarioNovo[publicacao.id] = '';
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao comentar publicação:', error);
      // Atualiza ou consulta estado da pagina.
      this.erro = error?.message || 'Erro ao comentar publicação.';
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.comentando[publicacao.id] = false;
    }
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastController.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2500,
      // Define um campo ou opcao de configuracao.
      position: 'top',
      // Define um campo ou opcao de configuracao.
      color: 'warning'
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Devolve o resultado deste bloco.
      return data.toDate();
    }

    // Devolve o resultado deste bloco.
    return new Date(data);
  }

  // Define um membro interno desta classe.
  private sincronizarSubscricoesInteracoes(publicacoes: Publicacao[]): void {
    // Cria uma variavel local para esta operacao.
    const idsAtuais = new Set(publicacoes.map(publicacao => publicacao.id));

    // Executa uma instrucao necessaria para este fluxo.
    Object.keys(this.comentariosSubs).forEach(publicacaoId => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!idsAtuais.has(publicacaoId)) {
        // Atualiza ou consulta estado da pagina.
        this.comentariosSubs[publicacaoId]();
        // Executa uma instrucao necessaria para este fluxo.
        delete this.comentariosSubs[publicacaoId];
        // Executa uma instrucao necessaria para este fluxo.
        delete this.comentariosPorPublicacao[publicacaoId];
        // Executa uma instrucao necessaria para este fluxo.
        delete this.comentariosExpandidos[publicacaoId];
      }
    });

    // Executa uma instrucao necessaria para este fluxo.
    Object.keys(this.reacoesSubs).forEach(publicacaoId => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!idsAtuais.has(publicacaoId)) {
        // Atualiza ou consulta estado da pagina.
        this.reacoesSubs[publicacaoId]();
        // Executa uma instrucao necessaria para este fluxo.
        delete this.reacoesSubs[publicacaoId];
        // Executa uma instrucao necessaria para este fluxo.
        delete this.reacoesPorPublicacao[publicacaoId];
      }
    });

    // Executa uma instrucao necessaria para este fluxo.
    publicacoes.forEach(publicacao => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.comentariosSubs[publicacao.id]) {
        // Cria uma variavel local para esta operacao.
        const unsubscribe = this.publicacoesService.subscribeToComentariosPublicacao(
          // Executa uma instrucao necessaria para este fluxo.
          publicacao.id,
          // Atribui um valor a esta propriedade.
          comentarios => this.comentariosPorPublicacao[publicacao.id] = comentarios,
          // Atribui um valor a esta propriedade.
          error => console.warn('Não foi possível carregar comentários:', error)
        );

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (unsubscribe) {
          // Atualiza ou consulta estado da pagina.
          this.comentariosSubs[publicacao.id] = unsubscribe;
        }
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.reacoesSubs[publicacao.id]) {
        // Cria uma variavel local para esta operacao.
        const unsubscribe = this.publicacoesService.subscribeToReacoesPublicacao(
          // Executa uma instrucao necessaria para este fluxo.
          publicacao.id,
          // Atribui um valor a esta propriedade.
          reacoes => this.reacoesPorPublicacao[publicacao.id] = reacoes,
          // Atribui um valor a esta propriedade.
          error => console.warn('Não foi possível carregar reações:', error)
        );

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (unsubscribe) {
          // Atualiza ou consulta estado da pagina.
          this.reacoesSubs[publicacao.id] = unsubscribe;
        }
      }
    });
  }

  // Define um membro interno desta classe.
  private limparSubscricoesInteracoes(): void {
    // Executa uma instrucao necessaria para este fluxo.
    Object.values(this.comentariosSubs).forEach(unsubscribe => unsubscribe());
    // Executa uma instrucao necessaria para este fluxo.
    Object.values(this.reacoesSubs).forEach(unsubscribe => unsubscribe());
    // Atualiza ou consulta estado da pagina.
    this.comentariosSubs = {};
    // Atualiza ou consulta estado da pagina.
    this.reacoesSubs = {};
  }
}
