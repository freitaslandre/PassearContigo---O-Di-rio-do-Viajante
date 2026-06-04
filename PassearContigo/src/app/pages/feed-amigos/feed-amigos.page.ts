import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastController } from '@ionic/angular';
import { Unsubscribe } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { ComentarioPublicacao, Publicacao, ReacaoPublicacao } from '../../models/viagem.model';
import { PublicacoesService } from '../../services/publicacoes.service';

@Component({
  selector: 'app-feed-amigos',
  standalone: false,
  templateUrl: './feed-amigos.page.html',
  styleUrls: ['./feed-amigos.page.scss']
})
export class FeedAmigosPage implements OnInit, OnDestroy {
  publicacoes: Publicacao[] = [];
  comentariosPorPublicacao: Record<string, ComentarioPublicacao[]> = {};
  reacoesPorPublicacao: Record<string, ReacaoPublicacao[]> = {};
  comentarioNovo: Record<string, string> = {};
  comentando: Record<string, boolean> = {};
  reagindo: Record<string, boolean> = {};
  comentariosExpandidos: Record<string, boolean> = {};
  carregando = true;
  erro = '';

  private unsubscribe: Unsubscribe | null = null;
  private comentariosSubs: Record<string, Unsubscribe> = {};
  private reacoesSubs: Record<string, Unsubscribe> = {};

  constructor(
    private publicacoesService: PublicacoesService,
    private router: Router,
    private toastController: ToastController
  ) {}

  ngOnInit(): void {
    this.carregarFeed();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
    this.limparSubscricoesInteracoes();
  }

  carregarFeed(): void {
    this.carregando = true;
    this.erro = '';

    this.unsubscribe?.();
    this.unsubscribe = this.publicacoesService.subscribeToFeedPublicacoes(
      (publicacoes) => {
        this.publicacoes = publicacoes;
        this.erro = '';
        this.sincronizarSubscricoesInteracoes(publicacoes);
        this.carregando = false;
      },
      (error) => {
        console.error('Erro ao carregar feed:', error);
        this.erro = error?.message || 'Erro ao carregar feed.';
        this.carregando = false;
      }
    );
  }

  voltar(): void {
    this.router.navigate(['/tabs', 'perfil']);
  }

  abrirPublicacao(publicacao: Publicacao): void {
    if (!publicacao.viagemId) return;
    this.router.navigate(['/tabs', 'viagens', publicacao.viagemId]);
  }

  formatarData(data: Date | string | any): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  obterTextoVisibilidade(publicacao: Publicacao): string {
    return publicacao.visibilidade === 'publica' ? 'Público' : 'Apenas eu';
  }

  obterCorVisibilidade(publicacao: Publicacao): string {
    return publicacao.visibilidade === 'publica' ? 'success' : 'secondary';
  }

  obterComentarios(publicacao: Publicacao): ComentarioPublicacao[] {
    return this.comentariosPorPublicacao[publicacao.id] || [];
  }

  obterComentariosVisiveis(publicacao: Publicacao): ComentarioPublicacao[] {
    const comentarios = this.obterComentarios(publicacao);
    return this.comentariosExpandidos[publicacao.id] ? comentarios.slice(0, 3) : [];
  }

  temComentariosOcultos(publicacao: Publicacao): boolean {
    return this.obterComentarios(publicacao).length > 0;
  }

  alternarComentarios(publicacao: Publicacao, event?: Event): void {
    event?.stopPropagation();
    this.comentariosExpandidos[publicacao.id] = !this.comentariosExpandidos[publicacao.id];
  }

  obterReacoes(publicacao: Publicacao): ReacaoPublicacao[] {
    return this.reacoesPorPublicacao[publicacao.id] || [];
  }

  totalReacoes(publicacao: Publicacao): number {
    return this.obterReacoes(publicacao).length || publicacao.gostos || 0;
  }

  totalComentarios(publicacao: Publicacao): number {
    return this.obterComentarios(publicacao).length || publicacao.comentariosCount || 0;
  }

