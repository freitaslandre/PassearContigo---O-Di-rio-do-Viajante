// app/services/auth.spec.ts | Testes unitarios do servico auth.
import { TestBed } from '@angular/core/testing';

// Importa dependencias usadas neste ficheiro.
import { AuthService } from './auth.service';

// Define um metodo chamado pela pagina ou por outros metodos.
describe('AuthService', () => {
  // Cria uma variavel local para esta operacao.
  let service: AuthService;

  // Define um metodo chamado pela pagina ou por outros metodos.
  beforeEach(() => {
    // Executa uma instrucao necessaria para este fluxo.
    TestBed.configureTestingModule({});
    // Atribui um valor a esta propriedade.
    service = TestBed.inject(AuthService);
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  it('should be created', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    expect(service).toBeTruthy();
  });
});
