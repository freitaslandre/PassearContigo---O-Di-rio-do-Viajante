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
export class EditarCustoPageModule { }
