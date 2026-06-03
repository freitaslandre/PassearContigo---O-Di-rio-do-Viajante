import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PerfilPage } from './perfil.page';

/** Rotas da área de perfil e feed de amigos. */
const routes: Routes = [
  {
    path: 'feed',
    redirectTo: '/tabs/amigos',
    pathMatch: 'full'
  },
  { path: '', component: PerfilPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class PerfilPageRoutingModule {}
