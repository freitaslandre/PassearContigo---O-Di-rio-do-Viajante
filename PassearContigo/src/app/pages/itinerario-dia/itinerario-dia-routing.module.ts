// app/pages/itinerario-dia/itinerario-dia-routing.module.ts | Rotas da pagina itinerario dia, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ItinerarioDiaPage } from './itinerario-dia.page';

const routes: Routes = [
  {
    path: '',
    component: ItinerarioDiaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ItinerarioDiaPageRoutingModule {}
