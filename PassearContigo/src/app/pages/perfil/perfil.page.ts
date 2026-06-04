import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { PushNotificationsService } from '../../services/push-notifications.service';

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss']
})
export class PerfilPage implements OnInit {
  login = {
    email: '',
    password: ''
  };

  registo = {
    nome: '',
    email: '',
    password: ''
  };

  modoRegisto = false;
  iniciandoSessao = false;
  registando = false;
  terminandoSessao = false;
  ativandoNotificacoes = false;
  notificacoesAtivas = false;

  constructor(
    public authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      this.notificacoesAtivas = await this.pushNotificationsService.notificacoesAtivas();
    } catch (error) {
      console.warn('Erro ao verificar estado das notificações:', error);
    }
  }

  loginValido(): boolean {
    return this.emailValido(this.login.email) && this.login.password.length >= 6;
  }

  registoValido(): boolean {
    return (
      this.registo.nome.trim().length > 0 &&
      this.emailValido(this.registo.email) &&
      this.registo.password.length >= 6
    );
  }

  async realizarLogin(): Promise<void> {
    if (!this.loginValido() || this.iniciandoSessao) {
      return;
    }

    const { email, password } = this.login;
    this.iniciandoSessao = true;

    try {
      await this.authService.login(email, password);
      await this.mostrarToast('Sessão iniciada com sucesso.', 'success');
      await this.router.navigate(['/tabs', 'viagens']);
    } catch (error: any) {
      await this.mostrarErroLogin(error);
    } finally {
      this.iniciandoSessao = false;
    }
  }

  async realizarRegisto(): Promise<void> {
    if (!this.registoValido() || this.registando) {
      return;
    }

    const { email, password, nome } = this.registo;
    this.registando = true;

    try {
      await this.authService.registo(email, password, nome);
      await this.mostrarToast('Conta criada com sucesso.', 'success');
      this.modoRegisto = false;
    } catch (error: any) {
      await this.mostrarToast(error?.message || 'Erro ao criar conta.', 'danger');
    } finally {
      this.registando = false;
    }
  }

  async confirmarLogout(): Promise<void> {
    if (this.terminandoSessao) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Terminar sessão?',
      message: 'Tem a certeza que pretende sair da sua conta?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Terminar sessão',
          role: 'destructive',
          handler: () => {
            this.realizarLogout();
          }
        }
      ]
    });

    await alert.present();
  }

  private async realizarLogout(): Promise<void> {
    this.terminandoSessao = true;

    try {
      await this.authService.logout();
      await this.mostrarToast('Sessão terminada.', 'success');
    } catch (error: any) {
      await this.mostrarToast(error?.message || 'Erro ao terminar sessão.', 'danger');
    } finally {
      this.terminandoSessao = false;
    }
  }

  async ativarNotificacoesPush(): Promise<void> {
    if (this.ativandoNotificacoes) {
      return;
    }

    this.ativandoNotificacoes = true;

    try {
      await this.pushNotificationsService.ativarNotificacoes();
      this.notificacoesAtivas = true;
      await this.mostrarToast('Notificações ativadas.', 'success');
    } catch (error: any) {
      console.error('Erro ao ativar notificações:', error);
      await this.mostrarToast(error?.message || 'Erro ao ativar notificações.', 'danger');
    } finally {
      this.ativandoNotificacoes = false;
    }
  }

  async desativarNotificacoesPush(): Promise<void> {
    if (this.ativandoNotificacoes) {
      return;
    }

    this.ativandoNotificacoes = true;

    try {
      await this.pushNotificationsService.desativarNotificacoes();
      this.notificacoesAtivas = false;
      await this.mostrarToast('Notificações desativadas.', 'success');
    } catch (error: any) {
      console.error('Erro ao desativar notificações:', error);
      await this.mostrarToast(error?.message || 'Erro ao desativar notificações.', 'danger');
    } finally {
      this.ativandoNotificacoes = false;
    }
  }

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private async mostrarErroLogin(error: any): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Não foi possível iniciar sessão',
      subHeader: this.obterTituloErroLogin(error),
      message: this.obterMensagemErroLogin(error),
      buttons: ['Tentar novamente']
    });

    await alert.present();
  }

  private obterTituloErroLogin(error: any): string {
    const code = error?.code || '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'Dados de acesso incorretos';
      case 'auth/too-many-requests':
        return 'Demasiadas tentativas';
      case 'auth/network-request-failed':
        return 'Ligação indisponível';
      default:
        return 'Erro de autenticação';
    }
  }

  private obterMensagemErroLogin(error: any): string {
    const code = error?.code || '';

    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/invalid-login-credentials':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        return 'O e-mail ou a palavra-passe não estão corretos. Verifique os dados introduzidos e tente novamente.';
      case 'auth/invalid-email':
        return 'O e-mail introduzido não parece válido. Confirme o endereço e tente novamente.';
      case 'auth/too-many-requests':
        return 'Por segurança, o acesso foi temporariamente limitado. Aguarde alguns minutos antes de tentar outra vez.';
      case 'auth/network-request-failed':
        return 'Não foi possível contactar o servidor. Verifique a ligação à internet e tente novamente.';
      default:
        return 'Ocorreu um problema ao validar a sua conta. Tente novamente daqui a pouco.';
    }
  }

  private async mostrarToast(message: string, color: string = 'primary'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}
