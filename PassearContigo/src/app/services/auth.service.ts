import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  /** Estado do utilizador autenticado, actualizado em tempo real pelo Firebase. */
  user$: Observable<firebase.User | null>;

  /** Injeta o serviço de autenticação Firebase e expõe o estado actual. */
  constructor(private afAuth: AngularFireAuth) {
    this.user$ = this.afAuth.authState;
  }

  /** Inicia sessão com email e palavra-passe. */
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  /** Termina a sessão do utilizador actual. */
  logout() {
    return this.afAuth.signOut();
  }

  /** Cria a conta no Firebase Authentication e guarda o perfil inicial no Firestore. */
  async registo(email: string, password: string, nome: string) {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = credential.user;

      if (!user) {
        throw new Error('Erro interno: nao foi possivel obter o utilizador apos o registo.');
      }

      const userDoc = firebase.firestore().doc(`users/${user.uid}`);

      await userDoc.set({
        uid: user.uid,
        nome,
        email,
        criadoEm: new Date()
      }, { merge: true });

      return user;
    } catch (error) {
      console.error('AuthService.registo falhou ao criar utilizador no Firestore:', error);
      throw error;
    }
  }
}
