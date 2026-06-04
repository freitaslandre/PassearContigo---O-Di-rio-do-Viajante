// app/pages/feed-amigos/feed-amigos-routing.module.ts | Rotas da pagina feed amigos, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { FeedAmigosPage } from './feed-amigos.page';

/** Rota da página do feed de amigos. */
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  { path: '', component: FeedAmigosPage }
];

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [RouterModule.forChild(routes)],
  // Define um campo ou opcao de configuracao.
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class FeedAmigosPageRoutingModule {}
