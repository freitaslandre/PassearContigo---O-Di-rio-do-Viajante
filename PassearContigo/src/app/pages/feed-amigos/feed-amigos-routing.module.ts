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
export class FeedAmigosPageRoutingModule {}
