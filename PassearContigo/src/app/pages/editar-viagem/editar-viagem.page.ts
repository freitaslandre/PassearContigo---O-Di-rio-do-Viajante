// app/pages/editar-viagem/editar-viagem.page.ts | Controlador da pagina editar viagem, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Viagem } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';
import { CameraService } from '../../services/camera.service';
import { FirebaseStorageService } from '../../services/firebase-storage.service';

@Component({
  selector: 'app-editar-viagem',
  standalone: false,
  templateUrl: './editar-viagem.page.html',
  styleUrls: ['./editar-viagem.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarViagemPage implements OnInit, OnDestroy {
  form!: FormGroup;
  viagem: Viagem | null = null;
  viagemId = '';
  carregando = true;
  erro = '';
  fotoCapaPreview: string | null = null;
  numeroDias = 0;

  private viagemSub: Subscription | null = null;
  private fotoCapaInicial: string | null = null;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private cameraService: CameraService,
    private firebaseStorageService: FirebaseStorageService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.setupListenersParaDatas();

    this.viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id') || '';
    if (!this.viagemId) {
      this.erro = 'ID de viagem inválido.';
      this.carregando = false;
      return;
    }

    this.carregarViagem();
  }

  ngOnDestroy() {
    this.viagemSub?.unsubscribe();
  }

  onFotoCapaSelected(event: Event) {
    if (!this.podeEditarViagem) return;

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(String(reader.result || ''), 1280, 0.72);
    };
    reader.readAsDataURL(file);
  }

  removerFotoCapa() {
    if (!this.podeEditarViagem) return;

    this.fotoCapaPreview = null;
  }

  async tirarFotoCapa() {
    if (!this.podeEditarViagem) return;

    const foto = await this.cameraService.takePicture();
    if (foto) {
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(foto, 1280, 0.72);
      return;
    }

    await this.mostrarToast('Não foi possível capturar a foto.', 'warning');
  }

  async escolherFotoCapaDaGaleria() {
    if (!this.podeEditarViagem) return;

    const foto = await this.cameraService.selectPictureFromGallery();
    if (foto) {
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(foto, 1280, 0.72);
      return;
    }

    await this.mostrarToast('Não foi possível selecionar a foto.', 'warning');
  }

  async guardar() {
    if (!this.podeEditarViagem) {
      await this.mostrarToast('Sem permissão para editar esta viagem.', 'warning');
      return;
    }

    if (!this.viagem || this.form.invalid) {
      this.form.markAllAsTouched();
      await this.mostrarToast('Preencha corretamente os campos obrigatórios.', 'warning');
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'A guardar viagem...'
    });
    await loader.present();

    try {
      let fotoCapaUrl = this.fotoCapaPreview || '';

      if (this.fotoCapaPreview?.startsWith('data:image/')) {
        loader.message = 'A enviar capa...';
        fotoCapaUrl = await this.firebaseStorageService.uploadViagemCover(
          this.viagem.id,
          this.fotoCapaPreview,
          { optimize: false }
        );
      }

      await this.viagensService.updateViagem(this.viagem.id, {
        titulo: this.form.value.titulo.trim(),
        local: this.form.value.destino.trim(),
        descricao: this.form.value.descricao.trim(),
        dataInicio: new Date(this.form.value.dataInicio),
        dataFim: new Date(this.form.value.dataFim),
        status: this.form.value.status,
        fotoCapaUrl
      });

      await loader.dismiss();
      this.form.markAsPristine();
      this.fotoCapaInicial = fotoCapaUrl || null;
      await this.mostrarToast('Viagem atualizada com sucesso.', 'success');
      await this.router.navigate(['/tabs', 'viagens', this.viagem.id]);
    } catch (error: any) {
      await loader.dismiss();
      await this.mostrarToast(error?.message || 'Erro ao atualizar viagem.', 'danger');
    }
  }

  async cancelar() {
    if (!(await this.confirmarSaidaSeNecessario())) {
      return;
    }

    if (this.viagemId) {
      await this.router.navigate(['/tabs', 'viagens', this.viagemId]);
      return;
    }

    await this.router.navigate(['/tabs', 'viagens']);
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

  get podeEditarViagem(): boolean {
    return this.viagensService.podeEditarViagemAtual(this.viagem);
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
          this.erro = 'Viagem não encontrada.';
          return;
        }

        this.viagem = viagem;
        this.preencherFormulario(viagem);

        if (!this.podeEditarViagem) {
          this.form.disable({ emitEvent: false });
        } else {
          this.form.enable({ emitEvent: false });
        }
      },
      error: (error) => {
        this.carregando = false;
        this.erro = error?.message || 'Erro ao carregar viagem.';
      }
    });
  }

  private preencherFormulario(viagem: Viagem) {
    this.fotoCapaPreview = viagem.fotoCapaUrl || null;
    this.fotoCapaInicial = this.fotoCapaPreview;

    this.form.patchValue({
      titulo: viagem.titulo || '',
      destino: viagem.local || '',
      descricao: viagem.descricao || '',
      dataInicio: this.formatarDataInput(viagem.dataInicio),
      dataFim: this.formatarDataInput(viagem.dataFim),
      status: viagem.status || 'planejada'
    });

    this.form.markAsPristine();
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

  private temAlteracoesPorGuardar(): boolean {
    return this.form?.dirty || this.fotoCapaPreview !== this.fotoCapaInicial;
  }

  private async confirmarSaidaSeNecessario(): Promise<boolean> {
    if (!this.temAlteracoesPorGuardar()) {
      return true;
    }

    const alert = await this.alertCtrl.create({
      header: 'Sair sem guardar?',
      message: 'Tem alterações por guardar. Se sair agora, perde as alterações feitas à viagem.',
      buttons: [
        {
          text: 'Continuar a editar',
          role: 'cancel'
        },
        {
          text: 'Sair sem guardar',
          role: 'destructive'
        }
      ]
    });

    await alert.present();
    const resultado = await alert.onDidDismiss();
    return resultado.role === 'destructive';
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
