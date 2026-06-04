// app/pages/viagens/viagens.module.ts | Modulo Angular da pagina viagens, onde se declaram dependencias do ecra.
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
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensPageModule {}
