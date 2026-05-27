import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { PerfilPage } from './perfil.page';

@NgModule({
  imports: [
    RouterModule.forChild([{ path: '', component: PerfilPage }]),
    PerfilPage
  ]
})
export class PerfilPageModule {}
