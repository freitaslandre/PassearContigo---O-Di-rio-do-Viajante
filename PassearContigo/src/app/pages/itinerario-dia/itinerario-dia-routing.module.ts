// app/pages/itinerario-dia/itinerario-dia-routing.module.ts | Rotas da pagina itinerario dia, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ItinerarioDiaPage } from './itinerario-dia.page';

// Cria uma variavel local para esta operacao.
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: '',
    // Define um campo ou opcao de configuracao.
    component: ItinerarioDiaPage
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
export class ItinerarioDiaPageRoutingModule {}
