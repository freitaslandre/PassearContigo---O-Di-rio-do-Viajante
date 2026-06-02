import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResumoCustosPage } from './resumo-custos.page';

const routes: Routes = [
  {
    path: '',
    component: ResumoCustosPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResumoCustosPageRoutingModule { }
