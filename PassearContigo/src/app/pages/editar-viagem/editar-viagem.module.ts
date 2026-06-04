// app/pages/editar-viagem/editar-viagem.module.ts | Modulo Angular da pagina editar viagem, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { ReactiveFormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { EditarViagemPageRoutingModule } from './editar-viagem-routing.module';
// Importa dependencias usadas neste ficheiro.
import { EditarViagemPage } from './editar-viagem.page';

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
    EditarViagemPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [EditarViagemPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarViagemPageModule {}
