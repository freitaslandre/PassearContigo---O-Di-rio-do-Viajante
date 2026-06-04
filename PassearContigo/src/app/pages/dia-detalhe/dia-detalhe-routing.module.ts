// app/pages/dia-detalhe/dia-detalhe-routing.module.ts | Rotas da pagina dia detalhe, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiaDetalhePage } from './dia-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: DiaDetalhePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiaDetalhePageRoutingModule { }
