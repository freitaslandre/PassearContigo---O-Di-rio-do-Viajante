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
export class GerirColaboradoresPageModule {}
