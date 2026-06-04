// app/pages/viagem-detalhe/viagem-detalhe.page.ts | Controlador da pagina viagem detalhe, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnDestroy, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { AlertController, NavController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Subscription } from 'rxjs';
// Importa dependencias usadas neste ficheiro.
import { Unsubscribe } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { Dia, POI, Viagem, VisibilidadePublicacao } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { PublicacoesService } from '../../services/publicacoes.service';
// Importa dependencias usadas neste ficheiro.
import { CameraService } from '../../services/camera.service';
// Importa dependencias usadas neste ficheiro.
import { FirebaseStorageService } from '../../services/firebase-storage.service';
// Importa dependencias usadas neste ficheiro.
import { GeolocationService } from '../../services/geolocation.service';
// Importa dependencias usadas neste ficheiro.
import { NominatimService } from '../../services/nominatim.service';
// Importa dependencias usadas neste ficheiro.
import { ItinerarioPdfService } from '../../services/itinerario-pdf.service';
// Importa dependencias usadas neste ficheiro.
import { PdfShareService } from '../../services/pdf-share.service';

// Contrato de dados usado para tipar objetos desta area.
interface DiaViewModel {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Define um campo ou opcao de configuracao.
  data: string;
  // Define um campo ou opcao de configuracao.
  local: string;
  // Define um campo ou opcao de configuracao.
  descricao: string;
  // Define um campo ou opcao de configuracao.
  observacoes: string;
  // Define um campo ou opcao de configuracao.
  pontosInteresse: POI[];
  // Define um campo ou opcao de configuracao.
  custos: Dia['custos'];
}

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-viagem-detalhe',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: 'viagem-detalhe.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['viagem-detalhe.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class ViagemDetalhePage implements OnInit, OnDestroy {
  // Atribui um valor a esta propriedade.
  viagemId = '';
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  dias: DiaViewModel[] = [];
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  guardando = false;
  // Atribui um valor a esta propriedade.
  eliminando = false;
  // Atribui um valor a esta propriedade.
  publicando = false;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Define um campo ou opcao de configuracao.
  fotosPoiAEnviar: Record<string, boolean> = {};
  // Define um campo ou opcao de configuracao.
  localizacaoPoiAObter: Record<string, boolean> = {};
  // Define um campo ou opcao de configuracao.
  diaExpandidoId: string | null = null;

  // Atribui um valor a esta propriedade.
  titulo = '';
  // Atribui um valor a esta propriedade.
  descricao = '';
  // Atribui um valor a esta propriedade.
  local = '';
  // Atribui um valor a esta propriedade.
  dataInicio = '';
  // Atribui um valor a esta propriedade.
  dataFim = '';
  // Define um campo ou opcao de configuracao.
  status: Viagem['status'] = 'planejada';
  // Define um campo ou opcao de configuracao.
  visibilidadePublicacao: VisibilidadePublicacao = 'privada';
  // Atribui um valor a esta propriedade.
  textoPublicacao = '';

  // Define um membro interno desta classe.
  private routeSub: Subscription | null = null;
  // Define um membro interno desta classe.
  private viagemSub: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private tentouObterGpsInicial = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private publicacoesService: PublicacoesService,
    // Define um membro interno desta classe.
    private cameraService: CameraService,
    // Define um membro interno desta classe.
    private firebaseStorageService: FirebaseStorageService,
    // Define um membro interno desta classe.
    private geolocationService: GeolocationService,
    // Define um membro interno desta classe.
    private nominatimService: NominatimService,
    // Define um membro interno desta classe.
    private itinerarioPdfService: ItinerarioPdfService,
    // Define um membro interno desta classe.
    private pdfShareService: PdfShareService,
    // Define um membro interno desta classe.
    private alertCtrl: AlertController,
    // Define um membro interno desta classe.
    private navCtrl: NavController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub = this.route.paramMap.subscribe(params => {
      // Cria uma variavel local para esta operacao.
      const id = params.get('id') || this.obterParametroDaRota('id');
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!id) {
        // Atualiza ou consulta estado da pagina.
        this.erro = 'ID de viagem inválido.';
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Devolve o resultado deste bloco.
        return;
      }

      // Atualiza ou consulta estado da pagina.
      this.viagemId = id;
      // Atualiza ou consulta estado da pagina.
      this.carregarViagem(id);
    });
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.routeSub?.unsubscribe();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar() {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaDia(diaId: string) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId]);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  irParaItinerarioDia(diaId: string) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId, 'itinerario']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  editarViagem() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.podeEditarViagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'editar']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirDiario() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'diario']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirAlbum() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'album']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirColaboradores() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.podeGerirViagem) return;
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'colaboradores']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async publicarViagem() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.publicando || !this.podeGerirViagem) return;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.titulo.trim() || !this.local.trim() || !this.dataInicio || !this.dataFim) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Preencha título, destino e datas antes de publicar.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (new Date(this.dataFim) < new Date(this.dataInicio)) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('A data de fim não pode ser anterior à data de início.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.publicando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const viagemAtualizada: Viagem = {
        // Executa uma instrucao necessaria para este fluxo.
        ...this.viagem,
        // Define um campo ou opcao de configuracao.
        titulo: this.titulo.trim() || this.viagem.titulo,
        // Define um campo ou opcao de configuracao.
        descricao: this.descricao.trim(),
        // Define um campo ou opcao de configuracao.
        local: this.local.trim(),
        // Define um campo ou opcao de configuracao.
        dataInicio: new Date(this.dataInicio),
        // Define um campo ou opcao de configuracao.
        dataFim: new Date(this.dataFim),
        // Define um campo ou opcao de configuracao.
        status: this.status,
        // Define um campo ou opcao de configuracao.
        dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
      };
      // Cria uma variavel local para esta operacao.
      const texto = this.textoPublicacao.trim() || this.descricao.trim();
      // Cria uma variavel local para esta operacao.
      const publicacaoId = await this.publicacoesService.publicarViagem(viagemAtualizada, texto, 'publica');

      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, {
        // Define um campo ou opcao de configuracao.
        publicada: true,
        // Executa uma instrucao necessaria para este fluxo.
        publicacaoId,
        // Define um campo ou opcao de configuracao.
        visibilidadePublicacao: 'publica',
        // Define um campo ou opcao de configuracao.
        textoPublicacao: texto
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Viagem publicada no feed público.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao publicar viagem:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao publicar viagem.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.publicando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async removerDoFeed() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.publicando || !this.podeGerirViagem) return;

    // Atualiza ou consulta estado da pagina.
    this.publicando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const texto = this.textoPublicacao.trim() || this.descricao.trim();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.publicacoesService.despublicarViagem(this.viagem.id);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, {
        // Define um campo ou opcao de configuracao.
        publicada: false,
        // Define um campo ou opcao de configuracao.
        publicacaoId: null as any,
        // Define um campo ou opcao de configuracao.
        visibilidadePublicacao: 'privada',
        // Define um campo ou opcao de configuracao.
        textoPublicacao: texto
      });

      // Atualiza ou consulta estado da pagina.
      this.visibilidadePublicacao = 'privada';
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Viagem removida do feed.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao remover viagem do feed:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao remover viagem do feed.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.publicando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async confirmarEliminarViagem() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.eliminando || !this.podeGerirViagem) return;

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar viagem',
      // Define um campo ou opcao de configuracao.
      message: `Tem a certeza que pretende eliminar "${this.titulo || this.viagem.titulo}"? Esta ação não pode ser anulada.`,
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
          handler: () => {
            // Atualiza ou consulta estado da pagina.
            this.eliminarViagem();
          }
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarDia() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem || this.guardando) return;

    // Cria uma variavel local para esta operacao.
    const ultimaData = this.dias.length > 0
      // Executa uma instrucao necessaria para este fluxo.
      ? this.dias[this.dias.length - 1].data
      // Executa uma instrucao necessaria para este fluxo.
      : this.dataInicio;
    // Cria uma variavel local para esta operacao.
    const novaData = this.adicionarUmDia(ultimaData || this.dataInicio);
    // Cria uma variavel local para esta operacao.
    const numeroDia = this.dias.length + 1;

    // Cria uma variavel local para esta operacao.
    const novoDia: DiaViewModel = {
      // Define um campo ou opcao de configuracao.
      id: `dia-${novaData || Date.now()}`,
      // Define um campo ou opcao de configuracao.
      titulo: `Dia ${numeroDia}`,
      // Define um campo ou opcao de configuracao.
      data: novaData,
      // Define um campo ou opcao de configuracao.
      local: '',
      // Define um campo ou opcao de configuracao.
      descricao: '',
      // Define um campo ou opcao de configuracao.
      observacoes: '',
      // Define um campo ou opcao de configuracao.
      pontosInteresse: [],
      // Define um campo ou opcao de configuracao.
      custos: []
    };

    // Atualiza ou consulta estado da pagina.
    this.dias.push(novoDia);
    // Atualiza ou consulta estado da pagina.
    this.diaExpandidoId = novoDia.id;

    // Atualiza ou consulta estado da pagina.
    this.guardando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.persistirDias();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Dia adicionado à viagem.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Atualiza ou consulta estado da pagina.
      this.dias = this.dias.filter(dia => dia.id !== novoDia.id);
      // Atualiza ou consulta estado da pagina.
      this.diaExpandidoId = null;
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao adicionar dia:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao adicionar dia.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.guardando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async removerDia(index: number) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem || this.guardando) return;

    // Cria uma variavel local para esta operacao.
    const diaRemovido = this.dias[index];
    // Cria uma variavel local para esta operacao.
    const diasAntes = [...this.dias];
    // Cria uma variavel local para esta operacao.
    const diaExpandidoAntes = this.diaExpandidoId;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!diaRemovido) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.dias.splice(index, 1);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (diaRemovido?.id === this.diaExpandidoId) {
      // Atualiza ou consulta estado da pagina.
      this.diaExpandidoId = null;
    }

    // Atualiza ou consulta estado da pagina.
    this.guardando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.persistirDias();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Dia removido da viagem.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Atualiza ou consulta estado da pagina.
      this.dias = diasAntes;
      // Atualiza ou consulta estado da pagina.
      this.diaExpandidoId = diaExpandidoAntes;
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao remover dia:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao remover dia.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.guardando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async confirmarRemoverDia(index: number) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const dia = this.dias[index];
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar dia',
      // Define um campo ou opcao de configuracao.
      message: `Tem a certeza que pretende eliminar "${dia.titulo || `Dia ${index + 1}`}"? Os POIs deste dia também serão removidos.`,
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
          handler: () => this.removerDia(index)
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  alternarDiaExpandido(diaId: string) {
    // Atualiza ou consulta estado da pagina.
    this.diaExpandidoId = this.diaExpandidoId === diaId ? null : diaId;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  diaEstaExpandido(dia: DiaViewModel): boolean {
    // Devolve o resultado deste bloco.
    return this.diaExpandidoId === dia.id;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  trackByDiaId(_index: number, dia: DiaViewModel): string {
    // Devolve o resultado deste bloco.
    return dia.id;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCustoDia(dia: DiaViewModel): number {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia.pontosInteresse) {
      // Devolve o resultado deste bloco.
      return 0;
    }
    // Devolve o resultado deste bloco.
    return dia.pontosInteresse.reduce((total, poi) => total + (poi.custo || 0), 0);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async guardar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.podeEditarViagem) return;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.titulo.trim() || !this.local.trim() || !this.dataInicio || !this.dataFim) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Preencha título, destino e datas da viagem.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (new Date(this.dataFim) < new Date(this.dataInicio)) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('A data de fim não pode ser anterior à data de início.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.guardando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, {
        // Define um campo ou opcao de configuracao.
        titulo: this.titulo.trim(),
        // Define um campo ou opcao de configuracao.
        descricao: this.descricao.trim(),
        // Define um campo ou opcao de configuracao.
        local: this.local.trim(),
        // Define um campo ou opcao de configuracao.
        dataInicio: new Date(this.dataInicio),
        // Define um campo ou opcao de configuracao.
        dataFim: new Date(this.dataFim),
        // Define um campo ou opcao de configuracao.
        status: this.status,
        // Define um campo ou opcao de configuracao.
        dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Viagem guardada com sucesso.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao guardar detalhes:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao guardar .', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.guardando = false;
    }
  }

  // Define um membro interno desta classe.
  private async eliminarViagem() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;

    // Atualiza ou consulta estado da pagina.
    this.eliminando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.deleteViagem(this.viagem.id);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Viagem eliminada com sucesso.', 'success');
      // Atualiza ou consulta estado da pagina.
      this.navCtrl.navigateRoot('/tabs/viagens');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao eliminar viagem:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao eliminar viagem.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.eliminando = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarData(data: Date | string | any): string {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterNumDias(dataInicio: Date | string | any, dataFim: Date | string | any): number {
    // Cria uma variavel local para esta operacao.
    const inicio = this.converterParaDate(dataInicio);
    // Cria uma variavel local para esta operacao.
    const fim = this.converterParaDate(dataFim);
    // Cria uma variavel local para esta operacao.
    const differenceMs = fim.getTime() - inicio.getTime();
    // Devolve o resultado deste bloco.
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterCorStatus(status?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (status) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'planejada':
        // Devolve o resultado deste bloco.
        return 'primary';
      // Executa uma instrucao necessaria para este fluxo.
      case 'em-andamento':
        // Devolve o resultado deste bloco.
        return 'warning';
      // Executa uma instrucao necessaria para este fluxo.
      case 'concluida':
        // Devolve o resultado deste bloco.
        return 'success';
      // Executa uma instrucao necessaria para este fluxo.
      case 'cancelada':
        // Devolve o resultado deste bloco.
        return 'danger';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'medium';
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterTextoStatus(status?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    switch (status) {
      // Executa uma instrucao necessaria para este fluxo.
      case 'planejada':
        // Devolve o resultado deste bloco.
        return 'Planeada';
      // Executa uma instrucao necessaria para este fluxo.
      case 'em-andamento':
        // Devolve o resultado deste bloco.
        return 'Em curso';
      // Executa uma instrucao necessaria para este fluxo.
      case 'concluida':
        // Devolve o resultado deste bloco.
        return 'Concluída';
      // Executa uma instrucao necessaria para este fluxo.
      case 'cancelada':
        // Devolve o resultado deste bloco.
        return 'Cancelada';
      // Define um campo ou opcao de configuracao.
      default:
        // Devolve o resultado deste bloco.
        return 'Sem estado';
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterResumoCustos(dia: DiaViewModel): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!dia.custos || dia.custos.length === 0) return 'Sem custos';
    // Cria uma variavel local para esta operacao.
    const total = dia.custos.reduce((soma, custo) => soma + (custo.valor || 0), 0);
    // Devolve o resultado deste bloco.
    return `${total.toFixed(2)} ${dia.custos[0].moeda || 'EUR'}`;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  obterFotoPoi(poi: POI): string {
    // Devolve o resultado deste bloco.
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  fotoPoiAEnviar(diaId: string, poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return !!this.fotosPoiAEnviar[this.obterChaveFotoPoi(diaId, poi)];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  localizacaoPoiAEnviar(diaId: string, poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return !!this.localizacaoPoiAObter[this.obterChaveFotoPoi(diaId, poi)];
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async tirarFotoPoi(dia: DiaViewModel, poi: POI) {
    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.takePicture();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!foto) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Não foi possível capturar a foto.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.guardarFotoPoi(dia, poi, foto);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async escolherFotoPoiDaGaleria(dia: DiaViewModel, poi: POI) {
    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.selectPictureFromGallery();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!foto) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Não foi possível selecionar a foto.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Aguarda a conclusao de uma operacao assincrona.
    await this.guardarFotoPoi(dia, poi, foto);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async usarLocalizacaoAtualNoPoi(dia: DiaViewModel, poi: POI) {
    // Executa uma instrucao necessaria para este fluxo.
    poi.id = poi.id || this.gerarIdPoi();
    // Cria uma variavel local para esta operacao.
    const chave = this.obterChaveFotoPoi(dia.id, poi);
    // Atualiza ou consulta estado da pagina.
    this.localizacaoPoiAObter[chave] = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const position = await this.geolocationService.getCurrentPosition();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!position) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Não foi possível obter a localização.', 'warning');
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      poi.latitude = position.coords.latitude;
      // Executa uma instrucao necessaria para este fluxo.
      poi.longitude = position.coords.longitude;
      // Aguarda a conclusao de uma operacao assincrona.
      await this.aplicarSugestoesNominatimAoPoi(poi);

      // Aguarda a conclusao de uma operacao assincrona.
      await this.persistirDias();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Localização associada ao POI.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao obter localização do POI:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao obter localização.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Executa uma instrucao necessaria para este fluxo.
      delete this.localizacaoPoiAObter[chave];
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  formatarCoordenada(valor?: number): string {
    // Devolve o resultado deste bloco.
    return typeof valor === 'number' ? valor.toFixed(6) : '';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  temCoordenadas(poi: POI): boolean {
    // Devolve o resultado deste bloco.
    return typeof poi.latitude === 'number' && typeof poi.longitude === 'number';
  }

  // Executa uma instrucao necessaria para este fluxo.
  get totalPois(): number {
    // Devolve o resultado deste bloco.
    return this.dias.reduce((total, dia) => total + dia.pontosInteresse.length, 0);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get totalDias(): number {
    // Devolve o resultado deste bloco.
    return this.dias.length;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeGerirViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeGerirViagemAtual(this.viagem);
  }

  // Define um membro interno desta classe.
  private carregarViagem(id: string) {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';
    // Atualiza ou consulta estado da pagina.
    this.viagem = null;
    // Atualiza ou consulta estado da pagina.
    this.dias = [];

    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub = this.viagensService.subscribeToViagemById(
      // Executa uma instrucao necessaria para este fluxo.
      id,
      // Executa uma instrucao necessaria para este fluxo.
      (viagem) => {
        // Atualiza ou consulta estado da pagina.
        this.viagem = viagem ?? null;
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!viagem) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Viagem não encontrada ou não pertence ao utilizador.';
          // Devolve o resultado deste bloco.
          return;
        }

        // Atualiza ou consulta estado da pagina.
        this.preencherFormulario(viagem);
      },
      // Executa uma instrucao necessaria para este fluxo.
      (err) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.erro = err?.message || 'Erro ao carregar viagem.';
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar viagem:', err);
      }
    );
  }

  // Define um membro interno desta classe.
  private async guardarFotoPoi(dia: DiaViewModel, poi: POI, dataUrl: string) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;

    // Executa uma instrucao necessaria para este fluxo.
    poi.id = poi.id || this.gerarIdPoi();
    // Cria uma variavel local para esta operacao.
    const chave = this.obterChaveFotoPoi(dia.id, poi);
    // Atualiza ou consulta estado da pagina.
    this.fotosPoiAEnviar[chave] = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const downloadUrl = await this.firebaseStorageService.uploadPoiPhoto(this.viagem.id, dia.id, poi.id, dataUrl);
      // Executa uma instrucao necessaria para este fluxo.
      poi.fotoUrl = downloadUrl;

      // Aguarda a conclusao de uma operacao assincrona.
      await this.persistirDias();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Foto do POI guardada com sucesso.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao guardar foto do POI:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao guardar foto do POI.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Executa uma instrucao necessaria para este fluxo.
      delete this.fotosPoiAEnviar[chave];
    }
  }

  // Define um membro interno desta classe.
  private async persistirDias() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem) return;

    // Aguarda a conclusao de uma operacao assincrona.
    await this.viagensService.updateViagem(this.viagem.id, {
      // Define um campo ou opcao de configuracao.
      dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
    });
  }

  // Define um membro interno desta classe.
  private async obterCoordenadasGpsAoAbrirFormularioPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.tentouObterGpsInicial || !this.temPoisSemCoordenadas()) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.tentouObterGpsInicial = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const position = await this.geolocationService.getCurrentPosition();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!position) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      let alterouPois = false;

      // Atualiza ou consulta estado da pagina.
      this.dias.forEach(dia => {
        // Executa uma instrucao necessaria para este fluxo.
        dia.pontosInteresse.forEach(poi => {
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (!this.temCoordenadas(poi)) {
            // Executa uma instrucao necessaria para este fluxo.
            poi.latitude = position.coords.latitude;
            // Executa uma instrucao necessaria para este fluxo.
            poi.longitude = position.coords.longitude;
            // Atribui um valor a esta propriedade.
            alterouPois = true;
          }
        });
      });

      // Cria uma variavel local para esta operacao.
      const alterouSugestoes = await this.preencherDadosDosPoisComSugestaoNominatim(
        // Executa uma instrucao necessaria para este fluxo.
        position.coords.latitude,
        // Executa uma instrucao necessaria para este fluxo.
        position.coords.longitude
      );

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (alterouPois || alterouSugestoes) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.persistirDias();
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Não foi possível obter coordenadas GPS ao abrir o formulario de POI:', error);
    }
  }

  // Define um membro interno desta classe.
  private async preencherDadosDosPoisComSugestaoNominatim(latitude: number, longitude: number): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const temPoiSemDados = this.dias.some(dia =>
      // Executa uma instrucao necessaria para este fluxo.
      dia.pontosInteresse.some(poi => !poi.endereco?.trim() || !poi.nome?.trim())
    );

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!temPoiSemDados) {
      // Devolve o resultado deste bloco.
      return false;
    }

    // Cria uma variavel local para esta operacao.
    const sugestoes = await this.obterSugestoesPorReverseGeocoding(latitude, longitude);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!sugestoes) {
      // Devolve o resultado deste bloco.
      return false;
    }

    // Cria uma variavel local para esta operacao.
    let alterouPois = false;

    // Atualiza ou consulta estado da pagina.
    this.dias.forEach(dia => {
      // Executa uma instrucao necessaria para este fluxo.
      dia.pontosInteresse.forEach(poi => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!poi.nome?.trim() && sugestoes.nomeSugerido) {
          // Executa uma instrucao necessaria para este fluxo.
          poi.nome = sugestoes.nomeSugerido;
          // Atribui um valor a esta propriedade.
          alterouPois = true;
        }

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!poi.endereco?.trim() && sugestoes.endereco) {
          // Executa uma instrucao necessaria para este fluxo.
          poi.endereco = sugestoes.endereco;
          // Atribui um valor a esta propriedade.
          alterouPois = true;
        }
      });
    });

    // Devolve o resultado deste bloco.
    return alterouPois;
  }

  // Define um membro interno desta classe.
  private async aplicarSugestoesNominatimAoPoi(poi: POI) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.temCoordenadas(poi)) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const sugestoes = await this.obterSugestoesPorReverseGeocoding(poi.latitude!, poi.longitude!);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!sugestoes) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!poi.nome?.trim() && sugestoes.nomeSugerido) {
      // Executa uma instrucao necessaria para este fluxo.
      poi.nome = sugestoes.nomeSugerido;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!poi.endereco?.trim() && sugestoes.endereco) {
      // Executa uma instrucao necessaria para este fluxo.
      poi.endereco = sugestoes.endereco;
    }
  }

  // Define um membro interno desta classe.
  private async obterSugestoesPorReverseGeocoding(latitude: number, longitude: number) {
    // Inicia um bloco protegido contra erros.
    try {
      // Devolve o resultado deste bloco.
      return await this.nominatimService.obterDetalhesPorCoordenadas(latitude, longitude);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Reverse geocoding Nominatim falhou:', error);
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  // Define um membro interno desta classe.
  private temPoisSemCoordenadas(): boolean {
    // Devolve o resultado deste bloco.
    return this.dias.some(dia =>
      // Executa uma instrucao necessaria para este fluxo.
      dia.pontosInteresse.some(poi => !this.temCoordenadas(poi))
    );
  }

  // Define um membro interno desta classe.
  private preencherFormulario(viagem: Viagem) {
    // Atualiza ou consulta estado da pagina.
    this.titulo = viagem.titulo;
    // Atualiza ou consulta estado da pagina.
    this.descricao = viagem.descricao || '';
    // Atualiza ou consulta estado da pagina.
    this.local = viagem.local || '';
    // Atualiza ou consulta estado da pagina.
    this.dataInicio = this.formatarDataInput(viagem.dataInicio);
    // Atualiza ou consulta estado da pagina.
    this.dataFim = this.formatarDataInput(viagem.dataFim);
    // Atualiza ou consulta estado da pagina.
    this.status = viagem.status || 'planejada';
    // Atualiza ou consulta estado da pagina.
    this.visibilidadePublicacao = viagem.visibilidadePublicacao || (viagem.publicada ? 'publica' : 'privada');
    // Atualiza ou consulta estado da pagina.
    this.textoPublicacao = viagem.textoPublicacao || viagem.descricao || '';
    // Atualiza ou consulta estado da pagina.
    this.dias = (viagem.dias || []).map((dia, index) => ({
      // Define um campo ou opcao de configuracao.
      id: dia.id || `dia-${index + 1}`,
      // Define um campo ou opcao de configuracao.
      titulo: dia.titulo || `Dia ${index + 1}`,
      // Define um campo ou opcao de configuracao.
      data: this.formatarDataInput(dia.data),
      // Define um campo ou opcao de configuracao.
      local: dia.local || '',
      // Define um campo ou opcao de configuracao.
      descricao: dia.descricao || '',
      // Define um campo ou opcao de configuracao.
      observacoes: dia.observacoes || '',
      // Define um campo ou opcao de configuracao.
      pontosInteresse: dia.pontosInteresse || [],
      // Define um campo ou opcao de configuracao.
      custos: dia.custos || []
    }));

    // Atualiza ou consulta estado da pagina.
    this.obterCoordenadasGpsAoAbrirFormularioPoi();
  }

  // Define um membro interno desta classe.
  private converterDiaParaModel(dia: DiaViewModel, index: number): Dia {
    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      id: dia.id || `dia-${index + 1}`,
      // Define um campo ou opcao de configuracao.
      titulo: dia.titulo.trim() || `Dia ${index + 1}`,
      // Define um campo ou opcao de configuracao.
      data: new Date(dia.data || this.dataInicio),
      // Define um campo ou opcao de configuracao.
      local: dia.local.trim(),
      // Define um campo ou opcao de configuracao.
      descricao: dia.descricao.trim(),
      // Define um campo ou opcao de configuracao.
      observacoes: dia.observacoes.trim(),
      // Define um campo ou opcao de configuracao.
      pontosInteresse: dia.pontosInteresse.map(poi => this.converterPoiParaModel(poi)),
      // Define um campo ou opcao de configuracao.
      custos: dia.custos || []
    };
  }

  // Define um membro interno desta classe.
  private converterPoiParaModel(poi: POI): POI {
    // Cria uma variavel local para esta operacao.
    const poiPayload: POI = {
      // Define um campo ou opcao de configuracao.
      id: poi.id,
      // Define um campo ou opcao de configuracao.
      nome: poi.nome || '',
      // Define um campo ou opcao de configuracao.
      descricao: poi.descricao || '',
      // Define um campo ou opcao de configuracao.
      tipo: poi.tipo || '',
      // Define um campo ou opcao de configuracao.
      endereco: poi.endereco || '',
      // Define um campo ou opcao de configuracao.
      telefone: poi.telefone || '',
      // Define um campo ou opcao de configuracao.
      horario: poi.horario || '',
      // Define um campo ou opcao de configuracao.
      url: poi.url || '',
      // Define um campo ou opcao de configuracao.
      fotoUrl: poi.fotoUrl || '',
      // Define um campo ou opcao de configuracao.
      nota: poi.nota || '',
      // Define um campo ou opcao de configuracao.
      categoria: poi.categoria || ''
    };

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof poi.latitude === 'number') {
      // Executa uma instrucao necessaria para este fluxo.
      poiPayload.latitude = poi.latitude;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof poi.longitude === 'number') {
      // Executa uma instrucao necessaria para este fluxo.
      poiPayload.longitude = poi.longitude;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof poi.custo === 'number') {
      // Executa uma instrucao necessaria para este fluxo.
      poiPayload.custo = poi.custo;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof poi.avaliacao === 'number') {
      // Executa uma instrucao necessaria para este fluxo.
      poiPayload.avaliacao = poi.avaliacao;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof poi.ordem === 'number') {
      // Executa uma instrucao necessaria para este fluxo.
      poiPayload.ordem = poi.ordem;
    }

    // Devolve o resultado deste bloco.
    return poiPayload;
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
      // Define um metodo chamado pela pagina ou por outros metodos.
      return (data as any).toDate();
    }
    // Cria uma variavel local para esta operacao.
    const segundos = data?.seconds ?? data?._seconds;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof segundos === 'number') {
      // Devolve o resultado deste bloco.
      return new Date(segundos * 1000);
    }
    // Devolve o resultado deste bloco.
    return new Date(data);
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
  private adicionarUmDia(data: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!data) {
      // Devolve o resultado deste bloco.
      return this.formatarDataInput(new Date());
    }

    // Cria uma variavel local para esta operacao.
    const [ano, mes, dia] = data.split('-').map(Number);
    // Cria uma variavel local para esta operacao.
    const date = Number.isFinite(ano) && Number.isFinite(mes) && Number.isFinite(dia)
      // Executa uma instrucao necessaria para este fluxo.
      ? new Date(ano, mes - 1, dia)
      // Executa uma instrucao necessaria para este fluxo.
      : new Date(data);
    // Executa uma instrucao necessaria para este fluxo.
    date.setDate(date.getDate() + 1);
    // Devolve o resultado deste bloco.
    return this.formatarDataInput(date);
  }

  // Define um membro interno desta classe.
  private obterChaveFotoPoi(diaId: string, poi: POI): string {
    // Devolve o resultado deste bloco.
    return `${diaId}-${poi.id || poi.nome || 'poi'}`;
  }

  // Define um membro interno desta classe.
  private gerarIdPoi(): string {
    // Devolve o resultado deste bloco.
    return `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

  // Define um metodo chamado pela pagina ou por outros metodos.
  async compartilharItinerarioPdf() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.dias || this.dias.length === 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Impossível gerar PDF. Sem dias no itinerário.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const diasCompletas: Dia[] = this.dias.map(dia => ({
        // Define um campo ou opcao de configuracao.
        id: dia.id,
        // Define um campo ou opcao de configuracao.
        titulo: dia.titulo,
        // Define um campo ou opcao de configuracao.
        descricao: dia.descricao,
        // Define um campo ou opcao de configuracao.
        data: this.converterParaDate(dia.data),
        // Define um campo ou opcao de configuracao.
        local: dia.local,
        // Define um campo ou opcao de configuracao.
        pontosInteresse: dia.pontosInteresse || [],
        // Define um campo ou opcao de configuracao.
        custos: dia.custos,
        // Define um campo ou opcao de configuracao.
        observacoes: dia.observacoes
      }));

      // Cria uma variavel local para esta operacao.
      const pdf = this.itinerarioPdfService.criarItinerarioPdf({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        dias: diasCompletas
      });

      // Cria uma variavel local para esta operacao.
      const podeCompartilhar = await this.pdfShareService.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (podeCompartilhar) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.pdfShareService.sharePdf(pdf, {
          // Define um campo ou opcao de configuracao.
          title: `Itinerário - ${this.viagem.titulo}`,
          // Define um campo ou opcao de configuracao.
          text: `Compartilhando o itinerário de "${this.viagem.titulo}"`,
          // Define um campo ou opcao de configuracao.
          dialogTitle: 'Partilhar Itinerário em PDF'
        });
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Itinerário partilhado com sucesso!', 'success');
      // Executa uma instrucao necessaria para este fluxo.
      } else {
        // Se não conseguir compartilhar, faz download
        this.itinerarioPdfService.gerarItinerarioDownload({
          // Define um campo ou opcao de configuracao.
          viagem: this.viagem,
          // Define um campo ou opcao de configuracao.
          dias: diasCompletas
        });
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('PDF transferido para download.', 'success');
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF do itinerário:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Erro ao gerar PDF do itinerário.', 'danger');
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  exportarItinerarioPdf() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.dias || this.dias.length === 0) {
      // Atualiza ou consulta estado da pagina.
      this.mostrarToast('Impossível gerar PDF. Sem dias no itinerário.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const diasCompletas: Dia[] = this.dias.map(dia => ({
        // Define um campo ou opcao de configuracao.
        id: dia.id,
        // Define um campo ou opcao de configuracao.
        titulo: dia.titulo,
        // Define um campo ou opcao de configuracao.
        descricao: dia.descricao,
        // Define um campo ou opcao de configuracao.
        data: this.converterParaDate(dia.data),
        // Define um campo ou opcao de configuracao.
        local: dia.local,
        // Define um campo ou opcao de configuracao.
        pontosInteresse: dia.pontosInteresse || [],
        // Define um campo ou opcao de configuracao.
        custos: dia.custos,
        // Define um campo ou opcao de configuracao.
        observacoes: dia.observacoes
      }));

      // Atualiza ou consulta estado da pagina.
      this.itinerarioPdfService.gerarItinerarioDownload({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        dias: diasCompletas
      });
      // Atualiza ou consulta estado da pagina.
      this.mostrarToast('Itinerário exportado em PDF!', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF do itinerário:', error);
      // Atualiza ou consulta estado da pagina.
      this.mostrarToast('Erro ao gerar PDF do itinerário.', 'danger');
    }
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
