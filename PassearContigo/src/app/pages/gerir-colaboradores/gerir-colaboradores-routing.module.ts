// app/pages/gerir-colaboradores/gerir-colaboradores-routing.module.ts | Rotas da pagina gerir colaboradores, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GerirColaboradoresPage } from './gerir-colaboradores.page';

/** Rota da página de gestão de colaboradores. */
const routes: Routes = [
  { path: '', component: GerirColaboradoresPage }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class GerirColaboradoresPageRoutingModule {}
