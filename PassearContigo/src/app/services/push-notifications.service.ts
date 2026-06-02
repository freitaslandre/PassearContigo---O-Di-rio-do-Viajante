import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { doc, getFirestore, serverTimestamp, setDoc } from 'firebase/firestore';
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
import { ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PushNotificationsService {
  private inicializado = false;

  constructor(
    private afAuth: AngularFireAuth,
    private toastCtrl: ToastController
  ) {}

  inicializar(): void {
    if (this.inicializado) {
      return;
    }

    this.inicializado = true;

    this.afAuth.authState.subscribe(user => {
      if (!user) {
        return;
      }

      this.registarTokenDoUtilizador(user.uid).catch(error => {
        console.warn('Nao foi possivel registar token FCM:', error);
      });
    });

    this.escutarMensagensEmPrimeiroPlano();
  }

  async ativarNotificacoes(): Promise<void> {
    const user = await this.afAuth.currentUser;

    if (!user) {
      throw new Error('E necessario iniciar sessao para ativar notificacoes.');
    }

    await this.registarTokenDoUtilizador(user.uid, true);
  }

  private async registarTokenDoUtilizador(uid: string, forcarPedidoPermissao = false): Promise<void> {
    const suportado = await this.fcmSuportado();

    if (!suportado || !environment.firebaseMessagingVapidKey) {
      return;
    }

    if (typeof Notification === 'undefined') {
      return;
    }

    let permission = Notification.permission;

    if (permission === 'default' && forcarPedidoPermissao) {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: environment.firebaseMessagingVapidKey,
      serviceWorkerRegistration: registration
    });

    if (!token) {
      return;
    }

    const db = getFirestore();
    const tokenId = this.normalizarTokenId(token);
    const tokenRef = doc(db, 'users', uid, 'fcmTokens', tokenId);

    await setDoc(tokenRef, {
      token,
      plataforma: 'web',
      ativo: true,
      atualizadoEm: serverTimestamp()
    }, { merge: true });
  }

  private async escutarMensagensEmPrimeiroPlano(): Promise<void> {
    const suportado = await this.fcmSuportado();

    if (!suportado) {
      return;
    }

    const messaging = getMessaging();

    onMessage(messaging, async payload => {
      const notification = payload.notification;

      if (!notification?.title && !notification?.body) {
        return;
      }

      const toast = await this.toastCtrl.create({
        header: notification.title || 'PassearContigo',
        message: notification.body || 'Tem uma nova notificacao.',
        duration: 3500,
        position: 'top',
        color: 'secondary'
      });

      await toast.present();
    });
  }

  private async fcmSuportado(): Promise<boolean> {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return false;
    }

    try {
      return await isSupported();
    } catch {
      return false;
    }
  }

  private normalizarTokenId(token: string): string {
    return token.replace(/\//g, '_');
  }
}
