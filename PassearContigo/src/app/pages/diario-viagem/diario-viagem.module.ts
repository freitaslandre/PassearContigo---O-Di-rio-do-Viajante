import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { DiarioViagemPageRoutingModule } from './diario-viagem-routing.module';
import { DiarioViagemPage } from './diario-viagem.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiarioViagemPageRoutingModule
  ],
  declarations: [DiarioViagemPage]
})
export class DiarioViagemPageModule {}
