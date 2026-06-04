// app/pages/itinerario-dia/itinerario-dia.module.ts | Modulo Angular da pagina itinerario dia, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

import { ItinerarioDiaPageRoutingModule } from './itinerario-dia-routing.module';
import { ItinerarioDiaPage } from './itinerario-dia.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    ItinerarioDiaPageRoutingModule
  ],
  declarations: [ItinerarioDiaPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ItinerarioDiaPageModule {}
