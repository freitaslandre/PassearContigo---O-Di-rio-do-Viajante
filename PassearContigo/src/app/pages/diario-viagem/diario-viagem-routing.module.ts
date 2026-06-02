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
export class DiarioViagemPageRoutingModule {}
