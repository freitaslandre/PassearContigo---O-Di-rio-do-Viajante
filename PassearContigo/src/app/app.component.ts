// app/app.component.ts | Componente raiz da aplicacao, responsavel por inicializacao global.
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ScreenOrientationService } from './services/screen-orientation.service';
import { EstadoSincronizacaoPoi, POIService } from './services/poi.service';
import { PushNotificationsService } from './services/push-notifications.service';

/**
 * AppComponent
 * Componente raiz da aplicação
 * Responsável pela estrutura principal da app e roteamento
 */
@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AppComponent {
  estadoSincronizacao$: Observable<EstadoSincronizacaoPoi>;

  constructor(
    private screenOrientationService: ScreenOrientationService,
    private poiService: POIService,
    private pushNotificationsService: PushNotificationsService
  ) {
    this.estadoSincronizacao$ = this.poiService.estadoSincronizacao$;

    // Bloqueia a orientação em portrait ao inicializar a app (req. 12)
    this.initializeScreenOrientation();
    this.pushNotificationsService.inicializar();
  }

  /**
   * Inicializa o bloqueio de orientação landscape
   */
  private async initializeScreenOrientation(): Promise<void> {
    await this.screenOrientationService.lockPortraitOrientation();
  }
}
