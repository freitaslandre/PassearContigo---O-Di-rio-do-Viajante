// app/pages/viagens/viagens.page.ts | Controlador da pagina viagens, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit, OnDestroy } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { Unsubscribe } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { AlertController, ToastController } from '@ionic/angular';

/**
 * ViagensPage - Página de Viagens
 * Exibe a lista de viagens/itinerários do utilizador
 */
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-viagens',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: 'viagens.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['viagens.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensPage implements OnInit, OnDestroy {
  // Define um campo ou opcao de configuracao.
  viagens: Viagem[] = [];
  // Define um campo ou opcao de configuracao.
  viagemEmCurso: Viagem | null = null;
  // Atribui um valor a esta propriedade.
  statusSelecionado = 'todos';
  // Atribui um valor a esta propriedade.
  filtrosStatus = [
    // Executa uma instrucao necessaria para este fluxo.
    { valor: 'todos', label: 'Todas' },
    // Executa uma instrucao necessaria para este fluxo.
    { valor: 'planejada', label: 'Planeadas' },
    // Executa uma instrucao necessaria para este fluxo.
    { valor: 'em-andamento', label: 'Em curso' },
    // Executa uma instrucao necessaria para este fluxo.
    { valor: 'concluida', label: 'Concluídas' },
    // Executa uma instrucao necessaria para este fluxo.
    { valor: 'cancelada', label: 'Canceladas' }
  ];
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Define um membro interno desta classe.
  private unsubscribe: Unsubscribe | null = null;
  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private alertCtrl: AlertController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}
  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.subscribeToViagens();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.unsubscribe?.();
  }

  // Define um membro interno desta classe.
  private subscribeToViagens() {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';
    // Atualiza ou consulta estado da pagina.
    this.unsubscribe = this.viagensService.subscribeToViagens(
      // Executa uma instrucao necessaria para este fluxo.
      (viagens) => {
        // Atualiza ou consulta estado da pagina.
        this.viagens = viagens;
        // Atualiza ou consulta estado da pagina.
        this.atualizarViagemEmCurso();
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.erro = '';
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error) => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar viagens:', error);
        // Atualiza ou consulta estado da pagina.
        this.erro = error?.message || 'Não foi possível carregar as viagens.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      }
    );
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  recarregarViagens() {
    // Atualiza ou consulta estado da pagina.
    this.unsubscribe?.();
    // Atualiza ou consulta estado da pagina.
    this.subscribeToViagens();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDetalhes(id: string) {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', id]);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  podeGerirViagem(viagem: Viagem): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeGerirViagemAtual(viagem);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async confirmarEliminarViagem(event: Event, viagem: Viagem) {
    // Executa uma instrucao necessaria para este fluxo.
    event.stopPropagation();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeGerirViagem(viagem)) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Apenas o dono pode eliminar esta viagem.', 'danger');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar viagem',
      // Define um campo ou opcao de configuracao.
      message: `Tem a certeza que pretende eliminar "${viagem.titulo}"? Esta ação não pode ser anulada.`,
      // Define um campo ou opcao de configuracao.
      buttons: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Cancelar',
          // Define um campo ou opcao de configuracao.
          role: 'cancel'
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Eliminar',
          // Define um campo ou opcao de configuracao.
          role: 'destructive',
          // Define um campo ou opcao de configuracao.
          handler: () => {
            // Atualiza ou consulta estado da pagina.
            this.eliminarViagem(viagem.id);
          }
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarData(data: Date | string | any): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return new Date(data).toLocaleDateString('pt-PT');
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data.toLocaleDateString('pt-PT');
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Devolve o resultado deste bloco.
      return data.toDate().toLocaleDateString('pt-PT');
    }

    // Devolve o resultado deste bloco.
    return '';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTotalPessoas(viagem: Viagem): number {
    // 1 (proprietário) + número de colaboradores
    return 1 + (viagem.colaboradores?.length || 0);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterNumDias(dataInicio: Date | string | any, dataFim: Date | string | any): number {
    // Cria uma variavel local para esta operacao.
    const inicio = this.converterParaDate(dataInicio);
    // Cria uma variavel local para esta operacao.
    const fim = this.converterParaDate(dataFim);
    // Cria uma variavel local para esta operacao.
    const differenceMs = fim.getTime() - inicio.getTime();
    // Devolve o resultado deste bloco.
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTotalPois(viagem: Viagem): number {
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (viagem.dias || []).reduce((total, dia) => total + (dia.pontosInteresse?.length || 0), 0);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterFotoCapa(viagem: Viagem): string {
    // Devolve o resultado deste bloco.
    return viagem.fotoCapaUrl?.trim() || '';
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return new Date(data);
    }
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      return (data as any).toDate();
    }
    // Devolve o resultado deste bloco.
    return new Date(data);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCorStatus(status?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (status) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'planejada':
        // Devolve o resultado deste bloco.
        return 'primary';
      // Executa uma instrucao necessaria para este fluxo.
      case 'em-andamento':
        // Devolve o resultado deste bloco.
        return 'warning';
      // Executa uma instrucao necessaria para este fluxo.
      case 'concluida':
        // Devolve o resultado deste bloco.
        return 'success';
      // Executa uma instrucao necessaria para este fluxo.
      case 'cancelada':
        // Devolve o resultado deste bloco.
        return 'danger';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'medium';
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTextoStatus(status?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (status) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'planejada':
        // Devolve o resultado deste bloco.
        return 'Planeada';
      // Executa uma instrucao necessaria para este fluxo.
      case 'em-andamento':
        // Devolve o resultado deste bloco.
        return 'Em curso';
      // Executa uma instrucao necessaria para este fluxo.
      case 'concluida':
        // Devolve o resultado deste bloco.
        return 'Concluída';
      // Executa uma instrucao necessaria para este fluxo.
      case 'cancelada':
        // Devolve o resultado deste bloco.
        return 'Cancelada';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'Sem estado';
    }
  }

  // Executa uma instrucao necessaria para este fluxo.
  get viagensRestantes(): Viagem[] {
    // Cria uma variavel local para esta operacao.
    const viagens = this.viagensFiltradas;

    // Devolve o resultado deste bloco.
    return this.viagemEmCurso
      // Executa uma instrucao necessaria para este fluxo.
      ? viagens.filter((viagem) => viagem.id !== this.viagemEmCurso?.id)
      // Executa uma instrucao necessaria para este fluxo.
      : viagens;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get viagensFiltradas(): Viagem[] {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.statusSelecionado === 'todos') {
      // Devolve o resultado deste bloco.
      return this.viagens;
    }

    // Devolve o resultado deste bloco.
    return this.viagens.filter((viagem) => viagem.status === this.statusSelecionado);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  selecionarStatus(status: string | number | null | undefined) {
    // Atualiza ou consulta estado da pagina.
    this.statusSelecionado = status ? String(status) : 'todos';
    // Atualiza ou consulta estado da pagina.
    this.atualizarViagemEmCurso();
  }

  // Define um membro interno desta classe.
  private encontrarViagemEmCurso(viagens: Viagem[]): Viagem | null {
    // Cria uma variavel local para esta operacao.
    const viagemAtiva = viagens.find((viagem) => viagem.status === 'em-andamento');
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagemAtiva) {
      // Devolve o resultado deste bloco.
      return viagemAtiva;
    }

    // Cria uma variavel local para esta operacao.
    const agora = new Date();
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (
      // Executa uma instrucao necessaria para este fluxo.
      viagens.find((viagem) => {
        // Cria uma variavel local para esta operacao.
        const inicio = this.converterParaDate(viagem.dataInicio);
        // Cria uma variavel local para esta operacao.
        const fim = this.converterParaDate(viagem.dataFim);
        // Devolve o resultado deste bloco.
        return inicio <= agora && agora <= fim;
      // Executa uma instrucao necessaria para este fluxo.
      }) ?? null
    );
  }

  // Define um membro interno desta classe.
  private atualizarViagemEmCurso() {
    // Atualiza ou consulta estado da pagina.
    this.viagemEmCurso = this.encontrarViagemEmCurso(this.viagensFiltradas);
  }

  // Define um membro interno desta classe.
  private async eliminarViagem(id: string) {
    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.deleteViagem(id);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Viagem eliminada com sucesso.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao eliminar viagem:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao eliminar viagem.', 'danger');
    }
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: 'success' | 'danger') {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2000,
      // Executa uma instrucao necessaria para este fluxo.
      color
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }
}
