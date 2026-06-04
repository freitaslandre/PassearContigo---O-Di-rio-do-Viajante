// This file is required by karma.conf.js and loads recursively all the .spec and framework files

// Importa dependencias usadas neste ficheiro.
import 'zone.js/testing';
// Importa dependencias usadas neste ficheiro.
import { getTestBed } from '@angular/core/testing';
// Importa dependencias usadas neste ficheiro.
import {
  // Executa uma instrucao necessaria para este fluxo.
  BrowserDynamicTestingModule,
  // Executa uma instrucao necessaria para este fluxo.
  platformBrowserDynamicTesting
// Executa uma instrucao necessaria para este fluxo.
} from '@angular/platform-browser-dynamic/testing';

// First, initialize the Angular testing environment.
getTestBed().initTestEnvironment(
  // Executa uma instrucao necessaria para este fluxo.
  BrowserDynamicTestingModule,
  // Define um metodo chamado pela pagina ou por outros metodos.
  platformBrowserDynamicTesting(),
);
