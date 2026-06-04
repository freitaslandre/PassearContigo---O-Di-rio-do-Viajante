// app/pages/dia-detalhe/dia-detalhe.module.ts | Modulo Angular da pagina dia detalhe, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';

// Importa dependencias usadas neste ficheiro.
import { DiaDetalhePageRoutingModule } from './dia-detalhe-routing.module';
// Importa dependencias usadas neste ficheiro.
import { DiaDetalhePage } from './dia-detalhe.page';

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
    DiaDetalhePageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [DiaDetalhePage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DiaDetalhePageModule { }
