// app/pages/editar-custo/editar-custo-routing.module.ts | Rotas da pagina editar custo, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditarCustoPage } from './editar-custo.page';

const routes: Routes = [
  {
    path: '',
    component: EditarCustoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarCustoPageRoutingModule { }
