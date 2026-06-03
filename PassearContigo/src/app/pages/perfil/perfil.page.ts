import { Component } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth.service';
import { PushNotificationsService } from '../../services/push-notifications.service';

@Component({
  selector: 'app-perfil',
  standalone: false,
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss']
})
export class PerfilPage {
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

  constructor(
    public authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

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
    } catch (error: any) {
      await this.mostrarToast(error?.message || 'Erro ao iniciar sessão.', 'danger');
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
      await this.mostrarToast('Notificações ativadas.', 'success');
    } catch (error: any) {
      console.error('Erro ao ativar notificações:', error);
      await this.mostrarToast(error?.message || 'Erro ao ativar notificações.', 'danger');
    } finally {
      this.ativandoNotificacoes = false;
    }
  }

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
