// app/pages/gerir-colaboradores/gerir-colaboradores.module.ts | Modulo Angular da pagina gerir colaboradores, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GerirColaboradoresPageRoutingModule } from './gerir-colaboradores-routing.module';

import { GerirColaboradoresPage } from './gerir-colaboradores.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GerirColaboradoresPageRoutingModule
  ],
  declarations: [GerirColaboradoresPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class GerirColaboradoresPageModule {}
