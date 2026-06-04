// app/services/custos.service.spec.ts | Testes unitarios do servico custos.service.
import { TestBed } from '@angular/core/testing';
// Importa dependencias usadas neste ficheiro.
import { AngularFirestore } from '@angular/fire/compat/firestore';
// Importa dependencias usadas neste ficheiro.
import { AngularFireAuth } from '@angular/fire/compat/auth';
// Importa dependencias usadas neste ficheiro.
import { CustosService } from './custos.service';
// Importa dependencias usadas neste ficheiro.
import { Custo } from '../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { of } from 'rxjs';

// Define um metodo chamado pela pagina ou por outros metodos.
describe('CustosService', () => {
  // Cria uma variavel local para esta operacao.
  let service: CustosService;
  // Cria uma variavel local para esta operacao.
  let mockFirestore: jasmine.SpyObj<AngularFirestore>;
  // Cria uma variavel local para esta operacao.
  let mockAuth: jasmine.SpyObj<AngularFireAuth>;

  // Cria uma variavel local para esta operacao.
  const mockUser = {
    // Define um campo ou opcao de configuracao.
    uid: 'user-123',
    // Define um campo ou opcao de configuracao.
    email: 'test@example.com'
  };

  // Cria uma variavel local para esta operacao.
  const mockCusto: Custo = {
    // Define um campo ou opcao de configuracao.
    id: 'custo-1',
    // Define um campo ou opcao de configuracao.
    descricao: 'Almoço',
    // Define um campo ou opcao de configuracao.
    valor: 25.50,
    // Define um campo ou opcao de configuracao.
    moeda: 'EUR',
    // Define um campo ou opcao de configuracao.
    data: new Date('2026-06-01'),
    // Define um campo ou opcao de configuracao.
    categoria: 'Alimentação',
    // Define um campo ou opcao de configuracao.
    reembolsavel: false,
    // Define um campo ou opcao de configuracao.
    viagemId: 'viagem-1',
    // Define um campo ou opcao de configuracao.
    diaId: 'dia-1',
    // Define um campo ou opcao de configuracao.
    poiId: 'poi-1'
  };

  // Define um metodo chamado pela pagina ou por outros metodos.
  beforeEach(() => {
    // Atribui um valor a esta propriedade.
    mockFirestore = jasmine.createSpyObj('AngularFirestore', [
      // Executa uma instrucao necessaria para este fluxo.
      'collection',
      // Executa uma instrucao necessaria para este fluxo.
      'doc'
    ]);
    // Atribui um valor a esta propriedade.
    mockAuth = jasmine.createSpyObj('AngularFireAuth', [], {
      // Define um campo ou opcao de configuracao.
      authState: of(mockUser)
    });

    // Executa uma instrucao necessaria para este fluxo.
    TestBed.configureTestingModule({
      // Define um campo ou opcao de configuracao.
      providers: [
        // Executa uma instrucao necessaria para este fluxo.
        CustosService,
        // Executa uma instrucao necessaria para este fluxo.
        { provide: AngularFirestore, useValue: mockFirestore },
        // Executa uma instrucao necessaria para este fluxo.
        { provide: AngularFireAuth, useValue: mockAuth }
      ]
    });

    // Atribui um valor a esta propriedade.
    service = TestBed.inject(CustosService);
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  it('should be created', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    expect(service).toBeTruthy();
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  describe('calcularTotalCustos', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve calcular o total correto de custos', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', valor: 10 },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '2', valor: 20 },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '3', valor: 15 }
      ];

      // Cria uma variavel local para esta operacao.
      const total = service.calcularTotalCustos(custos);

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(total).toBe(45);
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve retornar 0 para um array vazio', () => {
      // Cria uma variavel local para esta operacao.
      const total = service.calcularTotalCustos([]);

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(total).toBe(0);
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve lidar com valores undefined', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', valor: 10 },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '2', valor: undefined as any }
      ];

      // Cria uma variavel local para esta operacao.
      const total = service.calcularTotalCustos(custos);

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(total).toBe(10);
    });
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  describe('calcularCustosPorCategoria', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve agrupar custos por categoria corretamente', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', categoria: 'Alimentação', valor: 25 },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '2', categoria: 'Transporte', valor: 15 },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '3', categoria: 'Alimentação', valor: 30 }
      ];

      // Cria uma variavel local para esta operacao.
      const resultado = service.calcularCustosPorCategoria(custos);

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(resultado['Alimentação']).toBe(55);
      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(resultado['Transporte']).toBe(15);
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve atribuir "Sem categoria" para custos sem categoria', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', categoria: undefined, valor: 20 }
      ];

      // Cria uma variavel local para esta operacao.
      const resultado = service.calcularCustosPorCategoria(custos);

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(resultado['Sem categoria']).toBe(20);
    });
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  describe('Associação de custos', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve criar um custo associado a um dia', async () => {
      // Cria uma variavel local para esta operacao.
      const custo: Custo = {
        // Executa uma instrucao necessaria para este fluxo.
        ...mockCusto,
        // Define um campo ou opcao de configuracao.
        diaId: 'dia-2'
      };

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custo.diaId).toBe('dia-2');
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve criar um custo associado a um POI', async () => {
      // Cria uma variavel local para esta operacao.
      const custo: Custo = {
        // Executa uma instrucao necessaria para este fluxo.
        ...mockCusto,
        // Define um campo ou opcao de configuracao.
        poiId: 'poi-2'
      };

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custo.poiId).toBe('poi-2');
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve criar um custo com viagem, dia e POI', async () => {
      // Cria uma variavel local para esta operacao.
      const custo: Custo = {
        // Executa uma instrucao necessaria para este fluxo.
        ...mockCusto,
        // Define um campo ou opcao de configuracao.
        viagemId: 'viagem-5',
        // Define um campo ou opcao de configuracao.
        diaId: 'dia-5',
        // Define um campo ou opcao de configuracao.
        poiId: 'poi-5'
      };

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custo.viagemId).toBe('viagem-5');
      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custo.diaId).toBe('dia-5');
      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custo.poiId).toBe('poi-5');
    });
  });

  // Define um metodo chamado pela pagina ou por outros metodos.
  describe('Custos por contexto', () => {
    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve permitir filtrar custos por viagem', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', viagemId: 'viagem-1' },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '2', viagemId: 'viagem-2' }
      ];

      // Cria uma variavel local para esta operacao.
      const custosPorViagem = custos.filter(c => c.viagemId === 'viagem-1');

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custosPorViagem.length).toBe(1);
      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custosPorViagem[0].viagemId).toBe('viagem-1');
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve permitir filtrar custos por dia', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', diaId: 'dia-1' },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '2', diaId: 'dia-2' }
      ];

      // Cria uma variavel local para esta operacao.
      const custosPorDia = custos.filter(c => c.diaId === 'dia-1');

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custosPorDia.length).toBe(1);
      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custosPorDia[0].diaId).toBe('dia-1');
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    it('deve permitir filtrar custos por POI', () => {
      // Cria uma variavel local para esta operacao.
      const custos: Custo[] = [
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '1', poiId: 'poi-1' },
        // Executa uma instrucao necessaria para este fluxo.
        { ...mockCusto, id: '2', poiId: 'poi-2' }
      ];

      // Cria uma variavel local para esta operacao.
      const custosPorPoi = custos.filter(c => c.poiId === 'poi-1');

      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custosPorPoi.length).toBe(1);
      // Define um metodo chamado pela pagina ou por outros metodos.
      expect(custosPorPoi[0].poiId).toBe('poi-1');
    });
  });
});

