// app/pages/album-viagem/album-viagem.page.ts | Controlador da pagina album viagem, onde ficam os dados, eventos e chamadas aos servicos.
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Camera, MediaResult, MediaType, MediaTypeSelection } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { AlertController, ToastController } from '@ionic/angular';
import { Unsubscribe } from 'firebase/firestore';
import { Dia, FotoAlbumViagem, POI, Viagem } from '../../models/viagem.model';
import { AlbumPdfService } from '../../services/album-pdf.service';
import { PdfShareService } from '../../services/pdf-share.service';
import { PhotoShareService } from '../../services/photo-share.service';
import { ViagensService } from '../../services/viagens.service';

// Contrato de dados usado para tipar objetos desta area.
interface FotoAlbum {
  id: string;
  url: string;
  titulo: string;
  subtitulo: string;
  legenda: string;
  poiNome: string;
  origemLabel: string;
  dataCaptura: Date;
  origem: 'rolo' | 'capa' | 'poi';
  diaId?: string;
  poiId?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface PoiAssociado {
  diaId?: string;
  diaTitulo?: string;
  poiId?: string;
  poiNome?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface PoiOpcao {
  label: string;
  value: string;
  poiId: string;
  poiNome: string;
  diaId?: string;
}

// Contrato de dados usado para tipar objetos desta area.
interface GrupoFotos {
  chave: string;
  titulo: string;
  fotos: FotoAlbum[];
}

@Component({
  selector: 'app-album-viagem',
  standalone: false,
  templateUrl: './album-viagem.page.html',
  styleUrls: ['./album-viagem.page.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AlbumViagemPage implements OnInit, OnDestroy {
  viagemId = '';
  viagem: Viagem | null = null;
  fotos: FotoAlbum[] = [];
  fotosVisiveis: FotoAlbum[] = [];
  gruposFotos: GrupoFotos[] = [];
  modoSelecao = false;
  fotosSelecionadas = new Set<string>();
  carregando = true;
  importando = false;
  gerandoPdf = false;
  partilhandoPdf = false;
  erro = '';
  fotosIgnoradasPorTamanho = 0;
  fotoAberta: FotoAlbum | null = null;

  private viagemSub: Unsubscribe | null = null;
  private quantidadeVisivel = 12;
  private readonly tamanhoLote = 12;
  private readonly limiteImportacao = 12;
  private readonly tamanhoMaximoDataUrl = 2_500_000;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private cdr: ChangeDetectorRef,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private photoShareService: PhotoShareService,
    private albumPdfService: AlbumPdfService,
    private pdfShareService: PdfShareService
  ) {}

  ngOnInit() {
    const viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id');

    if (!viagemId) {
      this.erro = 'ID de viagem inválido.';
      this.carregando = false;
      return;
    }

    this.viagemId = viagemId;
    this.carregarViagem(viagemId);
  }

  ngOnDestroy() {
    this.viagemSub?.();
  }

  voltar() {
    if (this.viagemId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
    } else {
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  abrirFoto(foto: FotoAlbum) {
    if (this.modoSelecao) {
      this.alternarSelecaoFoto(foto);
      return;
    }

    this.fotoAberta = foto;
  }

  fecharFoto() {
    this.fotoAberta = null;
  }

  async abrirOrigemFoto(foto: FotoAlbum | null = this.fotoAberta) {
    if (!foto) {
      return;
    }

    this.fecharFoto();
    this.cdr.markForCheck();
    await new Promise(resolve => setTimeout(resolve, 0));

    if (foto.diaId && foto.poiId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', foto.diaId, 'poi', foto.poiId]);
      return;
    }

    if (foto.diaId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', foto.diaId]);
    }
  }

  async partilharFoto(foto: FotoAlbum) {
    try {
      const podePartilhar = await this.photoShareService.canShare();
      if (!podePartilhar) {
        await this.mostrarToast('Partilha de fotos não disponível neste dispositivo.', 'medium');
        return;
      }

      await this.photoShareService.sharePhoto(foto.url, {
        title: foto.titulo || 'Foto de viagem',
        text: this.criarTextoPartilhaFoto(foto),
        dialogTitle: 'Partilhar foto',
        fileNamePrefix: foto.titulo || foto.poiNome || 'foto-viagem'
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('cancel')) {
        return;
      }

      await this.mostrarToast(error?.message || 'Erro ao partilhar foto.', 'danger');
    }
  }

  async compartilharAlbumPdf() {
    if (!this.viagem || this.fotos.length === 0) {
      await this.mostrarToast('Não há fotos no álbum para gerar o PDF.', 'warning');
      return;
    }

    if (this.partilhandoPdf || this.gerandoPdf) {
      return;
    }

    this.partilhandoPdf = true;

    try {
      const pdf = await this.albumPdfService.criarAlbumPdf({
        viagem: this.viagem,
        fotos: this.fotos
      });

      const podeCompartilhar = await this.pdfShareService.canShare();
      if (podeCompartilhar) {
        await this.pdfShareService.sharePdf(pdf, {
          title: `Álbum - ${this.viagem.titulo || 'Viagem'}`,
          text: `Partilhando o álbum de fotos de ${this.viagem.titulo || 'viagem'}.`,
          dialogTitle: 'Partilhar Álbum em PDF'
        });
        await this.mostrarToast('Álbum partilhado em PDF!', 'success');
      } else {
        await this.albumPdfService.gerarAlbumDownload({ viagem: this.viagem, fotos: this.fotos });
        await this.mostrarToast('PDF do álbum transferido para download.', 'success');
      }
    } catch (error: any) {
      console.error('Erro ao gerar PDF do álbum:', error);
      await this.mostrarToast(error?.message || 'Erro ao gerar PDF do álbum.', 'danger');
    } finally {
      this.partilhandoPdf = false;
    }
  }

  async exportarAlbumPdf() {
    if (!this.viagem || this.fotos.length === 0) {
      await this.mostrarToast('Não há fotos no álbum para gerar o PDF.', 'warning');
      return;
    }

    if (this.gerandoPdf || this.partilhandoPdf) {
      return;
    }

    this.gerandoPdf = true;

    try {
      await this.albumPdfService.gerarAlbumDownload({ viagem: this.viagem, fotos: this.fotos });
      await this.mostrarToast('PDF do álbum exportado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao exportar PDF do álbum:', error);
      await this.mostrarToast(error?.message || 'Erro ao exportar PDF do álbum.', 'danger');
    } finally {
      this.gerandoPdf = false;
    }
  }

  ativarSelecao() {
    this.modoSelecao = true;
  }

  cancelarSelecao() {
    this.modoSelecao = false;
    this.fotosSelecionadas.clear();
  }

  alternarSelecaoFoto(foto: FotoAlbum) {
    if (this.fotosSelecionadas.has(foto.id)) {
      this.fotosSelecionadas.delete(foto.id);
    } else {
      this.fotosSelecionadas.add(foto.id);
    }

    if (this.fotosSelecionadas.size === 0) {
      this.modoSelecao = false;
    }
  }

  selecionarTodas() {
    this.modoSelecao = true;
    this.fotosSelecionadas = new Set(this.fotos.map(foto => foto.id));
  }

  limparSelecao() {
    this.fotosSelecionadas.clear();
  }

  fotoEstaSelecionada(foto: FotoAlbum): boolean {
    return this.fotosSelecionadas.has(foto.id);
  }

  get totalSelecionadas(): number {
    return this.fotosSelecionadas.size;
  }

  get totalFotosEditaveisSelecionadas(): number {
    return this.obterFotosEditaveisSelecionadas().length;
  }

  get temMaisFotos(): boolean {
    return this.fotosVisiveis.length < this.fotos.length;
  }

  get podeEditarViagem(): boolean {
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  carregarMaisFotos() {
    this.quantidadeVisivel = Math.min(this.quantidadeVisivel + this.tamanhoLote, this.fotos.length);
    this.atualizarFotosVisiveis();
    this.cdr.markForCheck();
  }

  async importarFotosDoRolo() {
    if (!this.viagem || this.importando || !this.podeEditarViagem) return;

    this.importando = true;
    this.cdr.markForCheck();

    try {
      const permissaoOk = await this.garantirPermissaoGaleria();
      if (!permissaoOk) {
        return;
      }

      const resultado = await Camera.chooseFromGallery({
        mediaType: MediaTypeSelection.Photo,
        allowMultipleSelection: true,
        includeMetadata: true,
        limit: this.limiteImportacao,
        quality: 72
      });

      const novasFotos = resultado.results
        .filter(media => media.type === MediaType.Photo)
        .map((media, index) => this.converterMediaParaFotoAlbum(media, index))
        .filter((foto): foto is FotoAlbumViagem => Boolean(foto));

      if (novasFotos.length === 0) {
        return;
      }

      const fotosAlbum = [
        ...(this.viagem.fotosAlbum || []),
        ...novasFotos
      ];

      await this.viagensService.updateViagem(this.viagem.id, { fotosAlbum });
    } catch (error: any) {
      console.warn('Importação de fotos cancelada ou falhou:', error);
    } finally {
      this.importando = false;
      this.cdr.markForCheck();
    }
  }

  async confirmarEliminarFotosSelecionadas() {
    if (!this.podeEditarViagem) return;

    const fotosEditaveis = this.obterFotosEditaveisSelecionadas();

    if (!this.viagem || fotosEditaveis.length === 0) {
      await this.mostrarToast('Selecione fotos importadas para o álbum.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar fotos',
      message: `Eliminar ${fotosEditaveis.length} foto(s) do álbum? Esta ação não pode ser anulada.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarFotosSelecionadas(fotosEditaveis);
          }
        }
      ]
    });

    await alert.present();
  }

  async reatribuirFotosSelecionadas() {
    if (!this.podeEditarViagem) return;

    const fotosEditaveis = this.obterFotosEditaveisSelecionadas();

    if (!this.viagem || fotosEditaveis.length === 0) {
      await this.mostrarToast('Selecione fotos importadas para o álbum.', 'warning');
      return;
    }

    const pois = this.obterOpcoesPoi(this.viagem);
    if (pois.length === 0) {
      await this.mostrarToast('Esta viagem ainda não tem POIs para associar.', 'warning');
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Reatribuir a POI',
      message: `${fotosEditaveis.length} foto(s) selecionada(s)`,
      inputs: [
        {
          type: 'radio',
          label: 'Sem POI associado',
          value: '',
          checked: false
        },
        ...pois.map((poi, index) => ({
          type: 'radio' as const,
          label: poi.label,
          value: poi.value,
          checked: index === 0
        }))
      ],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Guardar',
          handler: (value?: string) => {
            this.guardarReatribuicaoFotos(fotosEditaveis, pois.find(poi => poi.value === value));
          }
        }
      ]
    });

    await alert.present();
  }

  trackByFotoId(index: number, foto: FotoAlbum): string {
    return foto.id || String(index);
  }

  fotoPodeEditar(foto: FotoAlbum): boolean {
    return foto.origem === 'rolo';
  }

  private carregarViagem(viagemId: string) {
    this.carregando = true;
    this.erro = '';

    this.viagemSub?.();
    this.viagemSub = this.viagensService.subscribeToViagemById(
      viagemId,
      (viagem) => {
        this.carregando = false;
        this.viagem = viagem;

        if (!viagem) {
          this.erro = 'Viagem não encontrada.';
          this.atualizarFotos([]);
          return;
        }

        this.atualizarFotos(this.criarFotosAlbum(viagem));
        this.removerSelecoesInexistentes();
        this.cdr.markForCheck();
      },
      (error) => {
        this.carregando = false;
        this.erro = error?.message || 'Erro ao carregar álbum.';
        console.error('Erro ao carregar álbum:', error);
        this.cdr.markForCheck();
      }
    );
  }

  private removerSelecoesInexistentes() {
    const idsExistentes = new Set(this.fotos.map(foto => foto.id));

    Array.from(this.fotosSelecionadas).forEach(id => {
      if (!idsExistentes.has(id)) {
        this.fotosSelecionadas.delete(id);
      }
    });

    if (this.fotosSelecionadas.size === 0) {
      this.modoSelecao = false;
    }
  }

  private obterFotosEditaveisSelecionadas(): FotoAlbum[] {
    return this.fotos.filter(foto => this.fotosSelecionadas.has(foto.id) && this.fotoPodeEditar(foto));
  }

  private criarTextoPartilhaFoto(foto: FotoAlbum): string {
    const linhas = [
      foto.titulo,
      foto.legenda,
      foto.poiId ? `Local: ${foto.poiNome}` : '',
      foto.subtitulo,
      this.viagem?.titulo ? `Viagem: ${this.viagem.titulo}` : '',
      'Partilhado com Passear Contigo'
    ];

    return linhas.filter(Boolean).join('\n');
  }

  private async eliminarFotosSelecionadas(fotos: FotoAlbum[]) {
    if (!this.viagem || !this.podeEditarViagem) return;

    try {
      const ids = new Set(fotos.map(foto => foto.id));
      const fotosAlbum = (this.viagem.fotosAlbum || []).filter(foto => !ids.has(foto.id));

      await this.viagensService.updateViagem(this.viagem.id, { fotosAlbum });
      ids.forEach(id => this.fotosSelecionadas.delete(id));
      this.cancelarSelecao();
      await this.mostrarToast('Fotos eliminadas do álbum.', 'success');
    } catch (error: any) {
      console.error('Erro ao eliminar fotos do álbum:', error);
      await this.mostrarToast(error?.message || 'Erro ao eliminar fotos.', 'danger');
    }
  }

  private async guardarReatribuicaoFotos(fotos: FotoAlbum[], poi?: PoiOpcao) {
    if (!this.viagem || !this.podeEditarViagem) return;

    try {
      const ids = new Set(fotos.map(foto => foto.id));
      const fotosAlbum = (this.viagem.fotosAlbum || []).map(foto => {
        if (!ids.has(foto.id)) {
          return foto;
        }

        const fotoAtualizada: FotoAlbumViagem = {
          ...foto,
          poiId: poi?.poiId,
          diaId: poi?.diaId,
          poiNome: poi?.poiNome || ''
        };

        return this.removerUndefined(fotoAtualizada);
      });

      await this.viagensService.updateViagem(this.viagem.id, { fotosAlbum });
      this.cancelarSelecao();
      await this.mostrarToast(poi ? 'Fotos reatribuídas ao POI.' : 'Associação ao POI removida.', 'success');
    } catch (error: any) {
      console.error('Erro ao reatribuir fotos:', error);
      await this.mostrarToast(error?.message || 'Erro ao reatribuir fotos.', 'danger');
    }
  }

  private criarFotosAlbum(viagem: Viagem): FotoAlbum[] {
    const fotos: FotoAlbum[] = [];
    this.fotosIgnoradasPorTamanho = 0;

    if (viagem.fotoCapaUrl) {
      const url = this.normalizarUrlFoto(viagem.fotoCapaUrl);
      if (url) {
        fotos.push({
          id: `capa-${viagem.id}`,
          url,
          titulo: viagem.titulo || 'Foto de capa',
          subtitulo: 'Capa da viagem',
          legenda: viagem.descricao || '',
          poiNome: 'Sem POI associado',
          origemLabel: 'Capa',
          dataCaptura: this.converterParaDateSegura(viagem.dataInicio),
          origem: 'capa'
        });
      }
    }

    (viagem.fotosAlbum || []).forEach((foto, index) => {
      const url = this.normalizarUrlFoto(foto.url);
      if (!url) {
        return;
      }

      const poiAssociado = this.obterPoiAssociado(viagem, foto.poiId, foto.diaId);
      const poiNome = foto.poiNome || poiAssociado.poiNome || 'Sem POI associado';

      fotos.push({
        id: foto.id || `rolo-${index}`,
        url,
        titulo: foto.titulo || 'Foto importada',
        subtitulo: this.formatarData(foto.dataCaptura || new Date()),
        legenda: foto.legenda || '',
        poiNome,
        origemLabel: 'Rolo',
        dataCaptura: this.converterParaDateSegura(foto.dataCaptura || new Date()),
        origem: 'rolo',
        diaId: foto.diaId || poiAssociado.diaId,
        poiId: foto.poiId || poiAssociado.poiId
      });
    });

    (viagem.dias || [])
      .slice()
      .sort((a, b) => this.obterTimestampData(a.data) - this.obterTimestampData(b.data))
      .forEach((dia, diaIndex) => {
        (dia.pontosInteresse || []).forEach((poi, poiIndex) => {
          if (!poi.fotoUrl) {
            return;
          }

          fotos.push(this.criarFotoPoi(dia, diaIndex, poi, poiIndex));
        });
      });

    return fotos;
  }

  private criarFotoPoi(dia: Dia, diaIndex: number, poi: POI, poiIndex: number): FotoAlbum {
    const url = this.normalizarUrlFoto(poi.fotoUrl);

    return {
      id: `${dia.id}-${poi.id || poiIndex}`,
      url: url || 'assets/icon/favicon.png',
      titulo: poi.nome || 'Ponto de interesse',
      subtitulo: `${dia.titulo || `Dia ${diaIndex + 1}`} - ${this.formatarData(dia.data)}`,
      legenda: poi.nota || poi.descricao || '',
      poiNome: poi.nome || 'POI sem nome',
      origemLabel: 'POI',
      dataCaptura: this.converterParaDateSegura(dia.data),
      origem: 'poi',
      diaId: dia.id,
      poiId: poi.id
    };
  }

  private converterMediaParaFotoAlbum(media: MediaResult, index: number): FotoAlbumViagem | null {
    const url = this.obterUrlMedia(media);

    if (!url) {
      return null;
    }

    const dataCaptura = this.obterDataCapturaMedia(media) || new Date();

    return {
      id: `rolo-${Date.now()}-${index}`,
      url,
      titulo: `Foto importada ${index + 1}`,
      legenda: '',
      poiNome: '',
      diaId: '',
      dataCaptura: dataCaptura.toISOString(),
      origem: 'rolo',
      metadados: this.removerUndefined({
        formato: media.metadata?.format,
        resolucao: media.metadata?.resolution,
        tamanho: media.metadata?.size,
        exifDisponivel: Boolean(media.metadata?.exif)
      })
    };
  }

  private obterUrlMedia(media: MediaResult): string | undefined {
    if (media.thumbnail && (!media.webPath || media.webPath.startsWith('blob:'))) {
      return `data:image/${media.metadata?.format || 'jpeg'};base64,${media.thumbnail}`;
    }

    if (media.webPath) {
      return media.webPath;
    }

    if (media.uri) {
      return Capacitor.convertFileSrc(media.uri);
    }

    if (media.thumbnail && media.thumbnail.length <= this.tamanhoMaximoDataUrl) {
      return `data:image/${media.metadata?.format || 'jpeg'};base64,${media.thumbnail}`;
    }

    return undefined;
  }

  private atualizarFotos(fotos: FotoAlbum[]) {
    this.fotos = fotos;
    this.quantidadeVisivel = Math.min(this.tamanhoLote, this.fotos.length);
    this.atualizarFotosVisiveis();
  }

  private atualizarFotosVisiveis() {
    this.fotosVisiveis = this.fotos.slice(0, this.quantidadeVisivel);
    this.gruposFotos = this.criarGruposFotos(this.fotosVisiveis);
  }

  private obterPoiAssociado(viagem: Viagem, poiId?: string, diaId?: string): PoiAssociado {
    if (!poiId) {
      return {};
    }

    const dias = viagem.dias || [];

    for (const dia of dias) {
      if (diaId && dia.id !== diaId) {
        continue;
      }

      const poi = (dia.pontosInteresse || []).find(ponto => ponto.id === poiId);
      if (poi) {
        return {
          diaId: dia.id,
          diaTitulo: dia.titulo,
          poiId: poi.id,
          poiNome: poi.nome
        };
      }
    }

    const poiSolto = (viagem.pontosInteresse || []).find(ponto => ponto.id === poiId);

    return poiSolto
      ? {
          poiId: poiSolto.id,
          poiNome: poiSolto.nome
        }
      : {};
  }

  private obterOpcoesPoi(viagem: Viagem): PoiOpcao[] {
    const opcoes: PoiOpcao[] = [];

    (viagem.dias || []).forEach((dia, diaIndex) => {
      (dia.pontosInteresse || []).forEach((poi) => {
        if (!poi.id) {
          return;
        }

        const diaLabel = dia.titulo || `Dia ${diaIndex + 1}`;
        opcoes.push({
          label: `${poi.nome || 'POI sem nome'} - ${diaLabel}`,
          value: `${dia.id}:${poi.id}`,
          poiId: poi.id,
          poiNome: poi.nome || 'POI sem nome',
          diaId: dia.id
        });
      });
    });

    (viagem.pontosInteresse || []).forEach((poi) => {
      if (!poi.id || opcoes.some(opcao => opcao.poiId === poi.id)) {
        return;
      }

      opcoes.push({
        label: poi.nome || 'POI sem nome',
        value: `solto:${poi.id}`,
        poiId: poi.id,
        poiNome: poi.nome || 'POI sem nome'
      });
    });

    return opcoes;
  }

  private criarGruposFotos(fotos: FotoAlbum[]): GrupoFotos[] {
    const grupos = new Map<string, FotoAlbum[]>();

    fotos.forEach(foto => {
      const chave = this.formatarDataChave(foto.dataCaptura);
      const fotosGrupo = grupos.get(chave) || [];
      fotosGrupo.push(foto);
      grupos.set(chave, fotosGrupo);
    });

    return Array.from(grupos.entries())
      .sort(([dataA], [dataB]) => dataB.localeCompare(dataA))
      .map(([chave, fotosGrupo]) => ({
        chave,
        titulo: this.formatarTituloGrupo(chave),
        fotos: fotosGrupo
      }));
  }

  private normalizarUrlFoto(url?: string): string {
    if (!url) {
      return '';
    }

    if (url.startsWith('data:image') && url.length > this.tamanhoMaximoDataUrl) {
      this.fotosIgnoradasPorTamanho += 1;
      return '';
    }

    return url;
  }

  private obterDataCapturaMedia(media: MediaResult): Date | null {
    const dataExif = this.extrairDataExif(media.metadata?.exif);
    if (dataExif) {
      return dataExif;
    }

    if (media.metadata?.creationDate) {
      const dataCriacao = new Date(media.metadata.creationDate);
      if (!Number.isNaN(dataCriacao.getTime())) {
        return dataCriacao;
      }
    }

    return null;
  }

  private extrairDataExif(exif?: string): Date | null {
    if (!exif) {
      return null;
    }

    try {
      const dados = typeof exif === 'string' ? JSON.parse(exif) : exif;
      const valor = dados.DateTimeOriginal
        || dados.DateTime
        || dados.DateTimeDigitized
        || dados.DateTimeCreated
        || dados['DateTime Original'];

      return this.converterDataExif(valor);
    } catch {
      return this.converterDataExif(exif);
    }
  }

  private converterDataExif(valor: any): Date | null {
    if (!valor) {
      return null;
    }

    if (typeof valor !== 'string') {
      return null;
    }

    const normalizada = valor.trim().replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3');
    const data = new Date(normalizada);

    return Number.isNaN(data.getTime()) ? null : data;
  }

  private formatarDataChave(data: Date): string {
    return this.converterParaDateSegura(data).toISOString().slice(0, 10);
  }

  private formatarTituloGrupo(chave: string): string {
    return new Date(`${chave}T00:00:00`).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }

  private formatarData(data: Date | string | any): string {
    return this.converterParaDateSegura(data).toLocaleDateString('pt-PT');
  }

  private converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }

    if (data && typeof data === 'object' && 'toDate' in data) {
      return data.toDate();
    }

    return new Date(data);
  }

  private converterParaDateSegura(data: Date | string | any): Date {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  }

  private obterTimestampData(data: Date | string | any): number {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
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

  private async garantirPermissaoGaleria(): Promise<boolean> {
    const permissions = await Camera.checkPermissions();

    if (permissions.photos === 'granted' || permissions.photos === 'limited') {
      return true;
    }

    const requested = await Camera.requestPermissions({ permissions: ['photos'] });
    return requested.photos === 'granted' || requested.photos === 'limited';
  }

  private removerUndefined<T extends Record<string, any>>(objeto: T): T {
    return Object.entries(objeto).reduce((acc, [chave, valor]) => {
      if (valor !== undefined) {
        (acc as any)[chave] = valor;
      }

      return acc;
    }, {} as T);
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger' | 'medium' = 'medium') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'bottom'
    });

    await toast.present();
  }
}
