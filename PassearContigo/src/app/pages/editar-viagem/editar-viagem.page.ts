// app/pages/editar-viagem/editar-viagem.page.ts | Controlador da pagina editar viagem, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnDestroy, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Subscription } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { CameraService } from '../../services/camera.service';
// Importa dependencias usadas neste ficheiro.
import { FirebaseStorageService } from '../../services/firebase-storage.service';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-editar-viagem',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './editar-viagem.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./editar-viagem.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class EditarViagemPage implements OnInit, OnDestroy {
  // Executa uma instrucao necessaria para este fluxo.
  form!: FormGroup;
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Atribui um valor a esta propriedade.
  viagemId = '';
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Define um campo ou opcao de configuracao.
  fotoCapaPreview: string | null = null;
  // Atribui um valor a esta propriedade.
  numeroDias = 0;

  // Define um membro interno desta classe.
  private viagemSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private fotoCapaInicial: string | null = null;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private fb: FormBuilder,
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private cameraService: CameraService,
    // Define um membro interno desta classe.
    private firebaseStorageService: FirebaseStorageService,
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

    // Atualiza ou consulta estado da pagina.
    this.viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id') || '';
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.erro = 'ID de viagem inválido.';
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.carregarViagem();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.unsubscribe();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  onFotoCapaSelected(event: Event) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const input = event.target as HTMLInputElement;
    // Cria uma variavel local para esta operacao.
    const file = input.files?.[0];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!file) return;

    // Cria uma variavel local para esta operacao.
    const reader = new FileReader();
    // Executa uma instrucao necessaria para este fluxo.
    reader.onload = async () => {
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(String(reader.result || ''), 1280, 0.72);
    };
    // Executa uma instrucao necessaria para este fluxo.
    reader.readAsDataURL(file);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  removerFotoCapa() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Atualiza ou consulta estado da pagina.
    this.fotoCapaPreview = null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async tirarFotoCapa() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.takePicture();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto) {
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
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.selectPictureFromGallery();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto) {
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaPreview = await this.firebaseStorageService.optimizeImage(foto, 1280, 0.72);
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.mostrarToast('Não foi possível selecionar a foto.', 'warning');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async guardar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Sem permissão para editar esta viagem.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.form.invalid) {
      // Atualiza ou consulta estado da pagina.
      this.form.markAllAsTouched();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Preencha corretamente os campos obrigatórios.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const loader = await this.loadingCtrl.create({
      // Define um campo ou opcao de configuracao.
      message: 'A guardar viagem...'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await loader.present();

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      let fotoCapaUrl = this.fotoCapaPreview || '';

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.fotoCapaPreview?.startsWith('data:image/')) {
        // Executa uma instrucao necessaria para este fluxo.
        loader.message = 'A enviar capa...';
        // Atribui um valor a esta propriedade.
        fotoCapaUrl = await this.firebaseStorageService.uploadViagemCover(
          // Atualiza ou consulta estado da pagina.
          this.viagem.id,
          // Atualiza ou consulta estado da pagina.
          this.fotoCapaPreview,
          // Executa uma instrucao necessaria para este fluxo.
          { optimize: false }
        );
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, {
        // Define um campo ou opcao de configuracao.
        titulo: this.form.value.titulo.trim(),
        // Define um campo ou opcao de configuracao.
        local: this.form.value.destino.trim(),
        // Define um campo ou opcao de configuracao.
        descricao: this.form.value.descricao.trim(),
        // Define um campo ou opcao de configuracao.
        dataInicio: new Date(this.form.value.dataInicio),
        // Define um campo ou opcao de configuracao.
        dataFim: new Date(this.form.value.dataFim),
        // Define um campo ou opcao de configuracao.
        status: this.form.value.status,
        // Executa uma instrucao necessaria para este fluxo.
        fotoCapaUrl
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await loader.dismiss();
      // Atualiza ou consulta estado da pagina.
      this.form.markAsPristine();
      // Atualiza ou consulta estado da pagina.
      this.fotoCapaInicial = fotoCapaUrl || null;
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Viagem atualizada com sucesso.', 'success');
      // Aguarda a conclusao de uma operacao assincrona.
      await this.router.navigate(['/tabs', 'viagens', this.viagem.id]);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Aguarda a conclusao de uma operacao assincrona.
      await loader.dismiss();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao atualizar viagem.', 'danger');
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async cancelar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!(await this.confirmarSaidaSeNecessario())) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemId) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.router.navigate(['/tabs', 'viagens', this.viagemId]);
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.router.navigate(['/tabs', 'viagens']);
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

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
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
      descricao: [''],
      // Define um campo ou opcao de configuracao.
      dataInicio: ['', Validators.required],
      // Define um campo ou opcao de configuracao.
      dataFim: ['', Validators.required],
      // Define um campo ou opcao de configuracao.
      status: ['planejada', Validators.required]
    // Executa uma instrucao necessaria para este fluxo.
    }, { validators: this.validarDatas.bind(this) });
  }

  // Define um membro interno desta classe.
  private setupListenersParaDatas() {
    // Atualiza ou consulta estado da pagina.
    this.form.get('dataInicio')?.valueChanges.subscribe(() => this.calcularDias());
    // Atualiza ou consulta estado da pagina.
    this.form.get('dataFim')?.valueChanges.subscribe(() => this.calcularDias());
  }

  // Define um membro interno desta classe.
  private carregarViagem() {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';

    // Atualiza ou consulta estado da pagina.
    this.viagemSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      // Define um campo ou opcao de configuracao.
      next: (viagem) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!viagem) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Viagem não encontrada.';
          // Devolve o resultado deste bloco.
          return;
        }

        // Atualiza ou consulta estado da pagina.
        this.viagem = viagem;
        // Atualiza ou consulta estado da pagina.
        this.preencherFormulario(viagem);

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!this.podeEditarViagem) {
          // Atualiza ou consulta estado da pagina.
          this.form.disable({ emitEvent: false });
        // Executa uma instrucao necessaria para este fluxo.
        } else {
          // Atualiza ou consulta estado da pagina.
          this.form.enable({ emitEvent: false });
        }
      },
      // Define um campo ou opcao de configuracao.
      error: (error) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.erro = error?.message || 'Erro ao carregar viagem.';
      }
    });
  }

  // Define um membro interno desta classe.
  private preencherFormulario(viagem: Viagem) {
    // Atualiza ou consulta estado da pagina.
    this.fotoCapaPreview = viagem.fotoCapaUrl || null;
    // Atualiza ou consulta estado da pagina.
    this.fotoCapaInicial = this.fotoCapaPreview;

    // Atualiza ou consulta estado da pagina.
    this.form.patchValue({
      // Define um campo ou opcao de configuracao.
      titulo: viagem.titulo || '',
      // Define um campo ou opcao de configuracao.
      destino: viagem.local || '',
      // Define um campo ou opcao de configuracao.
      descricao: viagem.descricao || '',
      // Define um campo ou opcao de configuracao.
      dataInicio: this.formatarDataInput(viagem.dataInicio),
      // Define um campo ou opcao de configuracao.
      dataFim: this.formatarDataInput(viagem.dataFim),
      // Define um campo ou opcao de configuracao.
      status: viagem.status || 'planejada'
    });

    // Atualiza ou consulta estado da pagina.
    this.form.markAsPristine();
    // Atualiza ou consulta estado da pagina.
    this.calcularDias();
  }

  // Define um membro interno desta classe.
  private calcularDias() {
    // Cria uma variavel local para esta operacao.
    const dataInicio = this.form.get('dataInicio')?.value;
    // Cria uma variavel local para esta operacao.
    const dataFim = this.form.get('dataFim')?.value;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dataInicio || !dataFim || this.form.hasError('datasInvalidas')) {
      // Atualiza ou consulta estado da pagina.
      this.numeroDias = 0;
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const inicio = new Date(dataInicio);
    // Cria uma variavel local para esta operacao.
    const fim = new Date(dataFim);
    // Atualiza ou consulta estado da pagina.
    this.numeroDias = Math.floor((fim.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)) + 1;
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

    // Devolve o resultado deste bloco.
    return new Date(dataFim) < new Date(dataInicio) ? { datasInvalidas: true } : null;
  }

  // Define um membro interno desta classe.
  private formatarDataInput(data: Date | string | any): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (Number.isNaN(date.getTime())) {
      // Devolve o resultado deste bloco.
      return '';
    }

    // Cria uma variavel local para esta operacao.
    const ano = date.getFullYear();
    // Cria uma variavel local para esta operacao.
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    // Cria uma variavel local para esta operacao.
    const dia = String(date.getDate()).padStart(2, '0');
    // Devolve o resultado deste bloco.
    return `${ano}-${mes}-${dia}`;
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof data === 'string') {
      // Devolve o resultado deste bloco.
      return new Date(data);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data && typeof data === 'object' && 'toDate' in data) {
      // Devolve o resultado deste bloco.
      return data.toDate();
    }

    // Devolve o resultado deste bloco.
    return new Date(data);
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
  private temAlteracoesPorGuardar(): boolean {
    // Devolve o resultado deste bloco.
    return this.form?.dirty || this.fotoCapaPreview !== this.fotoCapaInicial;
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
      message: 'Tem alterações por guardar. Se sair agora, perde as alterações feitas à viagem.',
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

  // Define um membro interno desta classe.
  private obterParametroDaRota(nome: string): string | null {
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const rota of [...this.route.pathFromRoot].reverse()) {
      // Cria uma variavel local para esta operacao.
      const valor = rota.snapshot.paramMap.get(nome);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (valor) {
        // Devolve o resultado deste bloco.
        return valor;
      }
    }

    // Devolve o resultado deste bloco.
    return null;
  }
}
