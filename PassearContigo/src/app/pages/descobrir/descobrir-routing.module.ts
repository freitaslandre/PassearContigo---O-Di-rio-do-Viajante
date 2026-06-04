// app/pages/descobrir/descobrir-routing.module.ts | Rotas da pagina descobrir, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DescobrirPage } from './descobrir.page';

const routes: Routes = [
  {
    path: '',
    component: DescobrirPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DescobrirPageRoutingModule {}
