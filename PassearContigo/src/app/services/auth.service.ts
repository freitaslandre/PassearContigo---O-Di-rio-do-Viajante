// app/services/auth.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { AngularFireAuth } from '@angular/fire/compat/auth';
// Importa dependencias usadas neste ficheiro.
import { Observable } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import firebase from 'firebase/compat/app';
// Importa dependencias usadas neste ficheiro.
import 'firebase/compat/firestore';

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AuthService {
  /** Estado do utilizador autenticado, actualizado em tempo real pelo Firebase. */
  user$: Observable<firebase.User | null>;

  /** Injeta o serviço de autenticação Firebase e expõe o estado actual. */
  constructor(private afAuth: AngularFireAuth) {
    // Atualiza ou consulta estado da pagina.
    this.user$ = this.afAuth.authState;
  }

  /** Inicia sessão com email e palavra-passe. */
  login(email: string, password: string) {
    // Devolve o resultado deste bloco.
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  /** Termina a sessão do utilizador actual. */
  logout() {
    // Devolve o resultado deste bloco.
    return this.afAuth.signOut();
  }

  /** Cria a conta no Firebase Authentication e guarda o perfil inicial no Firestore. */
  async registo(email: string, password: string, nome: string) {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      // Cria uma variavel local para esta operacao.
      const user = credential.user;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!user) {
        // Executa uma instrucao necessaria para este fluxo.
        throw new Error('Erro interno: não foi possível obter o utilizador após o registo.');
      }

      // Cria uma variavel local para esta operacao.
      const userDoc = firebase.firestore().doc(`users/${user.uid}`);

      // Aguarda a conclusao de uma operacao assincrona.
      await userDoc.set({
        // Define um campo ou opcao de configuracao.
        uid: user.uid,
        // Executa uma instrucao necessaria para este fluxo.
        nome,
        // Executa uma instrucao necessaria para este fluxo.
        email,
        // Define um campo ou opcao de configuracao.
        criadoEm: new Date()
      // Executa uma instrucao necessaria para este fluxo.
      }, { merge: true });

      // Devolve o resultado deste bloco.
      return user;
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('AuthService.registo falhou ao criar utilizador no Firestore:', error);
      // Executa uma instrucao necessaria para este fluxo.
      throw error;
    }
  }
}
