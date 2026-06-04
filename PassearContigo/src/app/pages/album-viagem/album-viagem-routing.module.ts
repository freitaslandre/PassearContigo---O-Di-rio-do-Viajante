// app/pages/album-viagem/album-viagem-routing.module.ts | Rotas da pagina album viagem, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumViagemPage } from './album-viagem.page';

const routes: Routes = [
  {
    path: '',
    component: AlbumViagemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AlbumViagemPageRoutingModule {}
