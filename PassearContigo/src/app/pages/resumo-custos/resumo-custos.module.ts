// app/pages/resumo-custos/resumo-custos.module.ts | Modulo Angular da pagina resumo custos, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ResumoCustosPageRoutingModule } from './resumo-custos-routing.module';

import { ResumoCustosPage } from './resumo-custos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResumoCustosPageRoutingModule
  ],
  declarations: [ResumoCustosPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ResumoCustosPageModule { }
