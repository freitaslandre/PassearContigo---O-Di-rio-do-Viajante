import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Viagem } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';
import { CameraService } from '../../services/camera.service';

@Component({
  selector: 'app-editar-viagem',
  standalone: false,
  templateUrl: './editar-viagem.page.html',
  styleUrls: ['./editar-viagem.page.scss']
})
export class EditarViagemPage implements OnInit, OnDestroy {
  form!: FormGroup;
  viagem: Viagem | null = null;
  viagemId = '';
  carregando = true;
  erro = '';
  fotoCapaPreview: string | null = null;
  numeroDias = 0;

  private viagemSub: Subscription | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private cameraService: CameraService,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.setupListenersParaDatas();

    this.viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id') || '';
    if (!this.viagemId) {
      this.erro = 'ID de viagem invalido.';
      this.carregando = false;
      return;
    }

    this.carregarViagem();
  }

  ngOnDestroy() {
    this.viagemSub?.unsubscribe();
  }

  onFotoCapaSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      this.fotoCapaPreview = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  }

  removerFotoCapa() {
    this.fotoCapaPreview = null;
  }

  async tirarFotoCapa() {
    const foto = await this.cameraService.takePicture();
    if (foto) {
      this.fotoCapaPreview = foto;
      return;
    }

    await this.mostrarToast('Nao foi possivel capturar a foto.', 'warning');
  }

  async escolherFotoCapaDaGaleria() {
    const foto = await this.cameraService.selectPictureFromGallery();
    if (foto) {
      this.fotoCapaPreview = foto;
      return;
    }

    await this.mostrarToast('Nao foi possivel selecionar a foto.', 'warning');
  }

  async guardar() {
    if (!this.viagem || this.form.invalid) {
      this.form.markAllAsTouched();
      await this.mostrarToast('Preencha corretamente os campos obrigatorios.', 'warning');
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'A guardar viagem...'
    });
    await loader.present();

    try {
      await this.viagensService.updateViagem(this.viagem.id, {
        titulo: this.form.value.titulo.trim(),
        local: this.form.value.destino.trim(),
        descricao: this.form.value.descricao.trim(),
        dataInicio: new Date(this.form.value.dataInicio),
        dataFim: new Date(this.form.value.dataFim),
        status: this.form.value.status,
        fotoCapaUrl: this.fotoCapaPreview || ''
      });

      await loader.dismiss();
      await this.mostrarToast('Viagem atualizada com sucesso.', 'success');
      this.router.navigate(['/tabs', 'viagens', this.viagem.id]);
    } catch (error: any) {
      await loader.dismiss();
      await this.mostrarToast(error?.message || 'Erro ao atualizar viagem.', 'danger');
    }
  }

  cancelar() {
    if (this.viagemId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
      return;
    }

    this.router.navigate(['/tabs', 'viagens']);
  }

  get titulo() {
    return this.form.get('titulo');
  }

  get destino() {
    return this.form.get('destino');
  }

  get dataInicio() {
    return this.form.get('dataInicio');
  }

  get dataFim() {
    return this.form.get('dataFim');
  }

  private inicializarFormulario() {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      destino: ['', Validators.required],
      descricao: [''],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      status: ['planejada', Validators.required]
    }, { validators: this.validarDatas.bind(this) });
  }

  private setupListenersParaDatas() {
    this.form.get('dataInicio')?.valueChanges.subscribe(() => this.calcularDias());
    this.form.get('dataFim')?.valueChanges.subscribe(() => this.calcularDias());
  }

  private carregarViagem() {
    this.carregando = true;
    this.erro = '';

    this.viagemSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      next: (viagem) => {
        this.carregando = false;

        if (!viagem) {
          this.erro = 'Viagem nao encontrada.';
          return;
        }

        this.viagem = viagem;
        this.preencherFormulario(viagem);
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error?.message || 'Erro ao carregar viagem.';
      }
    });
  }

  private preencherFormulario(viagem: Viagem) {
    this.fotoCapaPreview = viagem.fotoCapaUrl || null;

    this.form.patchValue({
      titulo: viagem.titulo || '',
      destino: viagem.local || '',
      descricao: viagem.descricao || '',
      dataInicio: this.formatarDataInput(viagem.dataInicio),
      dataFim: this.formatarDataInput(viagem.dataFim),
      status: viagem.status || 'planejada'
    });

    this.calcularDias();
  }

  private calcularDias() {
    const dataInicio = this.form.get('dataInicio')?.value;
    const dataFim = this.form.get('dataFim')?.value;

    if (!dataInicio || !dataFim || this.form.hasError('datasInvalidas')) {
      this.numeroDias = 0;
      return;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);
    this.numeroDias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  }

  private validarDatas(group: FormGroup): { [key: string]: any } | null {
    const dataInicio = group.get('dataInicio')?.value;
    const dataFim = group.get('dataFim')?.value;

    if (!dataInicio || !dataFim) {
      return null;
    }

    return new Date(dataFim) < new Date(dataInicio) ? { datasInvalidas: true } : null;
  }

  private formatarDataInput(data: Date | string | any): string {
    const date = this.converterParaDate(data);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }

  private converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }

    if (typeof data === 'string') {
      return new Date(data);
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return data.toDate();
    }

    return new Date(data);
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }

  private obterParametroDaRota(nome: string): string | null {
    for (const rota of [...this.route.pathFromRoot].reverse()) {
      const valor = rota.snapshot.paramMap.get(nome);
      if (valor) {
        return valor;
      }
    }

    return null;
  }
}