  utilizadorReagiu(publicacao: Publicacao): boolean {
    const uid = getAuth().currentUser?.uid;
    return !!uid && this.obterReacoes(publicacao).some(reacao => reacao.uidUtilizador === uid);
  }

  async alternarReacao(publicacao: Publicacao): Promise<void> {
    if (this.reagindo[publicacao.id]) return;

    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      await this.mostrarToast('Inicie sessão para dar gosto nesta publicação.');
      return;
    }

    this.reagindo[publicacao.id] = true;

    try {
      await this.publicacoesService.alternarReacao(publicacao.id);
    } catch (error: any) {
      console.error('Erro ao reagir à publicação:', error);
      this.erro = error?.message || 'Erro ao reagir à publicação.';
    } finally {
      this.reagindo[publicacao.id] = false;
    }
  }

  async adicionarComentario(publicacao: Publicacao): Promise<void> {
    if (this.comentando[publicacao.id]) return;

    const currentUser = getAuth().currentUser;
    if (!currentUser) {
      await this.mostrarToast('Inicie sessão para comentar esta publicação.');
      return;
    }

    const texto = (this.comentarioNovo[publicacao.id] || '').trim();
    if (!texto) return;

    this.comentando[publicacao.id] = true;

    try {
      await this.publicacoesService.adicionarComentario(publicacao.id, texto);
      this.comentarioNovo[publicacao.id] = '';
    } catch (error: any) {
      console.error('Erro ao comentar publicação:', error);
      this.erro = error?.message || 'Erro ao comentar publicação.';
    } finally {
      this.comentando[publicacao.id] = false;
    }
  }

  private async mostrarToast(message: string): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      position: 'top',
      color: 'warning'
    });

    await toast.present();
  }

  private converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return data.toDate();
    }

    return new Date(data);
  }

  private sincronizarSubscricoesInteracoes(publicacoes: Publicacao[]): void {
    const idsAtuais = new Set(publicacoes.map(publicacao => publicacao.id));

    Object.keys(this.comentariosSubs).forEach(publicacaoId => {
      if (!idsAtuais.has(publicacaoId)) {
        this.comentariosSubs[publicacaoId]();
        delete this.comentariosSubs[publicacaoId];
        delete this.comentariosPorPublicacao[publicacaoId];
        delete this.comentariosExpandidos[publicacaoId];
      }
    });

    Object.keys(this.reacoesSubs).forEach(publicacaoId => {
      if (!idsAtuais.has(publicacaoId)) {
        this.reacoesSubs[publicacaoId]();
        delete this.reacoesSubs[publicacaoId];
        delete this.reacoesPorPublicacao[publicacaoId];
      }
    });

    publicacoes.forEach(publicacao => {
      if (!this.comentariosSubs[publicacao.id]) {
        const unsubscribe = this.publicacoesService.subscribeToComentariosPublicacao(
          publicacao.id,
          comentarios => this.comentariosPorPublicacao[publicacao.id] = comentarios,
          error => console.warn('Não foi possível carregar comentários:', error)
        );

        if (unsubscribe) {
          this.comentariosSubs[publicacao.id] = unsubscribe;
        }
      }

      if (!this.reacoesSubs[publicacao.id]) {
        const unsubscribe = this.publicacoesService.subscribeToReacoesPublicacao(
          publicacao.id,
          reacoes => this.reacoesPorPublicacao[publicacao.id] = reacoes,
          error => console.warn('Não foi possível carregar reações:', error)
        );

        if (unsubscribe) {
          this.reacoesSubs[publicacao.id] = unsubscribe;
        }
      }
    });
  }

  private limparSubscricoesInteracoes(): void {
    Object.values(this.comentariosSubs).forEach(unsubscribe => unsubscribe());
    Object.values(this.reacoesSubs).forEach(unsubscribe => unsubscribe());
    this.comentariosSubs = {};
    this.reacoesSubs = {};
  }
}
