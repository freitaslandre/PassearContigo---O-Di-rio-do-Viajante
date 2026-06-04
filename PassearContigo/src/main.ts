// main.ts | Ponto de entrada da aplicacao Angular/Ionic.
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

// Importa dependencias usadas neste ficheiro.
import { AppModule } from './app/app.module';

// Define um metodo chamado pela pagina ou por outros metodos.
platformBrowserDynamic().bootstrapModule(AppModule)
  // Executa uma instrucao necessaria para este fluxo.
  .catch(err => console.log(err));
