// app/pages/adicionar-poi/adicionar-poi.module.ts | Modulo Angular da pagina adicionar poi, onde se declaram dependencias do ecra.
import { NgModule } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { CommonModule } from '@angular/common';
// Importa dependencias usadas neste ficheiro.
import { FormsModule } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { HttpClientModule } from '@angular/common/http';
// Importa dependencias usadas neste ficheiro.
import { IonicModule } from '@ionic/angular';

// Importa dependencias usadas neste ficheiro.
import { AdicionarPoiPageRoutingModule } from './adicionar-poi-routing.module';
// Importa dependencias usadas neste ficheiro.
import { AdicionarPoiPage } from './adicionar-poi.page';

// Aplica metadados/decoradores ao elemento seguinte.
@NgModule({
  // Define um campo ou opcao de configuracao.
  imports: [
    // Executa uma instrucao necessaria para este fluxo.
    CommonModule,
    // Executa uma instrucao necessaria para este fluxo.
    FormsModule,
    // Executa uma instrucao necessaria para este fluxo.
    HttpClientModule,
    // Executa uma instrucao necessaria para este fluxo.
    IonicModule,
    // Executa uma instrucao necessaria para este fluxo.
    AdicionarPoiPageRoutingModule
  ],
  // Define um campo ou opcao de configuracao.
  declarations: [AdicionarPoiPage]
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AdicionarPoiPageModule {}
