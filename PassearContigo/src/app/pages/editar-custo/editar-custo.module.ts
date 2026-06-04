// app/pages/editar-custo/editar-custo.module.ts | Modulo Angular da pagina editar custo, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';

// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';

// Importa dependencias usadas neste ficheiro.
import { EditarCustoPageRoutingModule } from './editar-custo-routing.module';
// Importa dependencias usadas neste ficheiro.
import { EditarCustoPage } from './editar-custo.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  declarations: [EditarCustoPage],
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    FormsModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    EditarCustoPageRoutingModule
  ]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarCustoPageModule { }
