// app/pages/itinerario-dia/itinerario-dia.module.ts | Modulo Angular da pagina itinerario dia, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';

// Importa dependencias usadas neste ficheiro.
import { ItinerarioDiaPageRoutingModule } from './itinerario-dia-routing.module';
// Importa dependencias usadas neste ficheiro.
import { ItinerarioDiaPage } from './itinerario-dia.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    ItinerarioDiaPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [ItinerarioDiaPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ItinerarioDiaPageModule {}
