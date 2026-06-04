// app/pages/descobrir/descobrir.module.ts | Modulo Angular da pagina descobrir, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DescobrirPage } from './descobrir.page';

import { DescobrirPageRoutingModule } from './descobrir-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DescobrirPageRoutingModule
  ],
  declarations: [DescobrirPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DescobrirPageModule {}
