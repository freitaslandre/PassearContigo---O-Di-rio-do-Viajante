import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { Observable } from 'rxjs';
import firebase from 'firebase/compat/app';

@Injectable({
  providedIn: 'root'
}
)
export class AuthService {
  // Guarda o estado do utilizador em tempo real (logado ou não)
  user$: Observable<firebase.User | null>;

  constructor(
    private afAuth: AngularFireAuth,
    private afs: AngularFirestore
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

      if (user) {
        // Guarda o nome e o email associados ao UID único do utilizador
        await this.afs.collection('users').doc(user.uid).set({
          uid: user.uid,
          nome: nome,
          email: email,
          criadoEm: new Date()
        });
      }
      return user;
    } catch (error) {
      throw error;
    }
  }
}
