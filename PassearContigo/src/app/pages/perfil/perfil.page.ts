import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonItem, IonLabel, IonInput } from '@ionic/angular/standalone';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonCard, 
    IonCardHeader, 
    IonCardTitle, 
    IonCardSubtitle, 
    IonCardContent, 
    IonButton, 
    IonItem, 
    IonLabel, 
    IonInput
  ]
})
export class PerfilPage implements OnInit {
  loginForm!: FormGroup;
  registoForm!: FormGroup;
  
  // Alterna o ecrã entre o formulário de Login e o de Registo
  modoRegisto: boolean = false;

  constructor(
    private fb: FormBuilder,
    public authService: AuthService // Colocamos 'public' para aceder ao user$ diretamente no HTML
  ) {}

  ngOnInit() {
    // Requisito: Reactive Forms para o Login
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });

    // Requisito: Reactive Forms para o Registo
    this.registoForm = this.fb.group({
      nome: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Chamar o método login do AuthService
  async realizarLogin() {
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      try {
        await this.authService.login(email, password);
        alert('Sessão iniciada com sucesso!');
      } catch (error: any) {
        alert('Erro ao entrar: ' + error.message);
      }
    }
  }

  // Chamar o método registo do AuthService (Guarda no Auth + Firestore)
  async realizarRegisto() {
    if (this.registoForm.valid) {
      const { email, password, nome } = this.registoForm.value;
      try {
        await this.authService.registo(email, password, nome);
        alert('Utilizador registado e salvo no Firestore!');
        this.modoRegisto = false;
      } catch (error: any) {
        alert('Erro ao registar: ' + error.message);
      }
    }
  }

  // Chamar o método logout do AuthService
  async realizarLogout() {
    await this.authService.logout();
    alert('Sessão terminada.');
  }
}
