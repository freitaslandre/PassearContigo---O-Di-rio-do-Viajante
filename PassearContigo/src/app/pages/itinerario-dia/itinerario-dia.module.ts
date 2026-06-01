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
export class ItinerarioDiaPageModule {}
