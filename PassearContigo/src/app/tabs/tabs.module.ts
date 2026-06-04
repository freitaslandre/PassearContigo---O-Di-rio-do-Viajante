// app/tabs/tabs.module.ts | Configuracao e apresentacao da navegacao por separadores da aplicacao.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { TabsPageRoutingModule } from './tabs-routing.module';
// Importa dependencias usadas neste ficheiro.
import { TabsPage } from './tabs.page';

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
    TabsPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [TabsPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class TabsPageModule {}
