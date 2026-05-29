import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ViagensService } from '../../services/viagens.service';
import { AlertController, LoadingController } from '@ionic/angular';

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

  constructor(
    private fb: FormBuilder,
    private viagensService: ViagensService,
    private router: Router,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController
  ) {}

  ngOnInit() {
    this.inicializarFormulario();
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

  async criarViagem() {
    if (this.form.invalid) {
      const alert = await this.alertCtrl.create({
        header: 'Formulário Inválido',
        message: 'Por favor, preencha todos os campos obrigatórios.',
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

      if (dataFim < dataInicio) {
        throw new Error('A data de fim não pode ser anterior à data de início.');
      }

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

      const successAlert = await this.alertCtrl.create({
        header: 'Sucesso',
        message: 'Viagem criada com sucesso!',
        buttons: [
          {
            text: 'Ver Detalhes',
            handler: () => {
              this.router.navigate(['/tabs', 'viagens', id]);
            }
          }
        ]
      });
      await successAlert.present();
    } catch (error: any) {
      await loader.dismiss();

      const errorAlert = await this.alertCtrl.create({
        header: 'Erro',
        message: error.message || 'Erro ao criar viagem',
        buttons: ['OK']
      });
      await errorAlert.present();
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
