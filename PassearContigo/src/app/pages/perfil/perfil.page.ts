import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';

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

  constructor(public authService: AuthService) {}

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
}
