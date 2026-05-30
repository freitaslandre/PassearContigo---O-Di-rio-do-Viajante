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
export class DiaDetalhePageRoutingModule { }
