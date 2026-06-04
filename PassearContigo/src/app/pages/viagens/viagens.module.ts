// app/pages/viagens/viagens.module.ts | Modulo Angular da pagina viagens, onde se declaram dependencias do ecra.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { ViagensPageRoutingModule } from './viagens-routing.module';
// Importa dependencias usadas neste ficheiro.
import { ViagensPage } from './viagens.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    FormsModule,
    // Executa uma instrucao necessaria para este fluxo.
    ViagensPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [ViagensPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagensPageModule {}
