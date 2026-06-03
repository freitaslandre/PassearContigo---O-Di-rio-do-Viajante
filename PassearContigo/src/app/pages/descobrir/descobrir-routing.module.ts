import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DescobrirPage } from './descobrir.page';

const routes: Routes = [
  {
    path: '',
    component: DescobrirPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class DescobrirPageRoutingModule {}
