import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { AlbumViagemPageRoutingModule } from './album-viagem-routing.module';
import { AlbumViagemPage } from './album-viagem.page';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    AlbumViagemPageRoutingModule
  ],
  declarations: [AlbumViagemPage]
})
export class AlbumViagemPageModule {}
