import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { AuthService } from '../../services/auth';
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
  
  modoRegisto: boolean = false;
  ativandoNotificacoes = false;

  constructor(
    public authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
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

  private emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async realizarLogin() {
    if (this.loginValido()) {
      const { email, password } = this.login;
      try {
        await this.authService.login(email, password);
        alert('Sessão iniciada com sucesso!');
      } catch (error: any) {
        alert('Erro ao entrar: ' + error.message);
      }
    }
  }

  async realizarRegisto() {
    if (this.registoValido()) {
      const { email, password, nome } = this.registo;
      try {
        await this.authService.registo(email, password, nome);
        alert('Utilizador registado e salvo no Firestore!');
        this.modoRegisto = false;
      } catch (error: any) {
        alert('Erro ao registar: ' + error.message);
      }
    }
  }

  async realizarLogout() {
    await this.authService.logout();
    alert('Sessão terminada.');
  }

  async ativarNotificacoesPush() {
    if (this.ativandoNotificacoes) return;

    this.ativandoNotificacoes = true;

    try {
      await this.pushNotificationsService.ativarNotificacoes();
      await this.mostrarToast('Notificacoes push ativadas.', 'success');
    } catch (error: any) {
      console.error('Erro ao ativar notificacoes push:', error);
      await this.mostrarToast(error?.message || 'Erro ao ativar notificacoes.', 'danger');
    } finally {
      this.ativandoNotificacoes = false;
    }
  }

  private async mostrarToast(message: string, color: string = 'primary') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2500,
      position: 'bottom',
      color
    });

    await toast.present();
  }
}
