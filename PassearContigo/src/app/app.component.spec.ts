// app/app.component.spec.ts | Ficheiro fonte da aplicacao PassearContigo.
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { TestBed } from '@angular/core/testing';

// Importa dependencias usadas neste ficheiro.
import { AppComponent } from './app.component';

// Define um metodo chamado pela pagina ou por outros metodos.
describe('AppComponent', () => {

  // Define um metodo chamado pela pagina ou por outros metodos.
  beforeEach(async () => {
    // Aguarda a conclusao de uma operacao assincrona.
    await TestBed.configureTestingModule({
      // Define um campo ou opcao de configuracao.
      declarations: [AppComponent],
      // Define um campo ou opcao de configuracao.
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    // Executa uma instrucao necessaria para este fluxo.
    }).compileComponents();
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  it('should create the app', () => {
    // Cria uma variavel local para esta operacao.
    const fixture = TestBed.createComponent(AppComponent);
    // Cria uma variavel local para esta operacao.
    const app = fixture.componentInstance;
    // Define um metodo chamado pela pagina ou por outros metodos.
    expect(app).toBeTruthy();
  });

});
