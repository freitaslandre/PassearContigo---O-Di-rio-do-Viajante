// app/pages/perfil/perfil.page.ts | Controlador da pagina perfil, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { AlertController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { AuthService } from '../../services/auth.service';
// Importa dependencias usadas neste ficheiro.
import { PushNotificationsService } from '../../services/push-notifications.service';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-perfil',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './perfil.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./perfil.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PerfilPage implements OnInit {
  // Atribui um valor a esta propriedade.
  login = {
    // Define um campo ou opcao de configuracao.
    email: '',
    // Define um campo ou opcao de configuracao.
    password: ''
  };

  // Atribui um valor a esta propriedade.
  registo = {
    // Define um campo ou opcao de configuracao.
    nome: '',
    // Define um campo ou opcao de configuracao.
    email: '',
    // Define um campo ou opcao de configuracao.
    password: ''
  };

  // Atribui um valor a esta propriedade.
  modoRegisto = false;
  // Atribui um valor a esta propriedade.
  iniciandoSessao = false;
  // Atribui um valor a esta propriedade.
  registando = false;
  // Atribui um valor a esta propriedade.
  terminandoSessao = false;
  // Atribui um valor a esta propriedade.
  ativandoNotificacoes = false;
  // Atribui um valor a esta propriedade.
  notificacoesAtivas = false;
  // Atribui um valor a esta propriedade.
  showPassword = false;
  // Atribui um valor a esta propriedade.
  showRegistoPassword = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    public authService: AuthService,
    // Define um membro interno desta classe.
    private pushNotificationsService: PushNotificationsService,
    // Define um membro interno desta classe.
    private alertCtrl: AlertController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController,
    // Define um membro interno desta classe.
    private router: Router
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  async ngOnInit(): Promise<void> {
    // Inicia um bloco protegido contra erros.
    try {
      // Atualiza ou consulta estado da pagina.
      this.notificacoesAtivas = await this.pushNotificationsService.notificacoesAtivas();
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Erro ao verificar estado das notificações:', error);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  loginValido(): boolean {
    // Devolve o resultado deste bloco.
    return this.emailValido(this.login.email) && this.login.password.length >= 6;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  registoValido(): boolean {
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (
      // Atualiza ou consulta estado da pagina.
      this.registo.nome.trim().length > 0 &&
      // Atualiza ou consulta estado da pagina.
      this.emailValido(this.registo.email) &&
      // Atualiza ou consulta estado da pagina.
      this.registo.password.length >= 6
    );
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async realizarLogin(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.loginValido() || this.iniciandoSessao) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const { email, password } = this.login;
    // Atualiza ou consulta estado da pagina.
    this.iniciandoSessao = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.authService.login(email, password);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Sessão iniciada com sucesso.', 'success');
      // Aguarda a conclusao de uma operacao assincrona.
      await this.router.navigate(['/tabs', 'viagens']);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarErroLogin(error);
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.iniciandoSessao = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async realizarRegisto(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.registoValido() || this.registando) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const { email, password, nome } = this.registo;
    // Atualiza ou consulta estado da pagina.
    this.registando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.authService.registo(email, password, nome);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Conta criada com sucesso.', 'success');
      // Atualiza ou consulta estado da pagina.
      this.modoRegisto = false;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao criar conta.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.registando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async confirmarLogout(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.terminandoSessao) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Terminar sessão?',
      // Define um campo ou opcao de configuracao.
      message: 'Tem a certeza que pretende sair da sua conta?',
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
          text: 'Terminar sessão',
          // Define um campo ou opcao de configuracao.
          role: 'destructive',
          // Define um campo ou opcao de configuracao.
          handler: () => {
            // Atualiza ou consulta estado da pagina.
            this.realizarLogout();
          }
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um membro interno desta classe.
  private async realizarLogout(): Promise<void> {
    // Atualiza ou consulta estado da pagina.
    this.terminandoSessao = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.authService.logout();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Sessão terminada.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao terminar sessão.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.terminandoSessao = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async ativarNotificacoesPush(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.ativandoNotificacoes) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.ativandoNotificacoes = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.pushNotificationsService.ativarNotificacoes();
      // Atualiza ou consulta estado da pagina.
      this.notificacoesAtivas = true;
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Notificações ativadas.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao ativar notificações:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao ativar notificações.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.ativandoNotificacoes = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async desativarNotificacoesPush(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.ativandoNotificacoes) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.ativandoNotificacoes = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.pushNotificationsService.desativarNotificacoes();
      // Atualiza ou consulta estado da pagina.
      this.notificacoesAtivas = false;
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Notificações desativadas.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao desativar notificações:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao desativar notificações.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.ativandoNotificacoes = false;
    }
  }

  // Define um membro interno desta classe.
  private emailValido(email: string): boolean {
    // Devolve o resultado deste bloco.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  // Define um membro interno desta classe.
  private async mostrarErroLogin(error: any): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Não foi possível iniciar sessão',
      // Define um campo ou opcao de configuracao.
      subHeader: this.obterTituloErroLogin(error),
      // Define um campo ou opcao de configuracao.
      message: this.obterMensagemErroLogin(error),
      // Define um campo ou opcao de configuracao.
      buttons: ['Tentar novamente']
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um membro interno desta classe.
  private obterTituloErroLogin(error: any): string {
    // Cria uma variavel local para esta operacao.
    const code = error?.code || '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (code) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/invalid-credential':
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/invalid-login-credentials':
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/wrong-password':
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/user-not-found':
        // Devolve o resultado deste bloco.
        return 'Dados de acesso incorretos';
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/too-many-requests':
        // Devolve o resultado deste bloco.
        return 'Demasiadas tentativas';
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/network-request-failed':
        // Devolve o resultado deste bloco.
        return 'Ligação indisponível';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'Erro de autenticação';
    }
  }

  // Define um membro interno desta classe.
  private obterMensagemErroLogin(error: any): string {
    // Cria uma variavel local para esta operacao.
    const code = error?.code || '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (code) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/invalid-credential':
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/invalid-login-credentials':
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/wrong-password':
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/user-not-found':
        // Devolve o resultado deste bloco.
        return 'O e-mail ou a palavra-passe não estão corretos. Verifique os dados introduzidos e tente novamente.';
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/invalid-email':
        // Devolve o resultado deste bloco.
        return 'O e-mail introduzido não parece válido. Confirme o endereço e tente novamente.';
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/too-many-requests':
        // Devolve o resultado deste bloco.
        return 'Por segurança, o acesso foi temporariamente limitado. Aguarde alguns minutos antes de tentar outra vez.';
      // Executa uma instrucao necessaria para este fluxo.
      case 'auth/network-request-failed':
        // Devolve o resultado deste bloco.
        return 'Não foi possível contactar o servidor. Verifique a ligação à internet e tente novamente.';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'Ocorreu um problema ao validar a sua conta. Tente novamente daqui a pouco.';
    }
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: string = 'primary'): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2500,
      // Define um campo ou opcao de configuracao.
      position: 'bottom',
      // Executa uma instrucao necessaria para este fluxo.
      color
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }
}
