import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdicionarPoiPage } from './adicionar-poi.page';

const routes: Routes = [
  {
    path: '',
    component: AdicionarPoiPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AdicionarPoiPageRoutingModule {}
