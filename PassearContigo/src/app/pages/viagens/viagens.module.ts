import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ViagensPage } from './viagens.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    RouterModule.forChild([
      { path: '', component: ViagensPage },
      {
        path: 'nova',
        loadChildren: () => import('../nova-viagem/nova-viagem.module').then(m => m.NovaViagemPageModule)
      },
      {
        path: ':id/editar',
        loadChildren: () => import('../editar-viagem/editar-viagem.module').then(m => m.EditarViagemPageModule)
      },
      {
        path: ':id',
        loadChildren: () => import('../viagem-detalhe/viagem-detalhe.module').then(m => m.ViagemDetalhePageModule)
      }
    ])
  ],
  declarations: [ViagensPage]
})
export class ViagensPageModule {}
