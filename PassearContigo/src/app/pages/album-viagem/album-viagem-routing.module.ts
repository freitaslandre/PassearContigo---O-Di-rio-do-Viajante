import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AlbumViagemPage } from './album-viagem.page';

const routes: Routes = [
  {
    path: '',
    component: AlbumViagemPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AlbumViagemPageRoutingModule {}
