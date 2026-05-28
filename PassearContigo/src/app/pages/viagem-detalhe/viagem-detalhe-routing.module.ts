import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViagemDetalhePage } from './viagem-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: ViagemDetalhePage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViagemDetalhePageRoutingModule {}
