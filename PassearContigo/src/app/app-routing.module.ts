// app/app-routing.module.ts | Mapa principal de rotas da aplicacao.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

// Cria uma variavel local para esta operacao.
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'tabs',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'resumo-custos',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./pages/resumo-custos/resumo-custos.module').then(m => m.ResumoCustosPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'editar-custo/:id',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./pages/editar-custo/editar-custo.module').then(m => m.EditarCustoPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'gerir-colaboradores',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./pages/gerir-colaboradores/gerir-colaboradores.module').then(m => m.GerirColaboradoresPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: '',
    // Define um campo ou opcao de configuracao.
    redirectTo: 'tabs/viagens',
    // Define um campo ou opcao de configuracao.
    pathMatch: 'full'
  },
];

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  // Define um campo ou opcao de configuracao.
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AppRoutingModule { }
