// app/pages/feed-amigos/feed-amigos.module.ts | Modulo Angular da pagina feed amigos, onde se declaram dependencias do ecra.
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { FeedAmigosPageRoutingModule } from './feed-amigos-routing.module';
import { FeedAmigosPage } from './feed-amigos.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    FeedAmigosPageRoutingModule
  ],
  declarations: [FeedAmigosPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class FeedAmigosPageModule {}
