// app/pages/feed-amigos/feed-amigos.module.ts | Modulo Angular da pagina feed amigos, onde se declaram dependencias do ecra.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { FeedAmigosPageRoutingModule } from './feed-amigos-routing.module';
// Importa dependencias usadas neste ficheiro.
import { FeedAmigosPage } from './feed-amigos.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    FormsModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    FeedAmigosPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [FeedAmigosPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class FeedAmigosPageModule {}
