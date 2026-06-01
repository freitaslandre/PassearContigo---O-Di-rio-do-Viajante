import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { IonicModule } from '@ionic/angular';

import { AdicionarPoiPageRoutingModule } from './adicionar-poi-routing.module';
import { AdicionarPoiPage } from './adicionar-poi.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    IonicModule,
    AdicionarPoiPageRoutingModule
  ],
  declarations: [AdicionarPoiPage]
})
export class AdicionarPoiPageModule {}
