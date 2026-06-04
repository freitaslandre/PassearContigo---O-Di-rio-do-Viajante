// app/pages/album-viagem/album-viagem.module.ts | Modulo Angular da pagina album viagem, onde se declaram dependencias do ecra.
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
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AlbumViagemPageModule {}
