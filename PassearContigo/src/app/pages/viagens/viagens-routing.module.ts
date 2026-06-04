// app/pages/viagens/viagens-routing.module.ts | Rotas da pagina viagens, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ViagensPage } from './viagens.page';

/** Rotas da área de listagem e detalhe de viagens. */
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  { path: '', component: ViagensPage },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'nova',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('../nova-viagem/nova-viagem.module').then(m => m.NovaViagemPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: ':id/editar',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('../editar-viagem/editar-viagem.module').then(m => m.EditarViagemPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: ':id',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('../viagem-detalhe/viagem-detalhe.module').then(m => m.ViagemDetalhePageModule)
  }
];

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [RouterModule.forChild(routes)],
  // Define um campo ou opcao de configuracao.
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensPageRoutingModule {}
