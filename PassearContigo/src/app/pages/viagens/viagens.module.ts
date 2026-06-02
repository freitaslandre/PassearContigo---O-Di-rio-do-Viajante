import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ViagensPageRoutingModule } from './viagens-routing.module';
import { ViagensPage } from './viagens.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ViagensPageRoutingModule
  ],
  declarations: [ViagensPage]
})
export class ViagensPageModule {}
