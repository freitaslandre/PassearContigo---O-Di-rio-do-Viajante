import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ViagemDetalhePageRoutingModule } from './viagem-detalhe-routing.module';
import { ViagemDetalhePage } from './viagem-detalhe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ViagemDetalhePageRoutingModule
  ],
  declarations: [ViagemDetalhePage]
})
export class ViagemDetalhePageModule {}
