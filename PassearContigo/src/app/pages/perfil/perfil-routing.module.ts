// app/pages/perfil/perfil-routing.module.ts | Rotas da pagina perfil, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfilPage } from './perfil.page';

/** Rotas da área de perfil e feed de amigos. */
const routes: Routes = [
  {
    path: 'feed',
    redirectTo: '/tabs/feed',
    pathMatch: 'full'
  },
  { path: '', component: PerfilPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PerfilPageRoutingModule {}
