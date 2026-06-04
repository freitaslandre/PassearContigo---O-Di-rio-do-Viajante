// app/tabs/tabs-routing.module.ts | Configuracao e apresentacao da navegacao por separadores da aplicacao.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { TabsPage } from './tabs.page';

// Cria uma variavel local para esta operacao.
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: '',
    // Define um campo ou opcao de configuracao.
    component: TabsPage,
    // Define um campo ou opcao de configuracao.
    children: [
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: 'viagens',
        // Define um campo ou opcao de configuracao.
        loadChildren: () => import('../pages/viagens/viagens.module').then(m => m.ViagensPageModule)
      },
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: 'descobrir',
        // Define um campo ou opcao de configuracao.
        loadChildren: () => import('../pages/descobrir/descobrir.module').then(m => m.DescobrirPageModule)
      },
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: 'feed',
        // Define um campo ou opcao de configuracao.
        loadChildren: () => import('../pages/feed-amigos/feed-amigos.module').then(m => m.FeedAmigosPageModule)
      },
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: 'amigos',
        // Define um campo ou opcao de configuracao.
        redirectTo: '/tabs/feed',
        // Define um campo ou opcao de configuracao.
        pathMatch: 'full'
      },
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: 'resumo-custos',
        // Define um campo ou opcao de configuracao.
        loadChildren: () => import('../pages/resumo-custos/resumo-custos.module').then(m => m.ResumoCustosPageModule)
      },
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: 'perfil',
        // Define um campo ou opcao de configuracao.
        loadChildren: () => import('../pages/perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      // Executa uma instrucao necessaria para este fluxo.
      {
        // Define um campo ou opcao de configuracao.
        path: '',
        // Define um campo ou opcao de configuracao.
        redirectTo: '/tabs/viagens',
        // Define um campo ou opcao de configuracao.
        pathMatch: 'full'
      }
    ]
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
export class TabsPageRoutingModule {}
