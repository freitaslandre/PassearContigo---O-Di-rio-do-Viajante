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
export class GerirColaboradoresPageRoutingModule {}
