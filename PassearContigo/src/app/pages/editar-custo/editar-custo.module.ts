// app/pages/editar-custo/editar-custo.module.ts | Modulo Angular da pagina editar custo, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarCustoPageRoutingModule } from './editar-custo-routing.module';
import { EditarCustoPage } from './editar-custo.page';

@NgModule({
  declarations: [EditarCustoPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarCustoPageRoutingModule
  ]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarCustoPageModule { }
