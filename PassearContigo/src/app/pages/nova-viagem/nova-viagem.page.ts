// app/pages/nova-viagem/nova-viagem.page.ts | Controlador da pagina nova viagem, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { CameraService } from '../../services/camera.service';
// Importa dependencias usadas neste ficheiro.
import { FirebaseStorageService } from '../../services/firebase-storage.service';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-nova-viagem',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: 'nova-viagem.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['nova-viagem.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class NovaViagemPage implements OnInit {
  // Executa uma instrucao necessaria para este fluxo.
  form!: FormGroup;
  // Atribui um valor a esta propriedade.
  carregando = false;
  // Define um campo ou opcao de configuracao.
  fotoCapaPreview: string | null = null;
  // Define um campo ou opcao de configuracao.
  fotoCapaFile: File | null = null;
  // Atribui um valor a esta propriedade.
  numeroDias = 0;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private fb: FormBuilder,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private cameraService: CameraService,
    // Define um membro interno desta classe.
    private firebaseStorageService: FirebaseStorageService,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private alertCtrl: AlertController,
    // Define um membro interno desta classe.
    private loadingCtrl: LoadingController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.inicializarFormulario();
    // Atualiza ou consulta estado da pagina.
    this.setupListenersParaDatas();
  }

  // Define um membro interno desta classe.
  private setupListenersParaDatas() {
    // Atualiza ou consulta estado da pagina.
    this.form.get('dataInicio')?.valueChanges.subscribe(() => this.calcularDias());
    // Atualiza ou consulta estado da pagina.
    this.form.get('dataFim')?.valueChanges.subscribe(() => this.calcularDias());
  }

  // Define um membro interno desta classe.
  private calcularDias() {
    // Cria uma variavel local para esta operacao.
    const dataInicio = this.form.get('dataInicio')?.value;
    // Cria uma variavel local para esta operacao.
    const dataFim = this.form.get('dataFim')?.value;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dataInicio || !dataFim) {
      // Atualiza ou consulta estado da pagina.
      this.numeroDias = 0;
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const inicio = new Date(dataInicio);
    // Cria uma variavel local para esta operacao.
    const fim = new Date(dataFim);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (fim < inicio) {
      // Atualiza ou consulta estado da pagina.
      this.numeroDias = 0;
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const differenceMs = fim.getTime() - inicio.getTime();
    // Atualiza ou consulta estado da pagina.
    this.numeroDias = Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
  }

  // Define um membro interno desta classe.
  private inicializarFormulario() {
    // Atualiza ou consulta estado da pagina.
    this.form = this.fb.group({
      // Define um campo ou opcao de configuracao.
      titulo: ['', [Validators.required, Validators.minLength(3)]],
      // Define um campo ou opcao de configuracao.
      destino: ['', Validators.required],
      // Define um campo ou opcao de configuracao.
      dataInicio: ['', Validators.required],
      // Define um campo ou opcao de configuracao.
      dataFim: ['', Validators.required]
    // Executa uma instrucao necessaria para este fluxo.
    }, { validators: this.validarDatas.bind(this) });
  }

  // Define um membro interno desta classe.
  private validarDatas(group: FormGroup): { [key: string]: any } | null {
    // Cria uma variavel local para esta operacao.
    const dataInicio = group.get('dataInicio')?.value;
    // Cria uma variavel local para esta operacao.
    const dataFim = group.get('dataFim')?.value;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dataInicio || !dataFim) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Cria uma variavel local para esta operacao.
    const inicio = new Date(dataInicio);
    // Cria uma variavel local para esta operacao.
    const fim = new Date(dataFim);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (fim < inicio) {
      // Devolve o resultado deste bloco.
      return { datasInvalidas: true };
    }

    // Devolve o resultado deste bloco.
    return null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  onFotoCapaSelected(event: any) {
    // Cria uma variavel local para esta operacao.
    const file: File = event.target.files[0];
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (file) {
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaFile = file;
      // Cria uma variavel local para esta operacao.
      const reader = new FileReader();
      // Executa uma instrucao necessaria para este fluxo.
      reader.onload = async (e: any) => {
        // Atualiza ou consulta estado da pagina.
        this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(e.target.result, 1280, 0.72);
      };
      // Executa uma instrucao necessaria para este fluxo.
      reader.readAsDataURL(file);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  removerFotoCapa() {
    // Atualiza ou consulta estado da pagina.
    this.fotoCapaFile = null;
    // Atualiza ou consulta estado da pagina.
    this.fotoCapaPreview = null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async tirarFotoCapa() {
    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.takePicture();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto) {
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaFile = null;
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(foto, 1280, 0.72);
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.mostrarToast('Não foi possível capturar a foto.', 'warning');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async escolherFotoCapaDaGaleria() {
    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.selectPictureFromGallery();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto) {
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaFile = null;
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(foto, 1280, 0.72);
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.mostrarToast('Não foi possível selecionar a foto.', 'warning');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async criarViagem() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.form.invalid) {
      // Cria uma variavel local para esta operacao.
      let mensagem = 'Por favor, preencha todos os campos obrigatórios.';

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.form.hasError('datasInvalidas')) {
        // Atribui um valor a esta propriedade.
        mensagem = 'A data de fim não pode ser anterior à data de início.';
      }

      // Cria uma variavel local para esta operacao.
      const alert = await this.alertCtrl.create({
        // Define um campo ou opcao de configuracao.
        header: 'Formulário inválido',
        // Define um campo ou opcao de configuracao.
        message: mensagem,
        // Define um campo ou opcao de configuracao.
        buttons: ['OK']
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await alert.present();
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const loader = await this.loadingCtrl.create({
      // Define um campo ou opcao de configuracao.
      message: 'A criar viagem...'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await loader.present();

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const dataInicio = new Date(this.form.get('dataInicio')?.value);
      // Cria uma variavel local para esta operacao.
      const dataFim = new Date(this.form.get('dataFim')?.value);

      // Cria uma variavel local para esta operacao.
      const novaViagem = {
        // Define um campo ou opcao de configuracao.
        titulo: this.form.get('titulo')?.value,
        // Define um campo ou opcao de configuracao.
        local: this.form.get('destino')?.value,
        // Executa uma instrucao necessaria para este fluxo.
        dataInicio,
        // Executa uma instrucao necessaria para este fluxo.
        dataFim,
        // Define um campo ou opcao de configuracao.
        status: 'planejada' as const
      };

      // Cria uma variavel local para esta operacao.
      const id = await this.viagensService.createViagem(novaViagem);
      // Cria uma variavel local para esta operacao.
      const fotoCapaParaEnviar = this.fotoCapaPreview;

      // Aguarda a conclusao de uma operacao assincrona.
      await loader.dismiss();

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: 'Viagem criada com sucesso!',
        // Define um campo ou opcao de configuracao.
        duration: 1500,
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
      // Atualiza ou consulta estado da pagina.
      this.form.markAsPristine();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.router.navigate(['/tabs', 'viagens', id]);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (fotoCapaParaEnviar) {
        // Atualiza ou consulta estado da pagina.
        this.enviarCapaEmSegundoPlano(id, fotoCapaParaEnviar);
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Aguarda a conclusao de uma operacao assincrona.
      await loader.dismiss();

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error.message || 'Erro ao criar viagem',
        // Define um campo ou opcao de configuracao.
        duration: 2500,
        // Define um campo ou opcao de configuracao.
        color: 'danger'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async cancelar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (await this.confirmarSaidaSeNecessario()) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.router.navigate(['/tabs/viagens']);
    }
  }

  // Executa uma instrucao necessaria para este fluxo.
  get titulo() {
    // Devolve o resultado deste bloco.
    return this.form.get('titulo');
  }

  // Executa uma instrucao necessaria para este fluxo.
  get destino() {
    // Devolve o resultado deste bloco.
    return this.form.get('destino');
  }

  // Executa uma instrucao necessaria para este fluxo.
  get dataInicio() {
    // Devolve o resultado deste bloco.
    return this.form.get('dataInicio');
  }

  // Executa uma instrucao necessaria para este fluxo.
  get dataFim() {
    // Devolve o resultado deste bloco.
    return this.form.get('dataFim');
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2000,
      // Executa uma instrucao necessaria para este fluxo.
      color
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  // Define um membro interno desta classe.
  private async enviarCapaEmSegundoPlano(viagemId: string, fotoCapaDataUrl: string) {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const fotoCapaUrl = await this.firebaseStorageService.uploadViagemCover(
        // Executa uma instrucao necessaria para este fluxo.
        viagemId,
        // Executa uma instrucao necessaria para este fluxo.
        fotoCapaDataUrl,
        // Executa uma instrucao necessaria para este fluxo.
        { optimize: false }
      );
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(viagemId, { fotoCapaUrl });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Não foi possível enviar a capa da viagem:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('A viagem foi criada, mas a capa não foi enviada.', 'warning');
    }
  }

  // Define um membro interno desta classe.
  private temAlteracoesPorGuardar(): boolean {
    // Devolve o resultado deste bloco.
    return this.form?.dirty || !!this.fotoCapaPreview;
  }

  // Define um membro interno desta classe.
  private async confirmarSaidaSeNecessario(): Promise<boolean> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temAlteracoesPorGuardar()) {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Sair sem guardar?',
      // Define um campo ou opcao de configuracao.
      message: 'Tem alterações por guardar. Se sair agora, perde os dados introduzidos.',
      // Define um campo ou opcao de configuracao.
      buttons: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Continuar a editar',
          // Define um campo ou opcao de configuracao.
          role: 'cancel'
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Sair sem guardar',
          // Define um campo ou opcao de configuracao.
          role: 'destructive'
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
    // Cria uma variavel local para esta operacao.
    const resultado = await alert.onDidDismiss();
    // Devolve o resultado deste bloco.
    return resultado.role === 'destructive';
  }
}
