import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { DetalhePoiPageRoutingModule } from './detalhe-poi-routing.module';
import { DetalhePoiPage } from './detalhe-poi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    DetalhePoiPageRoutingModule
  ],
  declarations: [DetalhePoiPage]
})
export class DetalhePoiPageModule { }
