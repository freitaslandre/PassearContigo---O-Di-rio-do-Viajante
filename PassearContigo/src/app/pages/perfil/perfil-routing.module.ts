import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfilPage } from './perfil.page';

/** Rotas da área de perfil e feed de amigos. */
const routes: Routes = [
  {
    path: 'feed',
    loadChildren: () => import('../feed-amigos/feed-amigos.module').then(m => m.FeedAmigosPageModule)
  },
  { path: '', component: PerfilPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerfilPageRoutingModule {}
