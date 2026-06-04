// app/pages/perfil/perfil-routing.module.ts | Rotas da pagina perfil, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { PerfilPage } from './perfil.page';

/** Rotas da área de perfil e feed de amigos. */
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'feed',
    // Define um campo ou opcao de configuracao.
    redirectTo: '/tabs/feed',
    // Define um campo ou opcao de configuracao.
    pathMatch: 'full'
  },
  // Executa uma instrucao necessaria para este fluxo.
  { path: '', component: PerfilPage }
];

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [RouterModule.forChild(routes)],
  // Define um campo ou opcao de configuracao.
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class PerfilPageRoutingModule {}
