import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViagemDetalhePage } from './viagem-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: ViagemDetalhePage
  },
  {
    path: 'dias/:diaId',
    loadChildren: () => import('./../../pages/dia-detalhe/dia-detalhe.module').then(m => m.DiaDetalhePageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViagemDetalhePageRoutingModule {}
