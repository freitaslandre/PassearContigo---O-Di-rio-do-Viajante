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
export class ItinerarioDiaPageRoutingModule {}
