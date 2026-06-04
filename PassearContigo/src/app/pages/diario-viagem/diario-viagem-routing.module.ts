// app/pages/diario-viagem/diario-viagem-routing.module.ts | Rotas da pagina diario viagem, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DiarioViagemPage } from './diario-viagem.page';

const routes: Routes = [
  {
    path: '',
    component: DiarioViagemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiarioViagemPageRoutingModule {}
