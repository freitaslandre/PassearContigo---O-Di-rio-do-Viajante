import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'resumo-custos',
    loadChildren: () => import('./pages/resumo-custos/resumo-custos.module').then(m => m.ResumoCustosPageModule)
  },
  {
    path: 'editar-custo/:id',
    loadChildren: () => import('./pages/editar-custo/editar-custo.module').then(m => m.EditarCustoPageModule)
  },
  {
    path: '',
    redirectTo: 'tabs/viagens',
    pathMatch: 'full'
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
