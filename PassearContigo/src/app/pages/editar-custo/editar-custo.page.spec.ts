// app/pages/editar-custo/editar-custo.page.spec.ts | Ficheiro fonte da aplicacao PassearContigo.
import { ComponentFixture, TestBed } from '@angular/core/testing';
// Importa dependencias usadas neste ficheiro.
import { EditarCustoPage } from './editar-custo.page';

// Define um metodo chamado pela pagina ou por outros metodos.
describe('EditarCustoPage', () => {
  // Cria uma variavel local para esta operacao.
  let component: EditarCustoPage;
  // Cria uma variavel local para esta operacao.
  let fixture: ComponentFixture<EditarCustoPage>;

  // Define um metodo chamado pela pagina ou por outros metodos.
  beforeEach(async() => {
    // Aguarda a conclusao de uma operacao assincrona.
    await TestBed.configureTestingModule({
      // Define um campo ou opcao de configuracao.
      declarations: [ EditarCustoPage ]
    })
    // Executa uma instrucao necessaria para este fluxo.
    .compileComponents();

    // Atribui um valor a esta propriedade.
    fixture = TestBed.createComponent(EditarCustoPage);
    // Atribui um valor a esta propriedade.
    component = fixture.componentInstance;
    // Executa uma instrucao necessaria para este fluxo.
    fixture.detectChanges();
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  it('should create', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    expect(component).toBeTruthy();
  });
});
