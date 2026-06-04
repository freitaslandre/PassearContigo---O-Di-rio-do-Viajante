// app/pages/editar-custo/editar-custo.page.spec.ts | Ficheiro fonte da aplicacao PassearContigo.
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EditarCustoPage } from './editar-custo.page';

describe('EditarCustoPage', () => {
  let component: EditarCustoPage;
  let fixture: ComponentFixture<EditarCustoPage>;

  beforeEach(async() => {
    await TestBed.configureTestingModule({
      declarations: [ EditarCustoPage ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditarCustoPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
