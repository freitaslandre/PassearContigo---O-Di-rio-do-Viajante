import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';

@Injectable({
  providedIn: 'root'
}
)
export class AuthService {
  // Guarda o estado do utilizador em tempo real (logado ou não)
  user$: Observable<firebase.User | null>;

  constructor(
    private afAuth: AngularFireAuth,
  ) {
    this.user$ = this.afAuth.authState;
  }

  // Método de Login
  login(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }

  // Método de Logout
  logout() {
    return this.afAuth.signOut();
  }

  // Método de Registo (Cria no Auth e grava dados na coleção 'users' do Firestore)
  async registo(email: string, password: string, nome: string) {
    try {
      const credential = await this.afAuth.createUserWithEmailAndPassword(email, password);
      const user = credential.user;

      if (!user) {
        throw new Error('Erro interno: não foi possível obter o utilizador após o registo.');
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
