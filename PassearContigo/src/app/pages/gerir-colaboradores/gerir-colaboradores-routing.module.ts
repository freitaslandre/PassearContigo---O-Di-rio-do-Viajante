// app/pages/gerir-colaboradores/gerir-colaboradores-routing.module.ts | Rotas da pagina gerir colaboradores, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { GerirColaboradoresPage } from './gerir-colaboradores.page';

/** Rota da página de gestão de colaboradores. */
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  { path: '', component: GerirColaboradoresPage }
];

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [RouterModule.forChild(routes)],
  // Define um campo ou opcao de configuracao.
  exports: [RouterModule]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class GerirColaboradoresPageRoutingModule {}
