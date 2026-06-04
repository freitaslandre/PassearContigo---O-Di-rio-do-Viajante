// app/pages/viagens/viagens-routing.module.ts | Rotas da pagina viagens, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViagensPage } from './viagens.page';

/** Rotas da área de listagem e detalhe de viagens. */
const routes: Routes = [
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
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensPageRoutingModule {}
