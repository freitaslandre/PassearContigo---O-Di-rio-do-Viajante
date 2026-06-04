// app/pages/diario-viagem/diario-viagem.module.ts | Modulo Angular da pagina diario viagem, onde se declaram dependencias do ecra.
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
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiarioViagemPageModule {}
