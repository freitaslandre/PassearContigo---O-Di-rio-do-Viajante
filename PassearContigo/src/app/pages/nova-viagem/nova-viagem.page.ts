import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ViagensService } from '../../services/viagens.service';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { CameraService } from '../../services/camera.service';

@Component({
  selector: 'app-nova-viagem',
  standalone: false,
  templateUrl: 'nova-viagem.page.html',
  styleUrls: ['nova-viagem.page.scss']
})
export class NovaViagemPage implements OnInit {
  form!: FormGroup;
  carregando = false;
  fotoCapaPreview: string | null = null;
  fotoCapaFile: File | null = null;
  numeroDias = 0;

  constructor(
    private fb: FormBuilder,
    private viagensService: ViagensService,
    private cameraService: CameraService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
    this.setupListenersParaDatas();
  }

  private setupListenersParaDatas() {
    this.form.get('dataInicio')?.valueChanges.subscribe(() => this.calcularDias());
    this.form.get('dataFim')?.valueChanges.subscribe(() => this.calcularDias());
  }

  private calcularDias() {
    const dataInicio = this.form.get('dataInicio')?.value;
    const dataFim = this.form.get('dataFim')?.value;

    if (!dataInicio || !dataFim) {
      this.numeroDias = 0;
      return;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (fim < inicio) {
      this.numeroDias = 0;
      return;
    }

    const differenceMs = fim.getTime() - inicio.getTime();
    this.numeroDias = Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
  }

  private inicializarFormulario() {
    this.form = this.fb.group({
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      destino: ['', Validators.required],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required]
    }, { validators: this.validarDatas.bind(this) });
  }

  private validarDatas(group: FormGroup): { [key: string]: any } | null {
    const dataInicio = group.get('dataInicio')?.value;
    const dataFim = group.get('dataFim')?.value;

    if (!dataInicio || !dataFim) {
      return null;
    }

    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (fim < inicio) {
      return { datasInvalidas: true };
    }

    return null;
  }

  onFotoCapaSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.fotoCapaFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.fotoCapaPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  removerFotoCapa() {
    this.fotoCapaFile = null;
    this.fotoCapaPreview = null;
  }

  async tirarFotoCapa() {
    const foto = await this.cameraService.takePicture();
    if (foto) {
      this.fotoCapaFile = null;
      this.fotoCapaPreview = foto;
    }
  }

  async escolherFotoCapaDaGaleria() {
    const foto = await this.cameraService.selectPictureFromGallery();
    if (foto) {
      this.fotoCapaFile = null;
      this.fotoCapaPreview = foto;
    }
  }

  async criarViagem() {
    if (this.form.invalid) {
      let mensagem = 'Por favor, preencha todos os campos obrigatórios.';

      if (this.form.hasError('datasInvalidas')) {
        mensagem = 'A data de fim não pode ser anterior à data de início.';
      }

      const alert = await this.alertCtrl.create({
        header: 'Formulário Inválido',
        message: mensagem,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'Criando viagem...'
    });
    await loader.present();

    try {
      const dataInicio = new Date(this.form.get('dataInicio')?.value);
      const dataFim = new Date(this.form.get('dataFim')?.value);

      const novaViagem = {
        titulo: this.form.get('titulo')?.value,
        local: this.form.get('destino')?.value,
        dataInicio,
        dataFim,
        fotoCapaUrl: this.fotoCapaPreview || undefined,
        status: 'planejada' as const
      };

      const id = await this.viagensService.createViagem(novaViagem);

      await loader.dismiss();

      const toast = await this.toastCtrl.create({
        message: 'Viagem criada com sucesso!',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
      await toast.onDidDismiss();

      this.router.navigate(['/tabs', 'viagens', id]);
    } catch (error: any) {
      await loader.dismiss();

      const toast = await this.toastCtrl.create({
        message: error.message || 'Erro ao criar viagem',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
    }
  }

  cancelar() {
    this.router.navigate(['/tabs/viagens']);
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
}
