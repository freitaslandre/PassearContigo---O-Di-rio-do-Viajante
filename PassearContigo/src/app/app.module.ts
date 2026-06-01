import { APP_INITIALIZER, NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { IonicStorageModule } from '@ionic/storage-angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { AngularFireModule, FirebaseApp } from '@angular/fire/compat';
import { AngularFireAuthModule } from '@angular/fire/compat/auth';
import { AngularFirestoreModule } from '@angular/fire/compat/firestore';
import { enableIndexedDbPersistence, getFirestore } from 'firebase/firestore';
import { environment } from '../environments/environment';

export function ativarPersistenciaOfflineFirestore(_app: FirebaseApp): () => Promise<void> {
  return async () => {
    try {
      await enableIndexedDbPersistence(getFirestore());
    } catch (error: any) {
      if (error?.code === 'failed-precondition') {
        console.warn('Persistencia offline do Firestore ja esta ativa noutra aba.');
        return;
      }

      if (error?.code === 'unimplemented') {
        console.warn('Este browser nao suporta persistencia offline do Firestore.');
        return;
      }

      console.warn('Nao foi possivel ativar a persistencia offline do Firestore:', error);
    }
  };
}

/**
 * AppModule
 * Módulo raiz da aplicação
 * Configura os módulos principais e fornecedores necessários
 */
@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot(),
    IonicStorageModule.forRoot(),
    AngularFireModule.initializeApp(environment.firebaseConfig),
    AngularFireAuthModule,
    AngularFirestoreModule,
    AppRoutingModule
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    {
      provide: APP_INITIALIZER,
      useFactory: ativarPersistenciaOfflineFirestore,
      deps: [FirebaseApp],
      multi: true
    }
  ],
  bootstrap: [AppComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class AppModule {}
