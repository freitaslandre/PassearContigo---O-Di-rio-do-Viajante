// app/pages/detalhe-poi/detalhe-poi.page.ts | Controlador da pagina detalhe poi, onde ficam os dados, eventos e chamadas aos servicos.
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { Share } from '@capacitor/share';
// Importa dependencias usadas neste ficheiro.
import { AlertController, IonContent, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Subscription } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { POIService } from '../../services/poi.service';
// Importa dependencias usadas neste ficheiro.
import { MapCacheService } from '../../services/map-cache.service';
// Importa dependencias usadas neste ficheiro.
import { PhotoShareService } from '../../services/photo-share.service';
// Importa dependencias usadas neste ficheiro.
import { FirebaseStorageService } from '../../services/firebase-storage.service';
// Importa dependencias usadas neste ficheiro.
import { POI, Dia, Viagem } from '../../models/viagem.model';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-detalhe-poi',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './detalhe-poi.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./detalhe-poi.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class DetalhePoiPage implements OnInit, AfterViewInit, OnDestroy {
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild(IonContent) content?: IonContent;
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild('mapaPoi') mapaPoi?: ElementRef<HTMLDivElement>;
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild('editSection') editSection?: ElementRef<HTMLElement>;

  // Define um campo ou opcao de configuracao.
  poi: POI | null = null;
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  diaAtual: Dia | null = null;
  // Define um campo ou opcao de configuracao.
  poiEditavel: Omit<Partial<POI>, 'custo'> & { custo?: string | number } = {};
  // Atribui um valor a esta propriedade.
  modoEdicao = false;
  // Define um campo ou opcao de configuracao.
  viagemId: string | null = null;
  // Define um campo ou opcao de configuracao.
  diaId: string | null = null;
  // Define um campo ou opcao de configuracao.
  poiId: string | null = null;
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Define um campo ou opcao de configuracao.
  fotoUrl: string | undefined = undefined;
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild('fotoInput') fotoInput?: ElementRef<HTMLInputElement>;

  // Notas
  novaNotaTexto = '';
  // Define um campo ou opcao de configuracao.
  notas: { id: string; texto: string; data: Date }[] = [];

  // Define um membro interno desta classe.
  private routeSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private poiSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private mapaLeaflet: any = null;
  // Define um membro interno desta classe.
  private marcadoresLeaflet: any[] = [];
  // Define um membro interno desta classe.
  private rotaLeaflet: any = null;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private poiService: POIService,
    // Define um membro interno desta classe.
    private alertCtrl: AlertController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController,
    // Define um membro interno desta classe.
    private mapCacheService: MapCacheService,
    // Define um membro interno desta classe.
    private photoShareService: PhotoShareService,
    // Define um membro interno desta classe.
    private firebaseStorageService: FirebaseStorageService
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub = this.route.paramMap.subscribe(params => {
      // Atualiza ou consulta estado da pagina.
      this.diaId = params.get('diaId');
      // Atualiza ou consulta estado da pagina.
      this.poiId = params.get('poiId');

      // Tentar obter o ID da viagem dos parents
      let currentRoute = this.route.parent;
      // Define um metodo chamado pela pagina ou por outros metodos.
      while (currentRoute) {
        // Cria uma variavel local para esta operacao.
        const idFromParent = currentRoute.snapshot.paramMap.get('id');
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (idFromParent) {
          // Atualiza ou consulta estado da pagina.
          this.viagemId = idFromParent;
          // Executa uma instrucao necessaria para este fluxo.
          break;
        }
        // Atribui um valor a esta propriedade.
        currentRoute = currentRoute.parent;
      }

      // Se ainda não encontrou, extrair da URL (fallback)
      if (!this.viagemId) {
        // Cria uma variavel local para esta operacao.
        const urlParts = this.router.url.split('/');
        // Cria uma variavel local para esta operacao.
        const viagensIndex = urlParts.indexOf('viagens');
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (viagensIndex >= 0 && viagensIndex < urlParts.length - 1) {
          // Atualiza ou consulta estado da pagina.
          this.viagemId = urlParts[viagensIndex + 1];
        }
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.viagemId || !this.diaId || !this.poiId) {
        // Atualiza ou consulta estado da pagina.
        this.erro = 'IDs de viagem, dia ou POI inválidos.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.carregarPoi();
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngAfterViewInit() {
    // Atualiza ou consulta estado da pagina.
    this.agendarAtualizacaoMapa();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.poiSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.destruirMapa();
  }

  // Define um membro interno desta classe.
  private carregarPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.diaId || !this.poiId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';
    // Atualiza ou consulta estado da pagina.
    this.poi = null;
    // Atualiza ou consulta estado da pagina.
    this.diaAtual = null;

    // Atualiza ou consulta estado da pagina.
    this.poiSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.poiSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      // Define um campo ou opcao de configuracao.
      next: (viagem) => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!viagem || !viagem.dias) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Viagem não encontrada.';
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
          // Devolve o resultado deste bloco.
          return;
        }

        // Cria uma variavel local para esta operacao.
        const dia = viagem.dias.find(d => d.id === this.diaId);
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!dia || !dia.pontosInteresse) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Dia ou POI não encontrado.';
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
          // Devolve o resultado deste bloco.
          return;
        }

        // Cria uma variavel local para esta operacao.
        const poiEncontrado = dia.pontosInteresse.find(p => p.id === this.poiId);
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!poiEncontrado) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'POI não encontrado.';
          // Atualiza ou consulta estado da pagina.
          this.carregando = false;
          // Devolve o resultado deste bloco.
          return;
        }

        // Executa uma instrucao necessaria para este fluxo.
        console.log('POI carregado:', poiEncontrado);
        // Atualiza ou consulta estado da pagina.
        this.viagem = viagem;
        // Atualiza ou consulta estado da pagina.
        this.diaAtual = dia;
        // Atualiza ou consulta estado da pagina.
        this.poi = poiEncontrado;
        // Atualiza ou consulta estado da pagina.
        this.fotoUrl = this.poi.fotoUrl || undefined;
        // Atualiza ou consulta estado da pagina.
        this.carregarNotas();
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.agendarAtualizacaoMapa();
      },
      // Define um campo ou opcao de configuracao.
      error: (err) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.erro = err?.message || 'Erro ao carregar POI.';
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar POI:', err);
      }
    });
  }

  // Define um membro interno desta classe.
  private carregarNotas() {
    // Para agora, as notas são armazenadas localmente
    // Pode ser expandido para usar Firebase
    const notasStorage = localStorage.getItem(`notas-poi-${this.poiId}`);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (notasStorage) {
      // Atualiza ou consulta estado da pagina.
      this.notas = JSON.parse(notasStorage);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.notas = [];
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterColaboradorLabel(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.colaboradorNome?.trim() || poi.colaboradorEmail || (poi.colaboradorUid ? 'Colaborador' : '');
  }

  // Define um membro interno desta classe.
  private guardarNotas() {
    // Executa uma instrucao necessaria para este fluxo.
    localStorage.setItem(`notas-poi-${this.poiId}`, JSON.stringify(this.notas));
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarNota() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.novaNotaTexto.trim()) {
      // Cria uma variavel local para esta operacao.
      const alert = await this.alertCtrl.create({
        // Define um campo ou opcao de configuracao.
        header: 'Nota vazia',
        // Define um campo ou opcao de configuracao.
        message: 'Por favor escreva algo na nota.',
        // Define um campo ou opcao de configuracao.
        buttons: ['OK']
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await alert.present();
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const novaNota = {
      // Define um campo ou opcao de configuracao.
      id: `nota-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      // Define um campo ou opcao de configuracao.
      texto: this.novaNotaTexto.trim(),
      // Define um campo ou opcao de configuracao.
      data: new Date()
    };

    // Atualiza ou consulta estado da pagina.
    this.notas.push(novaNota);
    // Atualiza ou consulta estado da pagina.
    this.guardarNotas();
    // Atualiza ou consulta estado da pagina.
    this.novaNotaTexto = '';

    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Define um campo ou opcao de configuracao.
      message: 'Nota adicionada com sucesso!',
      // Define um campo ou opcao de configuracao.
      duration: 1500,
      // Define um campo ou opcao de configuracao.
      color: 'success'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async eliminarNota(notaId: string) {
    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar nota?',
      // Define um campo ou opcao de configuracao.
      message: 'Tem a certeza que quer eliminar esta nota?',
      // Define um campo ou opcao de configuracao.
      buttons: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Cancelar',
          // Define um campo ou opcao de configuracao.
          role: 'cancel'
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Eliminar',
          // Define um campo ou opcao de configuracao.
          handler: async () => {
            // Atualiza ou consulta estado da pagina.
            this.notas = this.notas.filter(n => n.id !== notaId);
            // Atualiza ou consulta estado da pagina.
            this.guardarNotas();
            // Cria uma variavel local para esta operacao.
            const toast = await this.toastCtrl.create({
              // Define um campo ou opcao de configuracao.
              message: 'Nota eliminada.',
              // Define um campo ou opcao de configuracao.
              duration: 1500,
              // Define um campo ou opcao de configuracao.
              color: 'warning'
            });
            // Aguarda a conclusao de uma operacao assincrona.
            await toast.present();
          }
        }
      ]
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  selecionarFoto() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;
    // Atualiza ou consulta estado da pagina.
    this.fotoInput?.nativeElement.click();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async onFotoSelecionada(event: any) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const file = event.target.files[0];
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!file) return;

    // Cria uma variavel local para esta operacao.
    const reader = new FileReader();
    // Executa uma instrucao necessaria para este fluxo.
    reader.onload = async (e: any) => {
      // Cria uma variavel local para esta operacao.
      const dataUrl = String(e.target.result || '');

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.poi && this.viagemId && this.diaId && this.poiId) {
        // Inicia um bloco protegido contra erros.
        try {
          // Cria uma variavel local para esta operacao.
          const fotoUrl = await this.firebaseStorageService.uploadPoiPhoto(
            // Atualiza ou consulta estado da pagina.
            this.viagemId,
            // Atualiza ou consulta estado da pagina.
            this.diaId,
            // Atualiza ou consulta estado da pagina.
            this.poiId,
            // Executa uma instrucao necessaria para este fluxo.
            dataUrl
          );

          // Atualiza ou consulta estado da pagina.
          this.fotoUrl = fotoUrl;

          // Aguarda a conclusao de uma operacao assincrona.
          await this.poiService.atualizarPOI(
            // Atualiza ou consulta estado da pagina.
            this.viagemId,
            // Atualiza ou consulta estado da pagina.
            this.diaId,
            // Atualiza ou consulta estado da pagina.
            this.poiId,
            // Executa uma instrucao necessaria para este fluxo.
            { fotoUrl }
          );

          // Cria uma variavel local para esta operacao.
          const toast = await this.toastCtrl.create({
            // Define um campo ou opcao de configuracao.
            message: 'Foto adicionada com sucesso!',
            // Define um campo ou opcao de configuracao.
            duration: 1500,
            // Define um campo ou opcao de configuracao.
            color: 'success'
          });
          // Aguarda a conclusao de uma operacao assincrona.
          await toast.present();
        // Executa uma instrucao necessaria para este fluxo.
        } catch (error: any) {
          // Cria uma variavel local para esta operacao.
          const toast = await this.toastCtrl.create({
            // Define um campo ou opcao de configuracao.
            message: error?.message || 'Erro ao adicionar foto.',
            // Define um campo ou opcao de configuracao.
            duration: 2000,
            // Define um campo ou opcao de configuracao.
            color: 'danger'
          });
          // Aguarda a conclusao de uma operacao assincrona.
          await toast.present();
        }
      }
    };
    // Executa uma instrucao necessaria para este fluxo.
    reader.readAsDataURL(file);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async eliminarFoto() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar foto?',
      // Define um campo ou opcao de configuracao.
      message: 'Tem a certeza que quer eliminar esta foto?',
      // Define um campo ou opcao de configuracao.
      buttons: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Cancelar',
          // Define um campo ou opcao de configuracao.
          role: 'cancel'
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Eliminar',
          // Define um campo ou opcao de configuracao.
          handler: async () => {
            // Atualiza ou consulta estado da pagina.
            this.fotoUrl = undefined;

            // Define um metodo chamado pela pagina ou por outros metodos.
            if (this.poi && this.viagemId && this.diaId && this.poiId) {
              // Inicia um bloco protegido contra erros.
              try {
                // Aguarda a conclusao de uma operacao assincrona.
                await this.poiService.atualizarPOI(
                  // Atualiza ou consulta estado da pagina.
                  this.viagemId,
                  // Atualiza ou consulta estado da pagina.
                  this.diaId,
                  // Atualiza ou consulta estado da pagina.
                  this.poiId,
                  // Executa uma instrucao necessaria para este fluxo.
                  { fotoUrl: undefined }
                );

                // Cria uma variavel local para esta operacao.
                const toast = await this.toastCtrl.create({
                  // Define um campo ou opcao de configuracao.
                  message: 'Foto eliminada.',
                  // Define um campo ou opcao de configuracao.
                  duration: 1500,
                  // Define um campo ou opcao de configuracao.
                  color: 'warning'
                });
                // Aguarda a conclusao de uma operacao assincrona.
                await toast.present();
              // Executa uma instrucao necessaria para este fluxo.
              } catch (error: any) {
                // Cria uma variavel local para esta operacao.
                const toast = await this.toastCtrl.create({
                  // Define um campo ou opcao de configuracao.
                  message: error?.message || 'Erro ao eliminar foto.',
                  // Define um campo ou opcao de configuracao.
                  duration: 2000,
                  // Define um campo ou opcao de configuracao.
                  color: 'danger'
                });
                // Aguarda a conclusao de uma operacao assincrona.
                await toast.present();
              }
            }
          }
        }
      ]
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async partilharFotoPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.fotoUrl || !this.poi) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const podePartilhar = await this.photoShareService.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!podePartilhar) {
        // Cria uma variavel local para esta operacao.
        const toast = await this.toastCtrl.create({
          // Define um campo ou opcao de configuracao.
          message: 'Partilha de fotos não disponível neste dispositivo.',
          // Define um campo ou opcao de configuracao.
          duration: 2000,
          // Define um campo ou opcao de configuracao.
          color: 'medium'
        });
        // Aguarda a conclusao de uma operacao assincrona.
        await toast.present();
        // Devolve o resultado deste bloco.
        return;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.photoShareService.sharePhoto(this.fotoUrl, {
        // Define um campo ou opcao de configuracao.
        title: this.poi.nome || 'Foto do POI',
        // Define um campo ou opcao de configuracao.
        text: this.criarTextoPartilhaFotoPoi(),
        // Define um campo ou opcao de configuracao.
        dialogTitle: 'Partilhar foto',
        // Define um campo ou opcao de configuracao.
        fileNamePrefix: this.poi.nome || 'foto-poi'
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.message?.toLowerCase().includes('cancel')) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error?.message || 'Erro ao partilhar foto.',
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'danger'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async iniciarEdicao() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.poi || !this.podeEditarViagem) return;
    // Atualiza ou consulta estado da pagina.
    this.poiEditavel = {
      // Define um campo ou opcao de configuracao.
      nota: this.poi.nota || '',
      // Define um campo ou opcao de configuracao.
      custo: this.poi.custo || undefined,
      // Define um campo ou opcao de configuracao.
      avaliacao: this.poi.avaliacao || 0
    };
    // Atualiza ou consulta estado da pagina.
    this.modoEdicao = true;

    // Aguarda a conclusao de uma operacao assincrona.
    await new Promise(resolve => setTimeout(resolve, 50));
    // Cria uma variavel local para esta operacao.
    const top = this.editSection?.nativeElement.offsetTop ?? 0;
    // Aguarda a conclusao de uma operacao assincrona.
    await this.content?.scrollToPoint(0, top, 500);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  normalizarCustoEditavel(event: CustomEvent<{ value?: string | null }>) {
    // Atualiza ou consulta estado da pagina.
    this.poiEditavel.custo = this.normalizarDecimal(event.detail?.value);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async guardarEdicao() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.poi || !this.viagemId || !this.diaId || !this.poiId || !this.podeEditarViagem) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const poiAtualizado = {
        // Executa uma instrucao necessaria para este fluxo.
        ...this.poi,
        // Define um campo ou opcao de configuracao.
        nota: this.poiEditavel.nota,
        // Define um campo ou opcao de configuracao.
        custo: this.poiEditavel.custo ? Number(this.poiEditavel.custo) : undefined,
        // Define um campo ou opcao de configuracao.
        avaliacao: this.poiEditavel.avaliacao
      };

      // Aguarda a conclusao de uma operacao assincrona.
      await this.poiService.atualizarPOI(
        // Atualiza ou consulta estado da pagina.
        this.viagemId,
        // Atualiza ou consulta estado da pagina.
        this.diaId,
        // Atualiza ou consulta estado da pagina.
        this.poiId,
        // Executa uma instrucao necessaria para este fluxo.
        poiAtualizado
      );

      // Atualiza ou consulta estado da pagina.
      this.poi = poiAtualizado;
      // Atualiza ou consulta estado da pagina.
      this.modoEdicao = false;

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: 'POI atualizado com sucesso!',
        // Define um campo ou opcao de configuracao.
        duration: 1500,
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error?.message || 'Erro ao atualizar POI.',
        // Define um campo ou opcao de configuracao.
        duration: 2000,
        // Define um campo ou opcao de configuracao.
        color: 'danger'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  cancelarEdicao() {
    // Atualiza ou consulta estado da pagina.
    this.modoEdicao = false;
    // Atualiza ou consulta estado da pagina.
    this.poiEditavel = {};
  }

  // Define um membro interno desta classe.
  private normalizarDecimal(valor: unknown): string {
    // Cria uma variavel local para esta operacao.
    const texto = String(valor ?? '').replace(',', '.');
    // Cria uma variavel local para esta operacao.
    const limpo = texto.replace(/[^\d.]/g, '');
    // Cria uma variavel local para esta operacao.
    const [inteiro, ...partesDecimais] = limpo.split('.');
    // Cria uma variavel local para esta operacao.
    const decimal = partesDecimais.join('').slice(0, 2);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (partesDecimais.length > 0) {
      // Devolve o resultado deste bloco.
      return `${inteiro}.${decimal}`;
    }

    // Devolve o resultado deste bloco.
    return inteiro;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async eliminarPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar POI?',
      // Define um campo ou opcao de configuracao.
      message: `Tem a certeza que quer eliminar "${this.poi?.nome}"? Esta ação não pode ser desfeita.`,
      // Define um campo ou opcao de configuracao.
      buttons: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Cancelar',
          // Define um campo ou opcao de configuracao.
          role: 'cancel'
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: 'Eliminar',
          // Define um campo ou opcao de configuracao.
          role: 'destructive',
          // Define um campo ou opcao de configuracao.
          handler: async () => {
            // Define um metodo chamado pela pagina ou por outros metodos.
            if (!this.poi || !this.viagemId || !this.diaId || !this.poiId) {
              // Devolve o resultado deste bloco.
              return;
            }

            // Inicia um bloco protegido contra erros.
            try {
              // Aguarda a conclusao de uma operacao assincrona.
              await this.poiService.eliminarPOI(this.viagemId, this.diaId, this.poiId);

              // Cria uma variavel local para esta operacao.
              const toast = await this.toastCtrl.create({
                // Define um campo ou opcao de configuracao.
                message: 'POI eliminado com sucesso!',
                // Define um campo ou opcao de configuracao.
                duration: 1500,
                // Define um campo ou opcao de configuracao.
                color: 'success'
              });
              // Aguarda a conclusao de uma operacao assincrona.
              await toast.present();

              // Voltar para o dia após eliminar
              setTimeout(() => {
                // Atualiza ou consulta estado da pagina.
                this.voltar();
              // Executa uma instrucao necessaria para este fluxo.
              }, 1500);
            // Executa uma instrucao necessaria para este fluxo.
            } catch (error: any) {
              // Cria uma variavel local para esta operacao.
              const toast = await this.toastCtrl.create({
                // Define um campo ou opcao de configuracao.
                message: error?.message || 'Erro ao eliminar POI.',
                // Define um campo ou opcao de configuracao.
                duration: 2000,
                // Define um campo ou opcao de configuracao.
                color: 'danger'
              });
              // Aguarda a conclusao de uma operacao assincrona.
              await toast.present();
            }
          }
        }
      ]
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemId && this.diaId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temLocalizacao(): boolean {
    // Devolve o resultado deste bloco.
    return typeof this.poi?.latitude === 'number' && typeof this.poi?.longitude === 'number';
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get poisDoDiaComLocalizacao(): POI[] {
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (this.diaAtual?.pontosInteresse || []).filter(poi =>
      // Executa uma instrucao necessaria para este fluxo.
      typeof poi.latitude === 'number' && typeof poi.longitude === 'number'
    );
  }

  // Executa uma instrucao necessaria para este fluxo.
  get poisDoDiaOrdenadosComLocalizacao(): POI[] {
    // Define um metodo chamado pela pagina ou por outros metodos.
    return (this.diaAtual?.pontosInteresse || [])
      // Executa uma instrucao necessaria para este fluxo.
      .map((poi, index) => ({ poi, index }))
      // Executa uma instrucao necessaria para este fluxo.
      .filter(item =>
        // Executa uma instrucao necessaria para este fluxo.
        typeof item.poi.latitude === 'number' && typeof item.poi.longitude === 'number'
      )
      // Executa uma instrucao necessaria para este fluxo.
      .sort((a, b) => {
        // Cria uma variavel local para esta operacao.
        const ordemA = typeof a.poi.ordem === 'number' ? a.poi.ordem : a.index;
        // Cria uma variavel local para esta operacao.
        const ordemB = typeof b.poi.ordem === 'number' ? b.poi.ordem : b.index;
        // Devolve o resultado deste bloco.
        return ordemA - ordemB;
      })
      // Executa uma instrucao necessaria para este fluxo.
      .map(item => item.poi);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temPercursoDoDia(): boolean {
    // Devolve o resultado deste bloco.
    return this.poisDoDiaOrdenadosComLocalizacao.length > 1;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temMapaDoDia(): boolean {
    // Devolve o resultado deste bloco.
    return this.poisDoDiaComLocalizacao.length > 0;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async partilharPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.poi) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const texto = this.criarTextoPartilhaPoi(this.poi);
    // Cria uma variavel local para esta operacao.
    const url = this.obterUrlPartilhaPoi(this.poi);

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const podePartilhar = await Share.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!podePartilhar.value) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.copiarPartilhaPoi(texto, url);
        // Devolve o resultado deste bloco.
        return;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await Share.share({
        // Define um campo ou opcao de configuracao.
        title: this.poi.nome,
        // Define um campo ou opcao de configuracao.
        text: texto,
        // Executa uma instrucao necessaria para este fluxo.
        url,
        // Define um campo ou opcao de configuracao.
        dialogTitle: 'Partilhar POI'
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.message?.toLowerCase().includes('cancel')) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.copiarPartilhaPoi(texto, url);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirMapa() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.temLocalizacao) {
      // Cria uma variavel local para esta operacao.
      const mapsUrl = this.obterUrlMapaPoi(this.poi);
      // Executa uma instrucao necessaria para este fluxo.
      window.open(mapsUrl, '_blank');
    }
  }

  // Define um membro interno desta classe.
  private criarTextoPartilhaPoi(poi: POI): string {
    // Cria uma variavel local para esta operacao.
    const linhas = [
      // Executa uma instrucao necessaria para este fluxo.
      poi.nome,
      // Executa uma instrucao necessaria para este fluxo.
      poi.tipo || poi.categoria ? `Tipo: ${poi.tipo || poi.categoria}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.descricao ? `Descrição: ${poi.descricao}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.endereco ? `Endereço: ${poi.endereco}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.horario ? `Horário: ${poi.horario}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.custo !== undefined && poi.custo !== null ? `Custo: € ${Number(poi.custo).toFixed(2)}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.avaliacao ? `Avaliação: ${poi.avaliacao}/5` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.nota ? `Nota: ${poi.nota}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      poi.url ? `Site: ${poi.url}` : '',
      // Atualiza ou consulta estado da pagina.
      this.temLocalizacao ? `Mapa: ${this.obterUrlMapaPoi(poi)}` : ''
    ];

    // Devolve o resultado deste bloco.
    return linhas.filter(Boolean).join('\n');
  }

  // Define um membro interno desta classe.
  private criarTextoPartilhaFotoPoi(): string {
    // Cria uma variavel local para esta operacao.
    const linhas = [
      // Atualiza ou consulta estado da pagina.
      this.poi?.nome ? `Foto de ${this.poi.nome}` : 'Foto de viagem',
      // Atualiza ou consulta estado da pagina.
      this.poi?.endereco ? `Local: ${this.poi.endereco}` : '',
      // Atualiza ou consulta estado da pagina.
      this.temLocalizacao ? `Mapa: ${this.obterUrlMapaPoi(this.poi)}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      'Partilhado com Passear Contigo'
    ];

    // Devolve o resultado deste bloco.
    return linhas.filter(Boolean).join('\n');
  }

  // Define um membro interno desta classe.
  private obterUrlPartilhaPoi(poi: POI): string | undefined {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.temLocalizacao) {
      // Devolve o resultado deste bloco.
      return this.obterUrlMapaPoi(poi);
    }

    // Devolve o resultado deste bloco.
    return poi.url || undefined;
  }

  // Define um membro interno desta classe.
  private obterUrlMapaPoi(poi: POI | null): string {
    // Devolve o resultado deste bloco.
    return `https://www.openstreetmap.org/?mlat=${poi?.latitude}&mlon=${poi?.longitude}#map=16/${poi?.latitude}/${poi?.longitude}`;
  }

  // Define um membro interno desta classe.
  private async copiarPartilhaPoi(texto: string, url?: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const textoComLink = url && !texto.includes(url)
      // Executa uma instrucao necessaria para este fluxo.
      ? `${texto}\n${url}`
      // Executa uma instrucao necessaria para este fluxo.
      : texto;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.copiarParaClipboard(textoComLink);

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: 'Partilha copiada. Pode colar onde quiser.',
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error?.message || 'Não foi possível partilhar este POI.',
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'danger'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    }
  }

  // Define um membro interno desta classe.
  private async copiarParaClipboard(texto: string): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (navigator.clipboard?.writeText) {
      // Aguarda a conclusao de uma operacao assincrona.
      await navigator.clipboard.writeText(texto);
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const textarea = document.createElement('textarea');
    // Executa uma instrucao necessaria para este fluxo.
    textarea.value = texto;
    // Executa uma instrucao necessaria para este fluxo.
    textarea.setAttribute('readonly', '');
    // Executa uma instrucao necessaria para este fluxo.
    textarea.style.position = 'fixed';
    // Executa uma instrucao necessaria para este fluxo.
    textarea.style.left = '-9999px';
    // Executa uma instrucao necessaria para este fluxo.
    document.body.appendChild(textarea);
    // Executa uma instrucao necessaria para este fluxo.
    textarea.select();

    // Cria uma variavel local para esta operacao.
    const copiou = document.execCommand('copy');
    // Executa uma instrucao necessaria para este fluxo.
    document.body.removeChild(textarea);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!copiou) {
      // Executa uma instrucao necessaria para este fluxo.
      throw new Error('Não foi possível copiar a partilha.');
    }
  }

  // Define um membro interno desta classe.
  private agendarAtualizacaoMapa() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    setTimeout(() => this.atualizarMapaLeaflet(), 0);
  }

  // Define um membro interno desta classe.
  private atualizarMapaLeaflet() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temMapaDoDia || !this.mapaPoi?.nativeElement) {
      // Atualiza ou consulta estado da pagina.
      this.destruirCamadasMapa();
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const leaflet = (window as any).L;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!leaflet) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Leaflet não foi carregado pelo CDN.');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const poisComLocalizacao = this.poisDoDiaOrdenadosComLocalizacao;
    // Cria uma variavel local para esta operacao.
    const poiFocado = poisComLocalizacao.find(poi => poi.id === this.poi?.id) || poisComLocalizacao[0];
    // Cria uma variavel local para esta operacao.
    const centro: [number, number] = [poiFocado.latitude!, poiFocado.longitude!];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.mapaLeaflet) {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet = leaflet.map(this.mapaPoi.nativeElement).setView(centro, 16);
      // Atualiza ou consulta estado da pagina.
      this.criarTileLayerComCache(leaflet).addTo(this.mapaLeaflet);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.setView(centro, 16);
    }

    // Atualiza ou consulta estado da pagina.
    this.destruirCamadasMapa();

    // Cria uma variavel local para esta operacao.
    const pontos: Array<[number, number]> = [];

    // Executa uma instrucao necessaria para este fluxo.
    poisComLocalizacao.forEach((poi, index) => {
      // Cria uma variavel local para esta operacao.
      const posicao: [number, number] = [poi.latitude!, poi.longitude!];
      // Cria uma variavel local para esta operacao.
      const marcador = leaflet
        // Executa uma instrucao necessaria para este fluxo.
        .marker(posicao, {
          // Define um campo ou opcao de configuracao.
          icon: this.criarIconePoi(leaflet, poi, index)
        })
        // Executa uma instrucao necessaria para este fluxo.
        .addTo(this.mapaLeaflet);

      // Executa uma instrucao necessaria para este fluxo.
      marcador.bindPopup(this.criarPopupPoi(poi, index));
      // Executa uma instrucao necessaria para este fluxo.
      marcador.on('click', () => this.navegarParaPoi(poi));
      // Atualiza ou consulta estado da pagina.
      this.marcadoresLeaflet.push(marcador);
      // Executa uma instrucao necessaria para este fluxo.
      pontos.push(posicao);
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (pontos.length > 1) {
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet = leaflet
        // Executa uma instrucao necessaria para este fluxo.
        .polyline(pontos, {
          // Define um campo ou opcao de configuracao.
          color: '#2c7a6e',
          // Define um campo ou opcao de configuracao.
          dashArray: '8 8',
          // Define um campo ou opcao de configuracao.
          lineCap: 'round',
          // Define um campo ou opcao de configuracao.
          lineJoin: 'round',
          // Define um campo ou opcao de configuracao.
          opacity: 0.86,
          // Define um campo ou opcao de configuracao.
          weight: 4
        })
        // Executa uma instrucao necessaria para este fluxo.
        .addTo(this.mapaLeaflet);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (pontos.length > 1) {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.fitBounds(leaflet.latLngBounds(pontos), {
        // Define um campo ou opcao de configuracao.
        maxZoom: 16,
        // Define um campo ou opcao de configuracao.
        padding: [28, 28]
      });
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.setView(centro, 16);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    setTimeout(() => this.mapaLeaflet?.invalidateSize(), 100);
  }

  // Define um membro interno desta classe.
  private criarTileLayerComCache(leaflet: any): any {
    // Cria uma variavel local para esta operacao.
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    // Cria uma variavel local para esta operacao.
    const tileLayer = leaflet.tileLayer(tileUrl, {
      // Define um campo ou opcao de configuracao.
      attribution: '&copy; OpenStreetMap contributors',
      // Define um campo ou opcao de configuracao.
      maxZoom: 19
    });

    // Cria uma variavel local para esta operacao.
    const originalGetTileUrl = tileLayer.getTileUrl.bind(tileLayer);
    // Executa uma instrucao necessaria para este fluxo.
    tileLayer.getTileUrl = (coords: any) => {
      // Cria uma variavel local para esta operacao.
      const url = originalGetTileUrl(coords);
      // Atualiza ou consulta estado da pagina.
      this.cachearTileEmBackground(url);
      // Devolve o resultado deste bloco.
      return url;
    };

    // Cria uma variavel local para esta operacao.
    const originalCreateTile = tileLayer.createTile.bind(tileLayer);
    // Executa uma instrucao necessaria para este fluxo.
    tileLayer.createTile = (coords: any) => {
      // Cria uma variavel local para esta operacao.
      const tile = originalCreateTile(coords);
      // Cria uma variavel local para esta operacao.
      const url = tileLayer.getTileUrl(coords);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (tile instanceof HTMLImageElement) {
        // Cria uma variavel local para esta operacao.
        const originalSrc = tile.src;

        // Executa uma instrucao necessaria para este fluxo.
        tile.onerror = async () => {
          // Cria uma variavel local para esta operacao.
          const cacheBlob = await this.mapCacheService.obterTile(url);
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (cacheBlob) {
            // Cria uma variavel local para esta operacao.
            const objectUrl = URL.createObjectURL(cacheBlob);
            // Executa uma instrucao necessaria para este fluxo.
            tile.src = objectUrl;
          // Executa uma instrucao necessaria para este fluxo.
          } else {
            // Cria uma variavel local para esta operacao.
            const canvas = document.createElement('canvas');
            // Executa uma instrucao necessaria para este fluxo.
            canvas.width = 256;
            // Executa uma instrucao necessaria para este fluxo.
            canvas.height = 256;
            // Cria uma variavel local para esta operacao.
            const ctx = canvas.getContext('2d');
            // Define um metodo chamado pela pagina ou por outros metodos.
            if (ctx) {
              // Executa uma instrucao necessaria para este fluxo.
              ctx.fillStyle = '#f0f0f0';
              // Executa uma instrucao necessaria para este fluxo.
              ctx.fillRect(0, 0, 256, 256);
              // Executa uma instrucao necessaria para este fluxo.
              ctx.fillStyle = '#999';
              // Executa uma instrucao necessaria para este fluxo.
              ctx.textAlign = 'center';
              // Executa uma instrucao necessaria para este fluxo.
              ctx.textBaseline = 'middle';
              // Executa uma instrucao necessaria para este fluxo.
              ctx.fillText('Offline', 128, 128);
            }
            // Executa uma instrucao necessaria para este fluxo.
            tile.src = canvas.toDataURL();
          }
        };

        // Cria uma variavel local para esta operacao.
        const originalOnload = tile.onload;
        // Executa uma instrucao necessaria para este fluxo.
        tile.onload = () => {
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (originalOnload) originalOnload.call(tile, new Event('load'));
          // Atualiza ou consulta estado da pagina.
          this.cachearTileDeImg(url, tile);
        };

        // Executa uma instrucao necessaria para este fluxo.
        tile.src = originalSrc;
      }

      // Devolve o resultado deste bloco.
      return tile;
    };

    // Devolve o resultado deste bloco.
    return tileLayer;
  }

  // Define um membro interno desta classe.
  private cachearTileEmBackground(url: string): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    fetch(url)
      // Executa uma instrucao necessaria para este fluxo.
      .then(res => res.blob())
      // Executa uma instrucao necessaria para este fluxo.
      .then(blob => this.mapCacheService.cachearTile(url, blob))
      // Executa uma instrucao necessaria para este fluxo.
      .catch(() => {});
  }

  // Define um membro interno desta classe.
  private cachearTileDeImg(url: string, imgElement: HTMLImageElement): void {
    // Cria uma variavel local para esta operacao.
    const canvas = document.createElement('canvas');
    // Cria uma variavel local para esta operacao.
    const ctx = canvas.getContext('2d');
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!ctx) return;

    // Executa uma instrucao necessaria para este fluxo.
    canvas.width = imgElement.width || 256;
    // Executa uma instrucao necessaria para este fluxo.
    canvas.height = imgElement.height || 256;
    // Executa uma instrucao necessaria para este fluxo.
    ctx.drawImage(imgElement, 0, 0);

    // Executa uma instrucao necessaria para este fluxo.
    canvas.toBlob(blob => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (blob) {
        // Atualiza ou consulta estado da pagina.
        this.mapCacheService.cachearTile(url, blob);
      }
    // Executa uma instrucao necessaria para este fluxo.
    }, 'image/png');
  }

  // Define um membro interno desta classe.
  private destruirMapa() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.mapaLeaflet) {
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet.remove();
      // Atualiza ou consulta estado da pagina.
      this.mapaLeaflet = null;
      // Atualiza ou consulta estado da pagina.
      this.marcadoresLeaflet = [];
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet = null;
    }
  }

  // Define um membro interno desta classe.
  private destruirCamadasMapa() {
    // Atualiza ou consulta estado da pagina.
    this.marcadoresLeaflet.forEach(marcador => marcador.remove());
    // Atualiza ou consulta estado da pagina.
    this.marcadoresLeaflet = [];

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.rotaLeaflet) {
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet.remove();
      // Atualiza ou consulta estado da pagina.
      this.rotaLeaflet = null;
    }
  }

  // Define um membro interno desta classe.
  private navegarParaPoi(poi: POI) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.diaId || poi.id === this.poiId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'poi', poi.id]);
  }

  // Define um membro interno desta classe.
  private criarIconePoi(leaflet: any, poi: POI, index: number) {
    // Cria uma variavel local para esta operacao.
    const ativo = poi.id === this.poi?.id;
    // Cria uma variavel local para esta operacao.
    const numero = String(index + 1);
    // Cria uma variavel local para esta operacao.
    const cor = this.obterCorPin(poi.categoria);
    // Cria uma variavel local para esta operacao.
    const escala = ativo ? ' scale(1.12)' : '';
    // Cria uma variavel local para esta operacao.
    const sombra = ativo
      // Executa uma instrucao necessaria para este fluxo.
      ? '0 0 0 4px rgba(242, 201, 76, 0.34), 0 4px 10px rgba(0, 0, 0, 0.32)'
      // Executa uma instrucao necessaria para este fluxo.
      : '0 3px 8px rgba(0, 0, 0, 0.28)';
    // Cria uma variavel local para esta operacao.
    const borda = ativo ? '#f2c94c' : '#ffffff';

    // Devolve o resultado deste bloco.
    return leaflet.divIcon({
      // Define um campo ou opcao de configuracao.
      className: '',
      // Define um campo ou opcao de configuracao.
      html: `
        // Executa uma instrucao necessaria para este fluxo.
        <span style="
          // Executa uma instrucao necessaria para este fluxo.
          align-items:center;background:${cor};border:2px solid ${borda};border-radius:50% 50% 50% 0;
          // Executa uma instrucao necessaria para este fluxo.
          box-shadow:${sombra};color:#fff;display:flex;font-size:12px;font-weight:700;height:30px;
          // Executa uma instrucao necessaria para este fluxo.
          justify-content:center;line-height:1;transform:rotate(-45deg)${escala};width:30px;">
          // Executa uma instrucao necessaria para este fluxo.
          <span style="transform:rotate(45deg);">${numero}</span>
        // Executa uma instrucao necessaria para este fluxo.
        </span>
      // Executa uma instrucao necessaria para este fluxo.
      `,
      // Define um campo ou opcao de configuracao.
      iconAnchor: [15, 34],
      // Define um campo ou opcao de configuracao.
      iconSize: [30, 34],
      // Define um campo ou opcao de configuracao.
      popupAnchor: [0, -30]
    });
  }

  // Define um membro interno desta classe.
  private criarPopupPoi(poi: POI, index: number): string {
    // Cria uma variavel local para esta operacao.
    const nome = this.escapeHtml(poi.nome || `POI ${index + 1}`);
    // Cria uma variavel local para esta operacao.
    const tipo = poi.tipo || poi.categoria;
    // Cria uma variavel local para esta operacao.
    const endereco = poi.endereco;

    // Devolve o resultado deste bloco.
    return [
      // Executa uma instrucao necessaria para este fluxo.
      `<strong>${index + 1}. ${nome}</strong>`,
      // Executa uma instrucao necessaria para este fluxo.
      tipo ? `<br><span>${this.escapeHtml(tipo)}</span>` : '',
      // Executa uma instrucao necessaria para este fluxo.
      endereco ? `<br><small>${this.escapeHtml(endereco)}</small>` : ''
    // Executa uma instrucao necessaria para este fluxo.
    ].join('');
  }

  // Define um membro interno desta classe.
  private escapeHtml(valor: string): string {
    // Devolve o resultado deste bloco.
    return valor
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/&/g, '&amp;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/</g, '&lt;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/>/g, '&gt;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/"/g, '&quot;')
      // Executa uma instrucao necessaria para este fluxo.
      .replace(/'/g, '&#039;');
  }

  // Define um membro interno desta classe.
  private obterCorPin(categoria?: string): string {
    // Cria uma variavel local para esta operacao.
    const cores: Record<string, string> = {
      // Define um campo ou opcao de configuracao.
      gastronomia: '#e8823a',
      // Define um campo ou opcao de configuracao.
      cultura: '#5e35b1',
      // Define um campo ou opcao de configuracao.
      natureza: '#2c7a6e',
      // Define um campo ou opcao de configuracao.
      aventura: '#d84315',
      // Define um campo ou opcao de configuracao.
      compras: '#c2185b',
      // Define um campo ou opcao de configuracao.
      hospedagem: '#00796b',
      // Define um campo ou opcao de configuracao.
      outro: '#607d8b'
    };

    // Devolve o resultado deste bloco.
    return cores[categoria || 'outro'] || cores['outro'];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirTelefone() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.poi?.telefone) {
      // Executa uma instrucao necessaria para este fluxo.
      window.open(`tel:${this.poi.telefone}`);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirUrl() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.poi?.url) {
      // Executa uma instrucao necessaria para este fluxo.
      window.open(this.poi.url, '_blank');
    }
  }

}
