// app/app.component.ts | Componente raiz da aplicacao, responsavel por inicializacao global.
import { Component } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { Observable } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { ScreenOrientationService } from './services/screen-orientation.service';
// Importa dependencias usadas neste ficheiro.
import { EstadoSincronizacaoPoi, POIService } from './services/poi.service';
// Importa dependencias usadas neste ficheiro.
import { PushNotificationsService } from './services/push-notifications.service';

/**
 * AppComponent
 * Componente raiz da aplicação
 * Responsável pela estrutura principal da app e roteamento
 */
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-root',
  // Define um campo ou opcao de configuracao.
  templateUrl: 'app.component.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['app.component.scss'],
  // Define um campo ou opcao de configuracao.
  standalone: false,
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AppComponent {
  // Define um campo ou opcao de configuracao.
  estadoSincronizacao$: Observable<EstadoSincronizacaoPoi>;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private screenOrientationService: ScreenOrientationService,
    // Define um membro interno desta classe.
    private poiService: POIService,
    // Define um membro interno desta classe.
    private pushNotificationsService: PushNotificationsService
  // Executa uma instrucao necessaria para este fluxo.
  ) {
    // Atualiza ou consulta estado da pagina.
    this.estadoSincronizacao$ = this.poiService.estadoSincronizacao$;

    // Bloqueia a orientação em portrait ao inicializar a app (req. 12)
    this.initializeScreenOrientation();
    // Atualiza ou consulta estado da pagina.
    this.pushNotificationsService.inicializar();
  }

  /**
   * Inicializa o bloqueio de orientação landscape
   */
  private async initializeScreenOrientation(): Promise<void> {
    // Aguarda a conclusao de uma operacao assincrona.
    await this.screenOrientationService.lockPortraitOrientation();
  }
}
