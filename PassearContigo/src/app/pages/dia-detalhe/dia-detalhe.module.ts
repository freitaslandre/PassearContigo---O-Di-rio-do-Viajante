import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DiaDetalhePageRoutingModule } from './dia-detalhe-routing.module';
import { DiaDetalhePage } from './dia-detalhe.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DiaDetalhePageRoutingModule
  ],
  declarations: [DiaDetalhePage]
})
export class DiaDetalhePageModule { }
