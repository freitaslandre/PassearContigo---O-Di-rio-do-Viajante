import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { ScreenOrientationService } from './services/screen-orientation.service';
import { EstadoSincronizacaoPoi, POIService } from './services/poi.service';

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
export class AppComponent {
  estadoSincronizacao$: Observable<EstadoSincronizacaoPoi>;

  constructor(
    private screenOrientationService: ScreenOrientationService,
    private poiService: POIService
  ) {
    this.estadoSincronizacao$ = this.poiService.estadoSincronizacao$;

    // Bloqueia a orientação em portrait ao inicializar a app (req. 12)
    this.initializeScreenOrientation();
  }

  /**
   * Inicializa o bloqueio de orientação landscape
   */
  private async initializeScreenOrientation(): Promise<void> {
    await this.screenOrientationService.lockPortraitOrientation();
  }
}
