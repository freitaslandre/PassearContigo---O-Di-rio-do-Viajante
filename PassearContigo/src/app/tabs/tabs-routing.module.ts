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
        loadChildren: () => import('../pages/descobrir/descobrir.module').then(m => m.DescubrirPageModule)
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
export class TabsPageRoutingModule {}
