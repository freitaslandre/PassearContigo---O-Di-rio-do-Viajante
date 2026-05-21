import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DescubrirPage } from './descobrir.page';

const routes: Routes = [
  {
    path: '',
    component: DescubrirPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DescubrirPageRoutingModule {}
