// app/pages/editar-viagem/editar-viagem-routing.module.ts | Rotas da pagina editar viagem, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditarViagemPage } from './editar-viagem.page';

const routes: Routes = [
  {
    path: '',
    component: EditarViagemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarViagemPageRoutingModule {}
