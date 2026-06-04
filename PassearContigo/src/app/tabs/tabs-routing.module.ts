// app/tabs/tabs-routing.module.ts | Configuracao e apresentacao da navegacao por separadores da aplicacao.
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'viagens',
        loadChildren: () => import('../pages/viagens/viagens.module').then(m => m.ViagensPageModule)
      },
      {
        path: 'descobrir',
        loadChildren: () => import('../pages/descobrir/descobrir.module').then(m => m.DescobrirPageModule)
      },
      {
        path: 'feed',
        loadChildren: () => import('../pages/feed-amigos/feed-amigos.module').then(m => m.FeedAmigosPageModule)
      },
      {
        path: 'amigos',
        redirectTo: '/tabs/feed',
        pathMatch: 'full'
      },
      {
        path: 'resumo-custos',
        loadChildren: () => import('../pages/resumo-custos/resumo-custos.module').then(m => m.ResumoCustosPageModule)
      },
      {
        path: 'perfil',
        loadChildren: () => import('../pages/perfil/perfil.module').then(m => m.PerfilPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/viagens',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class TabsPageRoutingModule {}
