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
      descricao: [''],
      local: ['', Validators.required],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      status: ['planejada', Validators.required]
    });
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
        descricao: this.form.get('descricao')?.value || '',
        local: this.form.get('local')?.value,
        dataInicio,
        dataFim,
        status: this.form.get('status')?.value
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

  get descricao() {
    return this.form.get('descricao');
  }

  get local() {
    return this.form.get('local');
  }

  get dataInicio() {
    return this.form.get('dataInicio');
  }

  get dataFim() {
    return this.form.get('dataFim');
  }

  get status() {
    return this.form.get('status');
  }
}
