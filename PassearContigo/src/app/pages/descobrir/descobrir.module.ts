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
export class DescobrirPageModule {}
