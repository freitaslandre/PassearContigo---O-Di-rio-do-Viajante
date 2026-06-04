// app/pages/nova-viagem/nova-viagem-routing.module.ts | Rotas da pagina nova viagem, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NovaViagemPage } from './nova-viagem.page';

const routes: Routes = [
  {
    path: '',
    component: NovaViagemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class NovaViagemPageRoutingModule {}
