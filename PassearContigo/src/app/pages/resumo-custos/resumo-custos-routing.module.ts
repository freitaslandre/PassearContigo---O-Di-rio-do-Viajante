// app/pages/resumo-custos/resumo-custos-routing.module.ts | Rotas da pagina resumo custos, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResumoCustosPage } from './resumo-custos.page';

const routes: Routes = [
  {
    path: '',
    component: ResumoCustosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ResumoCustosPageRoutingModule { }
