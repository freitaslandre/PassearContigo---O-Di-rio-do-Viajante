import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ViagemDetalhePage } from './viagem-detalhe.page';

const routes: Routes = [
  {
    path: '',
    component: ViagemDetalhePage
  },
  {
    path: 'diario',
    loadChildren: () => import('./../diario-viagem/diario-viagem.module').then(m => m.DiarioViagemPageModule)
  },
  {
    path: 'album',
    loadChildren: () => import('./../album-viagem/album-viagem.module').then(m => m.AlbumViagemPageModule)
  },
  {
    path: 'colaboradores',
    loadChildren: () => import('./../gerir-colaboradores/gerir-colaboradores.module').then(m => m.GerirColaboradoresPageModule)
  },
  {
    path: 'dias/:diaId',
    loadChildren: () => import('./../../pages/dia-detalhe/dia-detalhe.module').then(m => m.DiaDetalhePageModule)
  },
  {
    path: 'dias/:diaId/itinerario',
    loadChildren: () => import('./../itinerario-dia/itinerario-dia.module').then(m => m.ItinerarioDiaPageModule)
  },
  {
    path: 'dias/:diaId/adicionar-poi',
    loadChildren: () => import('./../adicionar-poi/adicionar-poi.module').then(m => m.AdicionarPoiPageModule)
  },
  {
    path: 'dias/:diaId/poi/:poiId',
    loadChildren: () => import('./../detalhe-poi/detalhe-poi.module').then(m => m.DetalhePoiPageModule)
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ViagemDetalhePageRoutingModule {}
