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
export class NovaViagemPageRoutingModule {}
