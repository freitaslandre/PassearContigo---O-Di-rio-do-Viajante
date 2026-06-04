// app/pages/album-viagem/album-viagem.page.ts | Controlador da pagina album viagem, onde ficam os dados, eventos e chamadas aos servicos.
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { Camera, MediaResult, MediaType, MediaTypeSelection } from '@capacitor/camera';
// Importa dependencias usadas neste ficheiro.
import { Capacitor } from '@capacitor/core';
// Importa dependencias usadas neste ficheiro.
import { AlertController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { Unsubscribe } from 'firebase/firestore';
// Importa dependencias usadas neste ficheiro.
import { Dia, FotoAlbumViagem, POI, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { AlbumPdfService } from '../../services/album-pdf.service';
// Importa dependencias usadas neste ficheiro.
import { PdfShareService } from '../../services/pdf-share.service';
// Importa dependencias usadas neste ficheiro.
import { PhotoShareService } from '../../services/photo-share.service';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';

// Contrato de dados usado para tipar objetos desta area.
interface FotoAlbum {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  url: string;
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Define um campo ou opcao de configuracao.
  subtitulo: string;
  // Define um campo ou opcao de configuracao.
  legenda: string;
  // Define um campo ou opcao de configuracao.
  poiNome: string;
  // Define um campo ou opcao de configuracao.
  origemLabel: string;
  // Define um campo ou opcao de configuracao.
  dataCaptura: Date;
  // Define um campo ou opcao de configuracao.
  origem: 'rolo' | 'capa' | 'poi';
  // Executa uma instrucao necessaria para este fluxo.
  diaId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiId?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface PoiAssociado {
  // Executa uma instrucao necessaria para este fluxo.
  diaId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  diaTitulo?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiId?: string;
  // Executa uma instrucao necessaria para este fluxo.
  poiNome?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface PoiOpcao {
  // Define um campo ou opcao de configuracao.
  label: string;
  // Define um campo ou opcao de configuracao.
  value: string;
  // Define um campo ou opcao de configuracao.
  poiId: string;
  // Define um campo ou opcao de configuracao.
  poiNome: string;
  // Executa uma instrucao necessaria para este fluxo.
  diaId?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface GrupoFotos {
  // Define um campo ou opcao de configuracao.
  chave: string;
  // Define um campo ou opcao de configuracao.
  titulo: string;
  // Define um campo ou opcao de configuracao.
  fotos: FotoAlbum[];
}

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-album-viagem',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './album-viagem.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./album-viagem.page.scss'],
  // Define um campo ou opcao de configuracao.
  changeDetection: ChangeDetectionStrategy.OnPush
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AlbumViagemPage implements OnInit, OnDestroy {
  // Atribui um valor a esta propriedade.
  viagemId = '';
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  fotos: FotoAlbum[] = [];
  // Define um campo ou opcao de configuracao.
  fotosVisiveis: FotoAlbum[] = [];
  // Define um campo ou opcao de configuracao.
  gruposFotos: GrupoFotos[] = [];
  // Atribui um valor a esta propriedade.
  modoSelecao = false;
  // Atribui um valor a esta propriedade.
  fotosSelecionadas = new Set<string>();
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  importando = false;
  // Atribui um valor a esta propriedade.
  gerandoPdf = false;
  // Atribui um valor a esta propriedade.
  partilhandoPdf = false;
  // Atribui um valor a esta propriedade.
  erro = '';
  // Atribui um valor a esta propriedade.
  fotosIgnoradasPorTamanho = 0;
  // Define um campo ou opcao de configuracao.
  fotoAberta: FotoAlbum | null = null;

  // Define um membro interno desta classe.
  private viagemSub: Unsubscribe | null = null;
  // Define um membro interno desta classe.
  private quantidadeVisivel = 12;
  // Define um membro interno desta classe.
  private readonly tamanhoLote = 12;
  // Define um membro interno desta classe.
  private readonly limiteImportacao = 12;
  // Define um membro interno desta classe.
  private readonly tamanhoMaximoDataUrl = 2_500_000;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService,
    // Define um membro interno desta classe.
    private cdr: ChangeDetectorRef,
    // Define um membro interno desta classe.
    private alertCtrl: AlertController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController,
    // Define um membro interno desta classe.
    private photoShareService: PhotoShareService,
    // Define um membro interno desta classe.
    private albumPdfService: AlbumPdfService,
    // Define um membro interno desta classe.
    private pdfShareService: PdfShareService
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Cria uma variavel local para esta operacao.
    const viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id');

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.erro = 'ID de viagem inválido.';
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.viagemId = viagemId;
    // Atualiza ou consulta estado da pagina.
    this.carregarViagem(viagemId);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  abrirFoto(foto: FotoAlbum) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.modoSelecao) {
      // Atualiza ou consulta estado da pagina.
      this.alternarSelecaoFoto(foto);
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.fotoAberta = foto;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  fecharFoto() {
    // Atualiza ou consulta estado da pagina.
    this.fotoAberta = null;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async abrirOrigemFoto(foto: FotoAlbum | null = this.fotoAberta) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!foto) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.fecharFoto();
    // Atualiza ou consulta estado da pagina.
    this.cdr.markForCheck();
    // Aguarda a conclusao de uma operacao assincrona.
    await new Promise(resolve => setTimeout(resolve, 0));

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto.diaId && foto.poiId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', foto.diaId, 'poi', foto.poiId]);
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto.diaId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', foto.diaId]);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async partilharFoto(foto: FotoAlbum) {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const podePartilhar = await this.photoShareService.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!podePartilhar) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Partilha de fotos não disponível neste dispositivo.', 'medium');
        // Devolve o resultado deste bloco.
        return;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.photoShareService.sharePhoto(foto.url, {
        // Define um campo ou opcao de configuracao.
        title: foto.titulo || 'Foto de viagem',
        // Define um campo ou opcao de configuracao.
        text: this.criarTextoPartilhaFoto(foto),
        // Define um campo ou opcao de configuracao.
        dialogTitle: 'Partilhar foto',
        // Define um campo ou opcao de configuracao.
        fileNamePrefix: foto.titulo || foto.poiNome || 'foto-viagem'
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (error?.message?.toLowerCase().includes('cancel')) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao partilhar foto.', 'danger');
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async compartilharAlbumPdf() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.fotos.length === 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Não há fotos no álbum para gerar o PDF.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.partilhandoPdf || this.gerandoPdf) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.partilhandoPdf = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const pdf = await this.albumPdfService.criarAlbumPdf({
        // Define um campo ou opcao de configuracao.
        viagem: this.viagem,
        // Define um campo ou opcao de configuracao.
        fotos: this.fotos
      });

      // Cria uma variavel local para esta operacao.
      const podeCompartilhar = await this.pdfShareService.canShare();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (podeCompartilhar) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.pdfShareService.sharePdf(pdf, {
          // Define um campo ou opcao de configuracao.
          title: `Álbum - ${this.viagem.titulo || 'Viagem'}`,
          // Define um campo ou opcao de configuracao.
          text: `Partilhando o álbum de fotos de ${this.viagem.titulo || 'viagem'}.`,
          // Define um campo ou opcao de configuracao.
          dialogTitle: 'Partilhar Álbum em PDF'
        });
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Álbum partilhado em PDF!', 'success');
      // Executa uma instrucao necessaria para este fluxo.
      } else {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.albumPdfService.gerarAlbumDownload({ viagem: this.viagem, fotos: this.fotos });
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('PDF do álbum transferido para download.', 'success');
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao gerar PDF do álbum:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao gerar PDF do álbum.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.partilhandoPdf = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async exportarAlbumPdf() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.fotos.length === 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Não há fotos no álbum para gerar o PDF.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.gerandoPdf || this.partilhandoPdf) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.gerandoPdf = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.albumPdfService.gerarAlbumDownload({ viagem: this.viagem, fotos: this.fotos });
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('PDF do álbum exportado com sucesso!', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao exportar PDF do álbum:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao exportar PDF do álbum.', 'danger');
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.gerandoPdf = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ativarSelecao() {
    // Atualiza ou consulta estado da pagina.
    this.modoSelecao = true;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  cancelarSelecao() {
    // Atualiza ou consulta estado da pagina.
    this.modoSelecao = false;
    // Atualiza ou consulta estado da pagina.
    this.fotosSelecionadas.clear();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  alternarSelecaoFoto(foto: FotoAlbum) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.fotosSelecionadas.has(foto.id)) {
      // Atualiza ou consulta estado da pagina.
      this.fotosSelecionadas.delete(foto.id);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.fotosSelecionadas.add(foto.id);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.fotosSelecionadas.size === 0) {
      // Atualiza ou consulta estado da pagina.
      this.modoSelecao = false;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  selecionarTodas() {
    // Atualiza ou consulta estado da pagina.
    this.modoSelecao = true;
    // Atualiza ou consulta estado da pagina.
    this.fotosSelecionadas = new Set(this.fotos.map(foto => foto.id));
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  limparSelecao() {
    // Atualiza ou consulta estado da pagina.
    this.fotosSelecionadas.clear();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  fotoEstaSelecionada(foto: FotoAlbum): boolean {
    // Devolve o resultado deste bloco.
    return this.fotosSelecionadas.has(foto.id);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get totalSelecionadas(): number {
    // Devolve o resultado deste bloco.
    return this.fotosSelecionadas.size;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get totalFotosEditaveisSelecionadas(): number {
    // Devolve o resultado deste bloco.
    return this.obterFotosEditaveisSelecionadas().length;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get temMaisFotos(): boolean {
    // Devolve o resultado deste bloco.
    return this.fotosVisiveis.length < this.fotos.length;
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  carregarMaisFotos() {
    // Atualiza ou consulta estado da pagina.
    this.quantidadeVisivel = Math.min(this.quantidadeVisivel + this.tamanhoLote, this.fotos.length);
    // Atualiza ou consulta estado da pagina.
    this.atualizarFotosVisiveis();
    // Atualiza ou consulta estado da pagina.
    this.cdr.markForCheck();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async importarFotosDoRolo() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || this.importando || !this.podeEditarViagem) return;

    // Atualiza ou consulta estado da pagina.
    this.importando = true;
    // Atualiza ou consulta estado da pagina.
    this.cdr.markForCheck();

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const permissaoOk = await this.garantirPermissaoGaleria();
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!permissaoOk) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const resultado = await Camera.chooseFromGallery({
        // Define um campo ou opcao de configuracao.
        mediaType: MediaTypeSelection.Photo,
        // Define um campo ou opcao de configuracao.
        allowMultipleSelection: true,
        // Define um campo ou opcao de configuracao.
        includeMetadata: true,
        // Define um campo ou opcao de configuracao.
        limit: this.limiteImportacao,
        // Define um campo ou opcao de configuracao.
        quality: 72
      });

      // Cria uma variavel local para esta operacao.
      const novasFotos = resultado.results
        // Executa uma instrucao necessaria para este fluxo.
        .filter(media => media.type === MediaType.Photo)
        // Executa uma instrucao necessaria para este fluxo.
        .map((media, index) => this.converterMediaParaFotoAlbum(media, index))
        // Executa uma instrucao necessaria para este fluxo.
        .filter((foto): foto is FotoAlbumViagem => Boolean(foto));

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (novasFotos.length === 0) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const fotosAlbum = [
        // Executa uma instrucao necessaria para este fluxo.
        ...(this.viagem.fotosAlbum || []),
        // Executa uma instrucao necessaria para este fluxo.
        ...novasFotos
      ];

      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, { fotosAlbum });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.warn('Importação de fotos cancelada ou falhou:', error);
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.importando = false;
      // Atualiza ou consulta estado da pagina.
      this.cdr.markForCheck();
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async confirmarEliminarFotosSelecionadas() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const fotosEditaveis = this.obterFotosEditaveisSelecionadas();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || fotosEditaveis.length === 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Selecione fotos importadas para o álbum.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Eliminar fotos',
      // Define um campo ou opcao de configuracao.
      message: `Eliminar ${fotosEditaveis.length} foto(s) do álbum? Esta ação não pode ser anulada.`,
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
            this.eliminarFotosSelecionadas(fotosEditaveis);
          }
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async reatribuirFotosSelecionadas() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) return;

    // Cria uma variavel local para esta operacao.
    const fotosEditaveis = this.obterFotosEditaveisSelecionadas();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || fotosEditaveis.length === 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Selecione fotos importadas para o álbum.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const pois = this.obterOpcoesPoi(this.viagem);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (pois.length === 0) {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Esta viagem ainda não tem POIs para associar.', 'warning');
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertCtrl.create({
      // Define um campo ou opcao de configuracao.
      header: 'Reatribuir a POI',
      // Define um campo ou opcao de configuracao.
      message: `${fotosEditaveis.length} foto(s) selecionada(s)`,
      // Define um campo ou opcao de configuracao.
      inputs: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Declara uma estrutura principal usada pela aplicacao.
          type: 'radio',
          // Define um campo ou opcao de configuracao.
          label: 'Sem POI associado',
          // Define um campo ou opcao de configuracao.
          value: '',
          // Define um campo ou opcao de configuracao.
          checked: false
        },
        // Executa uma instrucao necessaria para este fluxo.
        ...pois.map((poi, index) => ({
          // Declara uma estrutura principal usada pela aplicacao.
          type: 'radio' as const,
          // Define um campo ou opcao de configuracao.
          label: poi.label,
          // Define um campo ou opcao de configuracao.
          value: poi.value,
          // Define um campo ou opcao de configuracao.
          checked: index === 0
        }))
      ],
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
          text: 'Guardar',
          // Define um campo ou opcao de configuracao.
          handler: (value?: string) => {
            // Atualiza ou consulta estado da pagina.
            this.guardarReatribuicaoFotos(fotosEditaveis, pois.find(poi => poi.value === value));
          }
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  trackByFotoId(index: number, foto: FotoAlbum): string {
    // Devolve o resultado deste bloco.
    return foto.id || String(index);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  fotoPodeEditar(foto: FotoAlbum): boolean {
    // Devolve o resultado deste bloco.
    return foto.origem === 'rolo';
  }

  // Define um membro interno desta classe.
  private carregarViagem(viagemId: string) {
    // Atualiza ou consulta estado da pagina.
    this.carregando = true;
    // Atualiza ou consulta estado da pagina.
    this.erro = '';

    // Atualiza ou consulta estado da pagina.
    this.viagemSub?.();
    // Atualiza ou consulta estado da pagina.
    this.viagemSub = this.viagensService.subscribeToViagemById(
      // Executa uma instrucao necessaria para este fluxo.
      viagemId,
      // Executa uma instrucao necessaria para este fluxo.
      (viagem) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.viagem = viagem;

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!viagem) {
          // Atualiza ou consulta estado da pagina.
          this.erro = 'Viagem não encontrada.';
          // Atualiza ou consulta estado da pagina.
          this.atualizarFotos([]);
          // Devolve o resultado deste bloco.
          return;
        }

        // Atualiza ou consulta estado da pagina.
        this.atualizarFotos(this.criarFotosAlbum(viagem));
        // Atualiza ou consulta estado da pagina.
        this.removerSelecoesInexistentes();
        // Atualiza ou consulta estado da pagina.
        this.cdr.markForCheck();
      },
      // Executa uma instrucao necessaria para este fluxo.
      (error) => {
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
        // Atualiza ou consulta estado da pagina.
        this.erro = error?.message || 'Erro ao carregar álbum.';
        // Executa uma instrucao necessaria para este fluxo.
        console.error('Erro ao carregar álbum:', error);
        // Atualiza ou consulta estado da pagina.
        this.cdr.markForCheck();
      }
    );
  }

  // Define um membro interno desta classe.
  private removerSelecoesInexistentes() {
    // Cria uma variavel local para esta operacao.
    const idsExistentes = new Set(this.fotos.map(foto => foto.id));

    // Executa uma instrucao necessaria para este fluxo.
    Array.from(this.fotosSelecionadas).forEach(id => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!idsExistentes.has(id)) {
        // Atualiza ou consulta estado da pagina.
        this.fotosSelecionadas.delete(id);
      }
    });

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.fotosSelecionadas.size === 0) {
      // Atualiza ou consulta estado da pagina.
      this.modoSelecao = false;
    }
  }

  // Define um membro interno desta classe.
  private obterFotosEditaveisSelecionadas(): FotoAlbum[] {
    // Devolve o resultado deste bloco.
    return this.fotos.filter(foto => this.fotosSelecionadas.has(foto.id) && this.fotoPodeEditar(foto));
  }

  // Define um membro interno desta classe.
  private criarTextoPartilhaFoto(foto: FotoAlbum): string {
    // Cria uma variavel local para esta operacao.
    const linhas = [
      // Executa uma instrucao necessaria para este fluxo.
      foto.titulo,
      // Executa uma instrucao necessaria para este fluxo.
      foto.legenda,
      // Executa uma instrucao necessaria para este fluxo.
      foto.poiId ? `Local: ${foto.poiNome}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      foto.subtitulo,
      // Atualiza ou consulta estado da pagina.
      this.viagem?.titulo ? `Viagem: ${this.viagem.titulo}` : '',
      // Executa uma instrucao necessaria para este fluxo.
      'Partilhado com Passear Contigo'
    ];

    // Devolve o resultado deste bloco.
    return linhas.filter(Boolean).join('\n');
  }

  // Define um membro interno desta classe.
  private async eliminarFotosSelecionadas(fotos: FotoAlbum[]) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.podeEditarViagem) return;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const ids = new Set(fotos.map(foto => foto.id));
      // Cria uma variavel local para esta operacao.
      const fotosAlbum = (this.viagem.fotosAlbum || []).filter(foto => !ids.has(foto.id));

      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, { fotosAlbum });
      // Executa uma instrucao necessaria para este fluxo.
      ids.forEach(id => this.fotosSelecionadas.delete(id));
      // Atualiza ou consulta estado da pagina.
      this.cancelarSelecao();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast('Fotos eliminadas do álbum.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao eliminar fotos do álbum:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao eliminar fotos.', 'danger');
    }
  }

  // Define um membro interno desta classe.
  private async guardarReatribuicaoFotos(fotos: FotoAlbum[], poi?: PoiOpcao) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagem || !this.podeEditarViagem) return;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const ids = new Set(fotos.map(foto => foto.id));
      // Cria uma variavel local para esta operacao.
      const fotosAlbum = (this.viagem.fotosAlbum || []).map(foto => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!ids.has(foto.id)) {
          // Devolve o resultado deste bloco.
          return foto;
        }

        // Cria uma variavel local para esta operacao.
        const fotoAtualizada: FotoAlbumViagem = {
          // Executa uma instrucao necessaria para este fluxo.
          ...foto,
          // Define um campo ou opcao de configuracao.
          poiId: poi?.poiId,
          // Define um campo ou opcao de configuracao.
          diaId: poi?.diaId,
          // Define um campo ou opcao de configuracao.
          poiNome: poi?.poiNome || ''
        };

        // Devolve o resultado deste bloco.
        return this.removerUndefined(fotoAtualizada);
      });

      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagem.id, { fotosAlbum });
      // Atualiza ou consulta estado da pagina.
      this.cancelarSelecao();
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(poi ? 'Fotos reatribuídas ao POI.' : 'Associação ao POI removida.', 'success');
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao reatribuir fotos:', error);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.mostrarToast(error?.message || 'Erro ao reatribuir fotos.', 'danger');
    }
  }

  // Define um membro interno desta classe.
  private criarFotosAlbum(viagem: Viagem): FotoAlbum[] {
    // Cria uma variavel local para esta operacao.
    const fotos: FotoAlbum[] = [];
    // Atualiza ou consulta estado da pagina.
    this.fotosIgnoradasPorTamanho = 0;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (viagem.fotoCapaUrl) {
      // Cria uma variavel local para esta operacao.
      const url = this.normalizarUrlFoto(viagem.fotoCapaUrl);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (url) {
        // Executa uma instrucao necessaria para este fluxo.
        fotos.push({
          // Define um campo ou opcao de configuracao.
          id: `capa-${viagem.id}`,
          // Executa uma instrucao necessaria para este fluxo.
          url,
          // Define um campo ou opcao de configuracao.
          titulo: viagem.titulo || 'Foto de capa',
          // Define um campo ou opcao de configuracao.
          subtitulo: 'Capa da viagem',
          // Define um campo ou opcao de configuracao.
          legenda: viagem.descricao || '',
          // Define um campo ou opcao de configuracao.
          poiNome: 'Sem POI associado',
          // Define um campo ou opcao de configuracao.
          origemLabel: 'Capa',
          // Define um campo ou opcao de configuracao.
          dataCaptura: this.converterParaDateSegura(viagem.dataInicio),
          // Define um campo ou opcao de configuracao.
          origem: 'capa'
        });
      }
    }

    // Executa uma instrucao necessaria para este fluxo.
    (viagem.fotosAlbum || []).forEach((foto, index) => {
      // Cria uma variavel local para esta operacao.
      const url = this.normalizarUrlFoto(foto.url);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!url) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const poiAssociado = this.obterPoiAssociado(viagem, foto.poiId, foto.diaId);
      // Cria uma variavel local para esta operacao.
      const poiNome = foto.poiNome || poiAssociado.poiNome || 'Sem POI associado';

      // Executa uma instrucao necessaria para este fluxo.
      fotos.push({
        // Define um campo ou opcao de configuracao.
        id: foto.id || `rolo-${index}`,
        // Executa uma instrucao necessaria para este fluxo.
        url,
        // Define um campo ou opcao de configuracao.
        titulo: foto.titulo || 'Foto importada',
        // Define um campo ou opcao de configuracao.
        subtitulo: this.formatarData(foto.dataCaptura || new Date()),
        // Define um campo ou opcao de configuracao.
        legenda: foto.legenda || '',
        // Executa uma instrucao necessaria para este fluxo.
        poiNome,
        // Define um campo ou opcao de configuracao.
        origemLabel: 'Rolo',
        // Define um campo ou opcao de configuracao.
        dataCaptura: this.converterParaDateSegura(foto.dataCaptura || new Date()),
        // Define um campo ou opcao de configuracao.
        origem: 'rolo',
        // Define um campo ou opcao de configuracao.
        diaId: foto.diaId || poiAssociado.diaId,
        // Define um campo ou opcao de configuracao.
        poiId: foto.poiId || poiAssociado.poiId
      });
    });

    // Executa uma instrucao necessaria para este fluxo.
    (viagem.dias || [])
      // Executa uma instrucao necessaria para este fluxo.
      .slice()
      // Executa uma instrucao necessaria para este fluxo.
      .sort((a, b) => this.obterTimestampData(a.data) - this.obterTimestampData(b.data))
      // Executa uma instrucao necessaria para este fluxo.
      .forEach((dia, diaIndex) => {
        // Executa uma instrucao necessaria para este fluxo.
        (dia.pontosInteresse || []).forEach((poi, poiIndex) => {
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (!poi.fotoUrl) {
            // Devolve o resultado deste bloco.
            return;
          }

          // Executa uma instrucao necessaria para este fluxo.
          fotos.push(this.criarFotoPoi(dia, diaIndex, poi, poiIndex));
        });
      });

    // Devolve o resultado deste bloco.
    return fotos;
  }

  // Define um membro interno desta classe.
  private criarFotoPoi(dia: Dia, diaIndex: number, poi: POI, poiIndex: number): FotoAlbum {
    // Cria uma variavel local para esta operacao.
    const url = this.normalizarUrlFoto(poi.fotoUrl);

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      id: `${dia.id}-${poi.id || poiIndex}`,
      // Define um campo ou opcao de configuracao.
      url: url || 'assets/icon/favicon.png',
      // Define um campo ou opcao de configuracao.
      titulo: poi.nome || 'Ponto de interesse',
      // Define um campo ou opcao de configuracao.
      subtitulo: `${dia.titulo || `Dia ${diaIndex + 1}`} - ${this.formatarData(dia.data)}`,
      // Define um campo ou opcao de configuracao.
      legenda: poi.nota || poi.descricao || '',
      // Define um campo ou opcao de configuracao.
      poiNome: poi.nome || 'POI sem nome',
      // Define um campo ou opcao de configuracao.
      origemLabel: 'POI',
      // Define um campo ou opcao de configuracao.
      dataCaptura: this.converterParaDateSegura(dia.data),
      // Define um campo ou opcao de configuracao.
      origem: 'poi',
      // Define um campo ou opcao de configuracao.
      diaId: dia.id,
      // Define um campo ou opcao de configuracao.
      poiId: poi.id
    };
  }

  // Define um membro interno desta classe.
  private converterMediaParaFotoAlbum(media: MediaResult, index: number): FotoAlbumViagem | null {
    // Cria uma variavel local para esta operacao.
    const url = this.obterUrlMedia(media);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!url) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Cria uma variavel local para esta operacao.
    const dataCaptura = this.obterDataCapturaMedia(media) || new Date();

    // Devolve o resultado deste bloco.
    return {
      // Define um campo ou opcao de configuracao.
      id: `rolo-${Date.now()}-${index}`,
      // Executa uma instrucao necessaria para este fluxo.
      url,
      // Define um campo ou opcao de configuracao.
      titulo: `Foto importada ${index + 1}`,
      // Define um campo ou opcao de configuracao.
      legenda: '',
      // Define um campo ou opcao de configuracao.
      poiNome: '',
      // Define um campo ou opcao de configuracao.
      diaId: '',
      // Define um campo ou opcao de configuracao.
      dataCaptura: dataCaptura.toISOString(),
      // Define um campo ou opcao de configuracao.
      origem: 'rolo',
      // Define um campo ou opcao de configuracao.
      metadados: this.removerUndefined({
        // Define um campo ou opcao de configuracao.
        formato: media.metadata?.format,
        // Define um campo ou opcao de configuracao.
        resolucao: media.metadata?.resolution,
        // Define um campo ou opcao de configuracao.
        tamanho: media.metadata?.size,
        // Define um campo ou opcao de configuracao.
        exifDisponivel: Boolean(media.metadata?.exif)
      })
    };
  }

  // Define um membro interno desta classe.
  private obterUrlMedia(media: MediaResult): string | undefined {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (media.thumbnail && (!media.webPath || media.webPath.startsWith('blob:'))) {
      // Devolve o resultado deste bloco.
      return `data:image/${media.metadata?.format || 'jpeg'};base64,${media.thumbnail}`;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (media.webPath) {
      // Devolve o resultado deste bloco.
      return media.webPath;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (media.uri) {
      // Devolve o resultado deste bloco.
      return Capacitor.convertFileSrc(media.uri);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (media.thumbnail && media.thumbnail.length <= this.tamanhoMaximoDataUrl) {
      // Devolve o resultado deste bloco.
      return `data:image/${media.metadata?.format || 'jpeg'};base64,${media.thumbnail}`;
    }

    // Devolve o resultado deste bloco.
    return undefined;
  }

  // Define um membro interno desta classe.
  private atualizarFotos(fotos: FotoAlbum[]) {
    // Atualiza ou consulta estado da pagina.
    this.fotos = fotos;
    // Atualiza ou consulta estado da pagina.
    this.quantidadeVisivel = Math.min(this.tamanhoLote, this.fotos.length);
    // Atualiza ou consulta estado da pagina.
    this.atualizarFotosVisiveis();
  }

  // Define um membro interno desta classe.
  private atualizarFotosVisiveis() {
    // Atualiza ou consulta estado da pagina.
    this.fotosVisiveis = this.fotos.slice(0, this.quantidadeVisivel);
    // Atualiza ou consulta estado da pagina.
    this.gruposFotos = this.criarGruposFotos(this.fotosVisiveis);
  }

  // Define um membro interno desta classe.
  private obterPoiAssociado(viagem: Viagem, poiId?: string, diaId?: string): PoiAssociado {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!poiId) {
      // Devolve o resultado deste bloco.
      return {};
    }

    // Cria uma variavel local para esta operacao.
    const dias = viagem.dias || [];

    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const dia of dias) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (diaId && dia.id !== diaId) {
        // Executa uma instrucao necessaria para este fluxo.
        continue;
      }

      // Cria uma variavel local para esta operacao.
      const poi = (dia.pontosInteresse || []).find(ponto => ponto.id === poiId);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (poi) {
        // Devolve o resultado deste bloco.
        return {
          // Define um campo ou opcao de configuracao.
          diaId: dia.id,
          // Define um campo ou opcao de configuracao.
          diaTitulo: dia.titulo,
          // Define um campo ou opcao de configuracao.
          poiId: poi.id,
          // Define um campo ou opcao de configuracao.
          poiNome: poi.nome
        };
      }
    }

    // Cria uma variavel local para esta operacao.
    const poiSolto = (viagem.pontosInteresse || []).find(ponto => ponto.id === poiId);

    // Devolve o resultado deste bloco.
    return poiSolto
      // Executa uma instrucao necessaria para este fluxo.
      ? {
          // Define um campo ou opcao de configuracao.
          poiId: poiSolto.id,
          // Define um campo ou opcao de configuracao.
          poiNome: poiSolto.nome
        }
      // Executa uma instrucao necessaria para este fluxo.
      : {};
  }

  // Define um membro interno desta classe.
  private obterOpcoesPoi(viagem: Viagem): PoiOpcao[] {
    // Cria uma variavel local para esta operacao.
    const opcoes: PoiOpcao[] = [];

    // Executa uma instrucao necessaria para este fluxo.
    (viagem.dias || []).forEach((dia, diaIndex) => {
      // Executa uma instrucao necessaria para este fluxo.
      (dia.pontosInteresse || []).forEach((poi) => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!poi.id) {
          // Devolve o resultado deste bloco.
          return;
        }

        // Cria uma variavel local para esta operacao.
        const diaLabel = dia.titulo || `Dia ${diaIndex + 1}`;
        // Executa uma instrucao necessaria para este fluxo.
        opcoes.push({
          // Define um campo ou opcao de configuracao.
          label: `${poi.nome || 'POI sem nome'} - ${diaLabel}`,
          // Define um campo ou opcao de configuracao.
          value: `${dia.id}:${poi.id}`,
          // Define um campo ou opcao de configuracao.
          poiId: poi.id,
          // Define um campo ou opcao de configuracao.
          poiNome: poi.nome || 'POI sem nome',
          // Define um campo ou opcao de configuracao.
          diaId: dia.id
        });
      });
    });

    // Executa uma instrucao necessaria para este fluxo.
    (viagem.pontosInteresse || []).forEach((poi) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!poi.id || opcoes.some(opcao => opcao.poiId === poi.id)) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Executa uma instrucao necessaria para este fluxo.
      opcoes.push({
        // Define um campo ou opcao de configuracao.
        label: poi.nome || 'POI sem nome',
        // Define um campo ou opcao de configuracao.
        value: `solto:${poi.id}`,
        // Define um campo ou opcao de configuracao.
        poiId: poi.id,
        // Define um campo ou opcao de configuracao.
        poiNome: poi.nome || 'POI sem nome'
      });
    });

    // Devolve o resultado deste bloco.
    return opcoes;
  }

  // Define um membro interno desta classe.
  private criarGruposFotos(fotos: FotoAlbum[]): GrupoFotos[] {
    // Cria uma variavel local para esta operacao.
    const grupos = new Map<string, FotoAlbum[]>();

    // Executa uma instrucao necessaria para este fluxo.
    fotos.forEach(foto => {
      // Cria uma variavel local para esta operacao.
      const chave = this.formatarDataChave(foto.dataCaptura);
      // Cria uma variavel local para esta operacao.
      const fotosGrupo = grupos.get(chave) || [];
      // Executa uma instrucao necessaria para este fluxo.
      fotosGrupo.push(foto);
      // Executa uma instrucao necessaria para este fluxo.
      grupos.set(chave, fotosGrupo);
    });

    // Devolve o resultado deste bloco.
    return Array.from(grupos.entries())
      // Executa uma instrucao necessaria para este fluxo.
      .sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
      // Executa uma instrucao necessaria para este fluxo.
      .map(([chave, fotosGrupo]) => ({
        // Executa uma instrucao necessaria para este fluxo.
        chave,
        // Define um campo ou opcao de configuracao.
        titulo: this.formatarTituloGrupo(chave),
        // Define um campo ou opcao de configuracao.
        fotos: fotosGrupo
      }));
  }

  // Define um membro interno desta classe.
  private normalizarUrlFoto(url?: string): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!url) {
      // Devolve o resultado deste bloco.
      return '';
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (url.startsWith('data:image') && url.length > this.tamanhoMaximoDataUrl) {
      // Atualiza ou consulta estado da pagina.
      this.fotosIgnoradasPorTamanho += 1;
      // Devolve o resultado deste bloco.
      return '';
    }

    // Devolve o resultado deste bloco.
    return url;
  }

  // Define um membro interno desta classe.
  private obterDataCapturaMedia(media: MediaResult): Date | null {
    // Cria uma variavel local para esta operacao.
    const dataExif = this.extrairDataExif(media.metadata?.exif);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (dataExif) {
      // Devolve o resultado deste bloco.
      return dataExif;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (media.metadata?.creationDate) {
      // Cria uma variavel local para esta operacao.
      const dataCriacao = new Date(media.metadata.creationDate);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!Number.isNaN(dataCriacao.getTime())) {
        // Devolve o resultado deste bloco.
        return dataCriacao;
      }
    }

    // Devolve o resultado deste bloco.
    return null;
  }

  // Define um membro interno desta classe.
  private extrairDataExif(exif?: string): Date | null {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!exif) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const dados = typeof exif === 'string' ? JSON.parse(exif) : exif;
      // Cria uma variavel local para esta operacao.
      const valor = dados.DateTimeOriginal
        // Executa uma instrucao necessaria para este fluxo.
        || dados.DateTime
        // Executa uma instrucao necessaria para este fluxo.
        || dados.DateTimeDigitized
        // Executa uma instrucao necessaria para este fluxo.
        || dados.DateTimeCreated
        // Executa uma instrucao necessaria para este fluxo.
        || dados['DateTime Original'];

      // Devolve o resultado deste bloco.
      return this.converterDataExif(valor);
    // Executa uma instrucao necessaria para este fluxo.
    } catch {
      // Devolve o resultado deste bloco.
      return this.converterDataExif(exif);
    }
  }

  // Define um membro interno desta classe.
  private converterDataExif(valor: any): Date | null {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!valor) {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (typeof valor !== 'string') {
      // Devolve o resultado deste bloco.
      return null;
    }

    // Cria uma variavel local para esta operacao.
    const normalizada = valor.trim().replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    // Cria uma variavel local para esta operacao.
    const data = new Date(normalizada);

    // Devolve o resultado deste bloco.
    return Number.isNaN(data.getTime()) ? null : data;
  }

  // Define um membro interno desta classe.
  private formatarDataChave(data: Date): string {
    // Devolve o resultado deste bloco.
    return this.converterParaDateSegura(data).toISOString().slice(0, 10);
  }

  // Define um membro interno desta classe.
  private formatarTituloGrupo(chave: string): string {
    // Devolve o resultado deste bloco.
    return new Date(`${chave}T00:00:00`).toLocaleDateString('pt-PT', {
      // Define um campo ou opcao de configuracao.
      day: '2-digit',
      // Define um campo ou opcao de configuracao.
      month: 'long',
      // Define um campo ou opcao de configuracao.
      year: 'numeric'
    });
  }

  // Define um membro interno desta classe.
  private formatarData(data: Date | string | any): string {
    // Devolve o resultado deste bloco.
    return this.converterParaDateSegura(data).toLocaleDateString('pt-PT');
  }

  // Define um membro interno desta classe.
  private converterParaDate(data: Date | string | any): Date {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (data instanceof Date) {
      // Devolve o resultado deste bloco.
      return data;
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
  private converterParaDateSegura(data: Date | string | any): Date {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  // Define um membro interno desta classe.
  private obterTimestampData(data: Date | string | any): number {
    // Cria uma variavel local para esta operacao.
    const date = this.converterParaDate(data);
    // Devolve o resultado deste bloco.
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  // Define um membro interno desta classe.
  private async garantirPermissaoGaleria(): Promise<boolean> {
    // Cria uma variavel local para esta operacao.
    const permissions = await Camera.checkPermissions();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (permissions.photos === 'granted' || permissions.photos === 'limited') {
      // Devolve o resultado deste bloco.
      return true;
    }

    // Cria uma variavel local para esta operacao.
    const requested = await Camera.requestPermissions({ permissions: ['photos'] });
    // Devolve o resultado deste bloco.
    return requested.photos === 'granted' || requested.photos === 'limited';
  }

  // Define um membro interno desta classe.
  private removerUndefined<T extends Record<string, any>>(objeto: T): T {
    // Devolve o resultado deste bloco.
    return Object.entries(objeto).reduce((acc, [chave, valor]) => {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (valor !== undefined) {
        // Executa uma instrucao necessaria para este fluxo.
        (acc as any)[chave] = valor;
      }

      // Devolve o resultado deste bloco.
      return acc;
    // Executa uma instrucao necessaria para este fluxo.
    }, {} as T);
  }

  // Define um membro interno desta classe.
  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Executa uma instrucao necessaria para este fluxo.
      message,
      // Define um campo ou opcao de configuracao.
      duration: 2200,
      // Executa uma instrucao necessaria para este fluxo.
      color,
      // Define um campo ou opcao de configuracao.
      position: 'bottom'
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }
}
