// app/pages/descobrir/descobrir.module.ts | Modulo Angular da pagina descobrir, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { DescobrirPage } from './descobrir.page';

// Importa dependencias usadas neste ficheiro.
import { DescobrirPageRoutingModule } from './descobrir-routing.module';


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
    DescobrirPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [DescobrirPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DescobrirPageModule {}
