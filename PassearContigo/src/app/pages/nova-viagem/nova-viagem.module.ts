// app/pages/nova-viagem/nova-viagem.module.ts | Modulo Angular da pagina nova viagem, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NovaViagemPageRoutingModule } from './nova-viagem-routing.module';
import { NovaViagemPage } from './nova-viagem.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    NovaViagemPageRoutingModule
  ],
  declarations: [NovaViagemPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class NovaViagemPageModule {}
