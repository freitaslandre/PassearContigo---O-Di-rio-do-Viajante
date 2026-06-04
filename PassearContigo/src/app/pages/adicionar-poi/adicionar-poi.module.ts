// app/pages/adicionar-poi/adicionar-poi.module.ts | Modulo Angular da pagina adicionar poi, onde se declaram dependencias do ecra.
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
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AdicionarPoiPageModule {}
