import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { PerfilPage } from './perfil.page'; // Mantém o import no topo

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ReactiveFormsModule,
    RouterModule.forChild([{ path: '', component: PerfilPage }]),
    PerfilPage // <-- ADICIONA AQUI (Como ela é standalone, entra nos imports!)
  ],
  declarations: [] // <-- DEIXA ESTE ARRAY TOTALMENTE VAZIO (Remove o PerfilPage daqui)
})
export class PerfilPageModule {}