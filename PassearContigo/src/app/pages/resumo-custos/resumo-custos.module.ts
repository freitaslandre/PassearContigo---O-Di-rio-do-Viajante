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
export class ResumoCustosPageModule { }
