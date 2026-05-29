import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NovaViagemPageRoutingModule } from './nova-viagem-routing.module';
import { NovaViagemPage } from './nova-viagem.page';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonicModule,
    NovaViagemPageRoutingModule
  ],
  declarations: [NovaViagemPage]
})
export class NovaViagemPageModule {}
