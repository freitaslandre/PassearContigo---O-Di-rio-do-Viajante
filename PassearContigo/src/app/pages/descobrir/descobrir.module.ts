import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { DescubrirPage } from './descobrir.page';

import { DescubrirPageRoutingModule } from './descobrir-routing.module';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DescubrirPageRoutingModule
  ],
  declarations: [DescubrirPage]
})
export class DescubrirPageModule {}
