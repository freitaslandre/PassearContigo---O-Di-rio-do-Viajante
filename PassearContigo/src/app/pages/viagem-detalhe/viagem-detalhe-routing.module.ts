// app/pages/viagem-detalhe/viagem-detalhe-routing.module.ts | Rotas da pagina viagem detalhe, usadas pelo Angular/Ionic para carregar este ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { RouterModule, Routes } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ViagemDetalhePage } from './viagem-detalhe.page';

// Cria uma variavel local para esta operacao.
const routes: Routes = [
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: '',
    // Define um campo ou opcao de configuracao.
    component: ViagemDetalhePage
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'diario',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../diario-viagem/diario-viagem.module').then(m => m.DiarioViagemPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'album',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../album-viagem/album-viagem.module').then(m => m.AlbumViagemPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'colaboradores',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../gerir-colaboradores/gerir-colaboradores.module').then(m => m.GerirColaboradoresPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'dias/:diaId',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../../pages/dia-detalhe/dia-detalhe.module').then(m => m.DiaDetalhePageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'dias/:diaId/itinerario',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../itinerario-dia/itinerario-dia.module').then(m => m.ItinerarioDiaPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'dias/:diaId/adicionar-poi',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../adicionar-poi/adicionar-poi.module').then(m => m.AdicionarPoiPageModule)
  },
  // Executa uma instrucao necessaria para este fluxo.
  {
    // Define um campo ou opcao de configuracao.
    path: 'dias/:diaId/poi/:poiId',
    // Define um campo ou opcao de configuracao.
    loadChildren: () => import('./../detalhe-poi/detalhe-poi.module').then(m => m.DetalhePoiPageModule)
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
export class ViagemDetalhePageRoutingModule {}
