// app/services/push-notifications.service.ts | Servico da aplicacao responsavel por uma area de negocio ou integracao externa.
import { Injectable } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { AngularFireAuth } from '@angular/fire/compat/auth';
// Importa dependencias usadas neste ficheiro.
import { doc, getFirestore, serverTimestamp, setDoc, collection, getDocs } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { getMessaging, getToken, isSupported, onMessage } from 'firebase/messaging';
// Importa dependencias usadas neste ficheiro.
import { ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { environment } from '../../environments/environment';

// Aplica metadados/decoradores ao elemento seguinte.
@Injectable({
  // Define um campo ou opcao de configuracao.
  providedIn: 'root'
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PushNotificationsService {
  // Define um membro interno desta classe.
  private inicializado = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private afAuth: AngularFireAuth,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  inicializar(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.inicializado) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.inicializado = true;

    // Atualiza ou consulta estado da pagina.
    this.afAuth.authState.subscribe(user => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!user) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.registarTokenDoUtilizador(user.uid).catch(error => {
        // Executa uma instrucao necessaria para este fluxo.
        console.warn('Não foi possível registar token FCM:', error);
      });
    });

    // Atualiza ou consulta estado da pagina.
    this.escutarMensagensEmPrimeiroPlano();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async ativarNotificacoes(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const user = await this.afAuth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para ativar notificações.');
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.registarTokenDoUtilizador(user.uid, true);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async desativarNotificacoes(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const user = await this.afAuth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('É necessário iniciar sessão para desativar notificações.');
    }

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const tokensCol = collection(db, 'users', user.uid, 'fcmTokens');
    // Cria uma variavel local para esta operacao.
    const snapshot = await getDocs(tokensCol);

    // Cria uma variavel local para esta operacao.
    const promises: Promise<void>[] = [];

    // Executa uma instrucao necessaria para este fluxo.
    snapshot.forEach(docSnap => {
      // Cria uma variavel local para esta operacao.
      const tokenRef = doc(db, 'users', user.uid, 'fcmTokens', docSnap.id);
      // Executa uma instrucao necessaria para este fluxo.
      promises.push(
        // Define um metodo chamado pela pagina ou por outros metodos.
        setDoc(tokenRef, { ativo: false, atualizadoEm: serverTimestamp() }, { merge: true })
      );
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await Promise.all(promises);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async notificacoesAtivas(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const user = await this.afAuth.currentUser;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!user) {
      // Devolve o resultado deste bloco.
      return false;
    }

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const tokensCol = collection(db, 'users', user.uid, 'fcmTokens');
    // Cria uma variavel local para esta operacao.
    const snapshot = await getDocs(tokensCol);

    // Cria uma variavel local para esta operacao.
    let anyActive = false;

    // Executa uma instrucao necessaria para este fluxo.
    snapshot.forEach(docSnap => {
      // Cria uma variavel local para esta operacao.
      const data = docSnap.data() as any;
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (data?.ativo) {
        // Atribui um valor a esta propriedade.
        anyActive = true;
      }
    });

    // Devolve o resultado deste bloco.
    return anyActive;
  }

  // Define um membro interno desta classe.
  private async registarTokenDoUtilizador(uid: string, forcarPedidoPermissao = false): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const suportado = await this.fcmSuportado();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!suportado || !environment.firebaseMessagingVapidKey) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof Notification === 'undefined') {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    let permission = Notification.permission;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (permission === 'default' && forcarPedidoPermissao) {
      // Atribui um valor a esta propriedade.
      permission = await Notification.requestPermission();
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (permission !== 'granted') {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    // Cria uma variavel local para esta operacao.
    const messaging = getMessaging();
    // Cria uma variavel local para esta operacao.
    const token = await getToken(messaging, {
      // Define um campo ou opcao de configuracao.
      vapidKey: environment.firebaseMessagingVapidKey,
      // Define um campo ou opcao de configuracao.
      serviceWorkerRegistration: registration
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!token) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const db = getFirestore();
    // Cria uma variavel local para esta operacao.
    const tokenId = this.normalizarTokenId(token);
    // Cria uma variavel local para esta operacao.
    const tokenRef = doc(db, 'users', uid, 'fcmTokens', tokenId);

    // Aguarda a conclusao de uma operacao assincrona.
    await setDoc(tokenRef, {
      // Executa uma instrucao necessaria para este fluxo.
      token,
      // Define um campo ou opcao de configuracao.
      plataforma: 'web',
      // Define um campo ou opcao de configuracao.
      ativo: true,
      // Define um campo ou opcao de configuracao.
      atualizadoEm: serverTimestamp()
    // Executa uma instrucao necessaria para este fluxo.
    }, { merge: true });
  }

  // Define um membro interno desta classe.
  private async escutarMensagensEmPrimeiroPlano(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const suportado = await this.fcmSuportado();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!suportado) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const messaging = getMessaging();

    // Define um metodo chamado pela pagina ou por outros metodos.
    onMessage(messaging, async payload => {
      // Cria uma variavel local para esta operacao.
      const notification = payload.notification;

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!notification?.title && !notification?.body) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        header: notification.title || 'PassearContigo',
        // Define um campo ou opcao de configuracao.
        message: notification.body || 'Tem uma nova notificação.',
        // Define um campo ou opcao de configuracao.
        duration: 3500,
        // Define um campo ou opcao de configuracao.
        position: 'top',
        // Define um campo ou opcao de configuracao.
        color: 'secondary'
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    });
  }

  // Define um membro interno desta classe.
  private async fcmSuportado(): Promise<boolean> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      // Devolve o resultado deste bloco.
      return false;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Devolve o resultado deste bloco.
      return await isSupported();
    // Executa uma instrucao necessaria para este fluxo.
    } catch {
      // Devolve o resultado deste bloco.
      return false;
    }
  }

  // Define um membro interno desta classe.
  private normalizarTokenId(token: string): string {
    // Devolve o resultado deste bloco.
    return token.replace(/\//g, '_');
  }
}
