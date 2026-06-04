// app/pages/editar-viagem/editar-viagem.module.ts | Modulo Angular da pagina editar viagem, onde se declaram dependencias do ecra.
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
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarViagemPageModule {}
