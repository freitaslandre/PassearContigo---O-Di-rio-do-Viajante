// app/tabs/tabs.page.ts | Configuracao e apresentacao da navegacao por separadores da aplicacao.
import { Component } from '@angular/core';

/**
 * TabsPage
 * Página principal com navegação de tabs
 * Exibe as 3 abas principais: Viagens, Descobrir, Perfil
 */
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-tabs',
  // Define um campo ou opcao de configuracao.
  templateUrl: 'tabs.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['tabs.page.scss'],
  // Define um campo ou opcao de configuracao.
  standalone: false,
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class TabsPage {}
