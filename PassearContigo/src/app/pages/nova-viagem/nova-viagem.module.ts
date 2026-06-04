// app/pages/nova-viagem/nova-viagem.module.ts | Modulo Angular da pagina nova viagem, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { ReactiveFormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { NovaViagemPageRoutingModule } from './nova-viagem-routing.module';
// Importa dependencias usadas neste ficheiro.
import { NovaViagemPage } from './nova-viagem.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    ReactiveFormsModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    NovaViagemPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [NovaViagemPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class NovaViagemPageModule {}
