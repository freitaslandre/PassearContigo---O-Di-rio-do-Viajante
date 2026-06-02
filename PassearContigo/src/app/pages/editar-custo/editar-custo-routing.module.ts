import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EditarCustoPage } from './editar-custo.page';

const routes: Routes = [
  {
    path: '',
    component: EditarCustoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditarCustoPageRoutingModule { }
