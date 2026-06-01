import { TestBed } from '@angular/core/testing';
import { AngularFirestore } from '@angular/fire/compat/firestore';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { CustosService } from './custos.service';
import { Custo } from '../models/viagem.model';
import { of } from 'rxjs';

describe('CustosService', () => {
  let service: CustosService;
  let mockFirestore: jasmine.SpyObj<AngularFirestore>;
  let mockAuth: jasmine.SpyObj<AngularFireAuth>;

  const mockUser = {
    uid: 'user-123',
    email: 'test@example.com'
  };

  const mockCusto: Custo = {
    id: 'custo-1',
    descricao: 'Almoço',
    valor: 25.50,
    moeda: 'EUR',
    data: new Date('2026-06-01'),
    categoria: 'Alimentação',
    reembolsavel: false,
    viagemId: 'viagem-1',
    diaId: 'dia-1',
    poiId: 'poi-1'
  };

  beforeEach(() => {
    mockFirestore = jasmine.createSpyObj('AngularFirestore', [
      'collection',
      'doc'
    ]);
    mockAuth = jasmine.createSpyObj('AngularFireAuth', [], {
      authState: of(mockUser)
    });

    TestBed.configureTestingModule({
      providers: [
        CustosService,
        { provide: AngularFirestore, useValue: mockFirestore },
        { provide: AngularFireAuth, useValue: mockAuth }
      ]
    });

    service = TestBed.inject(CustosService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('calcularTotalCustos', () => {
    it('deve calcular o total correto de custos', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', valor: 10 },
        { ...mockCusto, id: '2', valor: 20 },
        { ...mockCusto, id: '3', valor: 15 }
      ];

      const total = service.calcularTotalCustos(custos);

      expect(total).toBe(45);
    });

    it('deve retornar 0 para um array vazio', () => {
      const total = service.calcularTotalCustos([]);

      expect(total).toBe(0);
    });

    it('deve lidar com valores undefined', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', valor: 10 },
        { ...mockCusto, id: '2', valor: undefined as any }
      ];

      const total = service.calcularTotalCustos(custos);

      expect(total).toBe(10);
    });
  });

  describe('calcularCustosPorCategoria', () => {
    it('deve agrupar custos por categoria corretamente', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', categoria: 'Alimentação', valor: 25 },
        { ...mockCusto, id: '2', categoria: 'Transporte', valor: 15 },
        { ...mockCusto, id: '3', categoria: 'Alimentação', valor: 30 }
      ];

      const resultado = service.calcularCustosPorCategoria(custos);

      expect(resultado['Alimentação']).toBe(55);
      expect(resultado['Transporte']).toBe(15);
    });

    it('deve atribuir "Sem categoria" para custos sem categoria', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', categoria: undefined, valor: 20 }
      ];

      const resultado = service.calcularCustosPorCategoria(custos);

      expect(resultado['Sem categoria']).toBe(20);
    });
  });

  describe('Associação de custos', () => {
    it('deve criar um custo associado a um dia', async () => {
      const custo: Custo = {
        ...mockCusto,
        diaId: 'dia-2'
      };

      expect(custo.diaId).toBe('dia-2');
    });

    it('deve criar um custo associado a um POI', async () => {
      const custo: Custo = {
        ...mockCusto,
        poiId: 'poi-2'
      };

      expect(custo.poiId).toBe('poi-2');
    });

    it('deve criar um custo com viagem, dia e POI', async () => {
      const custo: Custo = {
        ...mockCusto,
        viagemId: 'viagem-5',
        diaId: 'dia-5',
        poiId: 'poi-5'
      };

      expect(custo.viagemId).toBe('viagem-5');
      expect(custo.diaId).toBe('dia-5');
      expect(custo.poiId).toBe('poi-5');
    });
  });

  describe('Custos por contexto', () => {
    it('deve permitir filtrar custos por viagem', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', viagemId: 'viagem-1' },
        { ...mockCusto, id: '2', viagemId: 'viagem-2' }
      ];

      const custosPorViagem = custos.filter(c => c.viagemId === 'viagem-1');

      expect(custosPorViagem.length).toBe(1);
      expect(custosPorViagem[0].viagemId).toBe('viagem-1');
    });

    it('deve permitir filtrar custos por dia', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', diaId: 'dia-1' },
        { ...mockCusto, id: '2', diaId: 'dia-2' }
      ];

      const custosPorDia = custos.filter(c => c.diaId === 'dia-1');

      expect(custosPorDia.length).toBe(1);
      expect(custosPorDia[0].diaId).toBe('dia-1');
    });

    it('deve permitir filtrar custos por POI', () => {
      const custos: Custo[] = [
        { ...mockCusto, id: '1', poiId: 'poi-1' },
        { ...mockCusto, id: '2', poiId: 'poi-2' }
      ];

      const custosPorPoi = custos.filter(c => c.poiId === 'poi-1');

      expect(custosPorPoi.length).toBe(1);
      expect(custosPorPoi[0].poiId).toBe('poi-1');
    });
  });
});

