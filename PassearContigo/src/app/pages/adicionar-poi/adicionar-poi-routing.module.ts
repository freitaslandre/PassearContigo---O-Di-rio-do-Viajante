// app/pages/adicionar-poi/adicionar-poi-routing.module.ts | Rotas da pagina adicionar poi, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdicionarPoiPage } from './adicionar-poi.page';

const routes: Routes = [
  {
    path: '',
    component: AdicionarPoiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AdicionarPoiPageRoutingModule {}
