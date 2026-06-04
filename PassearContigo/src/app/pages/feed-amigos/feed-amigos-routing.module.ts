// app/pages/feed-amigos/feed-amigos-routing.module.ts | Rotas da pagina feed amigos, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { FeedAmigosPage } from './feed-amigos.page';

/** Rota da página do feed de amigos. */
const routes: Routes = [
  { path: '', component: FeedAmigosPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class FeedAmigosPageRoutingModule {}
