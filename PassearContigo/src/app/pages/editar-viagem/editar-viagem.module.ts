import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EditarViagemPageRoutingModule } from './editar-viagem-routing.module';
import { EditarViagemPage } from './editar-viagem.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    EditarViagemPageRoutingModule
  ],
  declarations: [EditarViagemPage]
})
export class EditarViagemPageModule {}
