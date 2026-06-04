// app/pages/detalhe-poi/detalhe-poi-routing.module.ts | Rotas da pagina detalhe poi, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DetalhePoiPage } from './detalhe-poi.page';

const routes: Routes = [
  {
    path: '',
    component: DetalhePoiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DetalhePoiPageRoutingModule { }
