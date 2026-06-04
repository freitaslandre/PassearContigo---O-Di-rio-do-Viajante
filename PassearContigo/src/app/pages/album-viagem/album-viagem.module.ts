// app/pages/album-viagem/album-viagem.module.ts | Modulo Angular da pagina album viagem, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { AlbumViagemPageRoutingModule } from './album-viagem-routing.module';
// Importa dependencias usadas neste ficheiro.
import { AlbumViagemPage } from './album-viagem.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    AlbumViagemPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [AlbumViagemPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AlbumViagemPageModule {}
