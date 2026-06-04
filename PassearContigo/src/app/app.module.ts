// app/app.module.ts | Modulo raiz da aplicacao, onde sao ligados providers e modulos globais.
import { APP_INITIALIZER, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { BrowserModule } from '@angular/platform-browser';
// Importa dependencias usadas neste ficheiro.
import { RouteReuseStrategy } from '@angular/router';

// Importa dependencias usadas neste ficheiro.
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { IonicStorageModule } from '@ionic/storage-angular';

// Importa dependencias usadas neste ficheiro.
import { AppComponent } from './app.component';
// Importa dependencias usadas neste ficheiro.
import { AppRoutingModule } from './app-routing.module';
// Importa dependencias usadas neste ficheiro.
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
// Importa dependencias usadas neste ficheiro.
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
// Importa dependencias usadas neste ficheiro.
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
// Importa dependencias usadas neste ficheiro.
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { environment } from '../environments/environment';

// Executa uma instrucao necessaria para este fluxo.
export function ativarPersistenciaOfflineFirestore(_app: FirebaseApp): () => Promise<void> {
  // Devolve o resultado deste bloco.
  return async () => {
    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await enableIndexedDbPersistence(getFirestore());
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.code === 'failed-precondition') {
        // Executa uma instrucao necessaria para este fluxo.
        console.warn('Persistência offline do Firestore já está ativa noutra aba.');
        // Devolve o resultado deste bloco.
        return;
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.code === 'unimplemented') {
        // Executa uma instrucao necessaria para este fluxo.
        console.warn('Este browser não suporta persistência offline do Firestore.');
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Não foi possível ativar a persistência offline do Firestore:', error);
    }
  };
}

/**
 * AppModule
 * Módulo raiz da aplicação
 * Configura os módulos principais e fornecedores necessários
 */
@NgModule({
  // Define um campo ou opcao de configuracao.
  declarations: [AppComponent],
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    BrowserModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule.forRoot(),
    // Executa uma instrucao necessaria para este fluxo.
    IonicStorageModule.forRoot(),
    // Executa uma instrucao necessaria para este fluxo.
    AngularFireModule.initializeApp(environment.firebaseConfig),
    // Executa uma instrucao necessaria para este fluxo.
    AngularFireAuthModule,
    // Executa uma instrucao necessaria para este fluxo.
    AngularFirestoreModule,
    // Executa uma instrucao necessaria para este fluxo.
    AppRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  providers: [
    // Executa uma instrucao necessaria para este fluxo.
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    // Executa uma instrucao necessaria para este fluxo.
    {
      // Define um campo ou opcao de configuracao.
      provide: APP_INITIALIZER,
      // Define um campo ou opcao de configuracao.
      useFactory: ativarPersistenciaOfflineFirestore,
      // Define um campo ou opcao de configuracao.
      deps: [FirebaseApp],
      // Define um campo ou opcao de configuracao.
      multi: true
    }
  ],
  // Define um campo ou opcao de configuracao.
  bootstrap: [AppComponent],
  // Define um campo ou opcao de configuracao.
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AppModule {}
