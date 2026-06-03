import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Share } from '@capacitor/share';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ViagensService } from '../../services/viagens.service';
import { POIService } from '../../services/poi.service';
import { MapCacheService } from '../../services/map-cache.service';
import { PhotoShareService } from '../../services/photo-share.service';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { POI, Dia, Viagem } from '../../models/viagem.model';

@Component({
  selector: 'app-detalhe-poi',
  standalone: false,
  templateUrl: './detalhe-poi.page.html',
  styleUrls: ['./detalhe-poi.page.scss']
})
export class DetalhePoiPage implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('mapaPoi') mapaPoi?: ElementRef<HTMLDivElement>;

  poi: POI | null = null;
  viagem: Viagem | null = null;
  diaAtual: Dia | null = null;
  poiEditavel: Omit<Partial<POI>, 'custo'> & { custo?: string | number } = {};
  modoEdicao = false;
  viagemId: string | null = null;
  diaId: string | null = null;
  poiId: string | null = null;
  carregando = true;
  erro = '';
  fotoUrl: string | undefined = undefined;
  @ViewChild('fotoInput') fotoInput?: ElementRef<HTMLInputElement>;

  // Notas
  novaNotaTexto = '';
  notas: { id: string; texto: string; data: Date }[] = [];

  private routeSub: Subscription | null = null;
  private poiSub: Subscription | null = null;
  private mapaLeaflet: any = null;
  private marcadoresLeaflet: any[] = [];
  private rotaLeaflet: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private poiService: POIService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController,
    private mapCacheService: MapCacheService,
    private photoShareService: PhotoShareService,
    private firebaseStorageService: FirebaseStorageService
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.diaId = params.get('diaId');
      this.poiId = params.get('poiId');

      // Tentar obter o ID da viagem dos parents
      let currentRoute = this.route.parent;
      while (currentRoute) {
        const idFromParent = currentRoute.snapshot.paramMap.get('id');
        if (idFromParent) {
          this.viagemId = idFromParent;
          break;
        }
        currentRoute = currentRoute.parent;
      }

      // Se ainda não encontrou, extrair da URL (fallback)
      if (!this.viagemId) {
        const urlParts = this.router.url.split('/');
        const viagensIndex = urlParts.indexOf('viagens');
        if (viagensIndex >= 0 && viagensIndex < urlParts.length - 1) {
          this.viagemId = urlParts[viagensIndex + 1];
        }
      }

      if (!this.viagemId || !this.diaId || !this.poiId) {
        this.erro = 'IDs de viagem, dia ou POI inválidos.';
        this.carregando = false;
        return;
      }

      this.carregarPoi();
    });
  }

  ngAfterViewInit() {
    this.agendarAtualizacaoMapa();
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.poiSub?.unsubscribe();
    this.destruirMapa();
  }

  private carregarPoi() {
    if (!this.viagemId || !this.diaId || !this.poiId) {
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.poi = null;
    this.diaAtual = null;

    this.poiSub?.unsubscribe();
    this.poiSub = this.viagensService.getViagemById(this.viagemId).subscribe({
      next: (viagem) => {
        if (!viagem || !viagem.dias) {
          this.erro = 'Viagem não encontrada.';
          this.carregando = false;
          return;
        }

        const dia = viagem.dias.find(d => d.id === this.diaId);
        if (!dia || !dia.pontosInteresse) {
          this.erro = 'Dia ou POI não encontrado.';
          this.carregando = false;
          return;
        }

        const poiEncontrado = dia.pontosInteresse.find(p => p.id === this.poiId);
        if (!poiEncontrado) {
          this.erro = 'POI não encontrado.';
          this.carregando = false;
          return;
        }

        console.log('POI carregado:', poiEncontrado);
        this.viagem = viagem;
        this.diaAtual = dia;
        this.poi = poiEncontrado;
        this.fotoUrl = this.poi.fotoUrl || undefined;
        this.carregarNotas();
        this.carregando = false;
        this.agendarAtualizacaoMapa();
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err?.message || 'Erro ao carregar POI.';
        console.error('Erro ao carregar POI:', err);
      }
    });
  }

  private carregarNotas() {
    // Para agora, as notas são armazenadas localmente
    // Pode ser expandido para usar Firebase
    const notasStorage = localStorage.getItem(`notas-poi-${this.poiId}`);
    if (notasStorage) {
      this.notas = JSON.parse(notasStorage);
    } else {
      this.notas = [];
    }
  }

  obterColaboradorLabel(poi: POI): string {
    return poi.colaboradorNome?.trim() || poi.colaboradorEmail || (poi.colaboradorUid ? 'Colaborador' : '');
  }

  private guardarNotas() {
    localStorage.setItem(`notas-poi-${this.poiId}`, JSON.stringify(this.notas));
  }

  async adicionarNota() {
    if (!this.novaNotaTexto.trim()) {
      const alert = await this.alertCtrl.create({
        header: 'Nota vazia',
        message: 'Por favor escreva algo na nota.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    const novaNota = {
      id: `nota-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      texto: this.novaNotaTexto.trim(),
      data: new Date()
    };

    this.notas.push(novaNota);
    this.guardarNotas();
    this.novaNotaTexto = '';

    const toast = await this.toastCtrl.create({
      message: 'Nota adicionada com sucesso!',
      duration: 1500,
      color: 'success'
    });
    await toast.present();
  }

  async eliminarNota(notaId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Eliminar nota?',
      message: 'Tem a certeza que quer eliminar esta nota?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            this.notas = this.notas.filter(n => n.id !== notaId);
            this.guardarNotas();
            const toast = await this.toastCtrl.create({
              message: 'Nota eliminada.',
              duration: 1500,
              color: 'warning'
            });
            await toast.present();
          }
        }
      ]
    });
    await alert.present();
  }

  selecionarFoto() {
    if (!this.podeEditarViagem) return;
    this.fotoInput?.nativeElement.click();
  }

  async onFotoSelecionada(event: any) {
    if (!this.podeEditarViagem) return;

    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const dataUrl = String(e.target.result || '');

      if (this.poi && this.viagemId && this.diaId && this.poiId) {
        try {
          const fotoUrl = await this.firebaseStorageService.uploadPoiPhoto(
            this.viagemId,
            this.diaId,
            this.poiId,
            dataUrl
          );

          this.fotoUrl = fotoUrl;

          await this.poiService.atualizarPOI(
            this.viagemId,
            this.diaId,
            this.poiId,
            { fotoUrl }
          );

          const toast = await this.toastCtrl.create({
            message: 'Foto adicionada com sucesso!',
            duration: 1500,
            color: 'success'
          });
          await toast.present();
        } catch (error: any) {
          const toast = await this.toastCtrl.create({
            message: error?.message || 'Erro ao adicionar foto.',
            duration: 2000,
            color: 'danger'
          });
          await toast.present();
        }
      }
    };
    reader.readAsDataURL(file);
  }

  async eliminarFoto() {
    if (!this.podeEditarViagem) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar foto?',
      message: 'Tem a certeza que quer eliminar esta foto?',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          handler: async () => {
            this.fotoUrl = undefined;

            if (this.poi && this.viagemId && this.diaId && this.poiId) {
              try {
                await this.poiService.atualizarPOI(
                  this.viagemId,
                  this.diaId,
                  this.poiId,
                  { fotoUrl: undefined }
                );

                const toast = await this.toastCtrl.create({
                  message: 'Foto eliminada.',
                  duration: 1500,
                  color: 'warning'
                });
                await toast.present();
              } catch (error: any) {
                const toast = await this.toastCtrl.create({
                  message: error?.message || 'Erro ao eliminar foto.',
                  duration: 2000,
                  color: 'danger'
                });
                await toast.present();
              }
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async partilharFotoPoi() {
    if (!this.fotoUrl || !this.poi) {
      return;
    }

    try {
      const podePartilhar = await this.photoShareService.canShare();
      if (!podePartilhar) {
        const toast = await this.toastCtrl.create({
          message: 'Partilha de fotos não disponível neste dispositivo.',
          duration: 2000,
          color: 'medium'
        });
        await toast.present();
        return;
      }

      await this.photoShareService.sharePhoto(this.fotoUrl, {
        title: this.poi.nome || 'Foto do POI',
        text: this.criarTextoPartilhaFotoPoi(),
        dialogTitle: 'Partilhar foto',
        fileNamePrefix: this.poi.nome || 'foto-poi'
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('cancel')) {
        return;
      }

      const toast = await this.toastCtrl.create({
        message: error?.message || 'Erro ao partilhar foto.',
        duration: 2200,
        color: 'danger'
      });
      await toast.present();
    }
  }

  iniciarEdicao() {
    if (!this.poi || !this.podeEditarViagem) return;
    this.poiEditavel = {
      nota: this.poi.nota || '',
      custo: this.poi.custo || undefined,
      avaliacao: this.poi.avaliacao || 0
    };
    this.modoEdicao = true;
  }

  normalizarCustoEditavel(event: CustomEvent<{ value?: string | null }>) {
    this.poiEditavel.custo = this.normalizarDecimal(event.detail?.value);
  }

  async guardarEdicao() {
    if (!this.poi || !this.viagemId || !this.diaId || !this.poiId || !this.podeEditarViagem) {
      return;
    }

    try {
      const poiAtualizado = {
        ...this.poi,
        nota: this.poiEditavel.nota,
        custo: this.poiEditavel.custo ? Number(this.poiEditavel.custo) : undefined,
        avaliacao: this.poiEditavel.avaliacao
      };

      await this.poiService.atualizarPOI(
        this.viagemId,
        this.diaId,
        this.poiId,
        poiAtualizado
      );

      this.poi = poiAtualizado;
      this.modoEdicao = false;

      const toast = await this.toastCtrl.create({
        message: 'POI atualizado com sucesso!',
        duration: 1500,
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.message || 'Erro ao atualizar POI.',
        duration: 2000,
        color: 'danger'
      });
      await toast.present();
    }
  }

  cancelarEdicao() {
    this.modoEdicao = false;
    this.poiEditavel = {};
  }

  private normalizarDecimal(valor: unknown): string {
    const texto = String(valor ?? '').replace(',', '.');
    const limpo = texto.replace(/[^\d.]/g, '');
    const [inteiro, ...partesDecimais] = limpo.split('.');
    const decimal = partesDecimais.join('').slice(0, 2);

    if (partesDecimais.length > 0) {
      return `${inteiro}.${decimal}`;
    }

    return inteiro;
  }

  async eliminarPoi() {
    if (!this.podeEditarViagem) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar POI?',
      message: `Tem a certeza que quer eliminar "${this.poi?.nome}"? Esta ação não pode ser desfeita.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: async () => {
            if (!this.poi || !this.viagemId || !this.diaId || !this.poiId) {
              return;
            }

            try {
              await this.poiService.eliminarPOI(this.viagemId, this.diaId, this.poiId);

              const toast = await this.toastCtrl.create({
                message: 'POI eliminado com sucesso!',
                duration: 1500,
                color: 'success'
              });
              await toast.present();

              // Voltar para o dia após eliminar
              setTimeout(() => {
                this.voltar();
              }, 1500);
            } catch (error: any) {
              const toast = await this.toastCtrl.create({
                message: error?.message || 'Erro ao eliminar POI.',
                duration: 2000,
                color: 'danger'
              });
              await toast.present();
            }
          }
        }
      ]
    });
    await alert.present();
  }

  voltar() {
    if (this.viagemId && this.diaId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
    } else {
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  get temLocalizacao(): boolean {
    return typeof this.poi?.latitude === 'number' && typeof this.poi?.longitude === 'number';
  }

  get podeEditarViagem(): boolean {
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  get poisDoDiaComLocalizacao(): POI[] {
    return (this.diaAtual?.pontosInteresse || []).filter(poi =>
      typeof poi.latitude === 'number' && typeof poi.longitude === 'number'
    );
  }

  get poisDoDiaOrdenadosComLocalizacao(): POI[] {
    return (this.diaAtual?.pontosInteresse || [])
      .map((poi, index) => ({ poi, index }))
      .filter(item =>
        typeof item.poi.latitude === 'number' && typeof item.poi.longitude === 'number'
      )
      .sort((a, b) => {
        const ordemA = typeof a.poi.ordem === 'number' ? a.poi.ordem : a.index;
        const ordemB = typeof b.poi.ordem === 'number' ? b.poi.ordem : b.index;
        return ordemA - ordemB;
      })
      .map(item => item.poi);
  }

  get temPercursoDoDia(): boolean {
    return this.poisDoDiaOrdenadosComLocalizacao.length > 1;
  }

  get temMapaDoDia(): boolean {
    return this.poisDoDiaComLocalizacao.length > 0;
  }

  async partilharPoi() {
    if (!this.poi) {
      return;
    }

    const texto = this.criarTextoPartilhaPoi(this.poi);
    const url = this.obterUrlPartilhaPoi(this.poi);

    try {
      const podePartilhar = await Share.canShare();
      if (!podePartilhar.value) {
        await this.copiarPartilhaPoi(texto, url);
        return;
      }

      await Share.share({
        title: this.poi.nome,
        text: texto,
        url,
        dialogTitle: 'Partilhar POI'
      });
    } catch (error: any) {
      if (error?.message?.toLowerCase().includes('cancel')) {
        return;
      }

      await this.copiarPartilhaPoi(texto, url);
    }
  }

  abrirMapa() {
    if (this.temLocalizacao) {
      const mapsUrl = this.obterUrlMapaPoi(this.poi);
      window.open(mapsUrl, '_blank');
    }
  }

  private criarTextoPartilhaPoi(poi: POI): string {
    const linhas = [
      poi.nome,
      poi.tipo || poi.categoria ? `Tipo: ${poi.tipo || poi.categoria}` : '',
      poi.descricao ? `Descrição: ${poi.descricao}` : '',
      poi.endereco ? `Endereço: ${poi.endereco}` : '',
      poi.horario ? `Horário: ${poi.horario}` : '',
      poi.custo !== undefined && poi.custo !== null ? `Custo: € ${Number(poi.custo).toFixed(2)}` : '',
      poi.avaliacao ? `Avaliação: ${poi.avaliacao}/5` : '',
      poi.nota ? `Nota: ${poi.nota}` : '',
      poi.url ? `Site: ${poi.url}` : '',
      this.temLocalizacao ? `Mapa: ${this.obterUrlMapaPoi(poi)}` : ''
    ];

    return linhas.filter(Boolean).join('\n');
  }

  private criarTextoPartilhaFotoPoi(): string {
    const linhas = [
      this.poi?.nome ? `Foto de ${this.poi.nome}` : 'Foto de viagem',
      this.poi?.endereco ? `Local: ${this.poi.endereco}` : '',
      this.temLocalizacao ? `Mapa: ${this.obterUrlMapaPoi(this.poi)}` : '',
      'Partilhado com Passear Contigo'
    ];

    return linhas.filter(Boolean).join('\n');
  }

  private obterUrlPartilhaPoi(poi: POI): string | undefined {
    if (this.temLocalizacao) {
      return this.obterUrlMapaPoi(poi);
    }

    return poi.url || undefined;
  }

  private obterUrlMapaPoi(poi: POI | null): string {
    return `https://www.openstreetmap.org/?mlat=${poi?.latitude}&mlon=${poi?.longitude}#map=16/${poi?.latitude}/${poi?.longitude}`;
  }

  private async copiarPartilhaPoi(texto: string, url?: string): Promise<void> {
    const textoComLink = url && !texto.includes(url)
      ? `${texto}\n${url}`
      : texto;

    try {
      await this.copiarParaClipboard(textoComLink);

      const toast = await this.toastCtrl.create({
        message: 'Partilha copiada. Pode colar onde quiser.',
        duration: 2200,
        color: 'success'
      });
      await toast.present();
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.message || 'Não foi possível partilhar este POI.',
        duration: 2200,
        color: 'danger'
      });
      await toast.present();
    }
  }

  private async copiarParaClipboard(texto: string): Promise<void> {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(texto);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = texto;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();

    const copiou = document.execCommand('copy');
    document.body.removeChild(textarea);

    if (!copiou) {
      throw new Error('Não foi possível copiar a partilha.');
    }
  }

  private agendarAtualizacaoMapa() {
    setTimeout(() => this.atualizarMapaLeaflet(), 0);
  }

  private atualizarMapaLeaflet() {
    if (!this.temMapaDoDia || !this.mapaPoi?.nativeElement) {
      this.destruirCamadasMapa();
      return;
    }

    const leaflet = (window as any).L;

    if (!leaflet) {
      console.warn('Leaflet não foi carregado pelo CDN.');
      return;
    }

    const poisComLocalizacao = this.poisDoDiaOrdenadosComLocalizacao;
    const poiFocado = poisComLocalizacao.find(poi => poi.id === this.poi?.id) || poisComLocalizacao[0];
    const centro: [number, number] = [poiFocado.latitude!, poiFocado.longitude!];

    if (!this.mapaLeaflet) {
      this.mapaLeaflet = leaflet.map(this.mapaPoi.nativeElement).setView(centro, 16);
      this.criarTileLayerComCache(leaflet).addTo(this.mapaLeaflet);
    } else {
      this.mapaLeaflet.setView(centro, 16);
    }

    this.destruirCamadasMapa();

    const pontos: Array<[number, number]> = [];

    poisComLocalizacao.forEach((poi, index) => {
      const posicao: [number, number] = [poi.latitude!, poi.longitude!];
      const marcador = leaflet
        .marker(posicao, {
          icon: this.criarIconePoi(leaflet, poi, index)
        })
        .addTo(this.mapaLeaflet);

      marcador.bindPopup(this.criarPopupPoi(poi, index));
      marcador.on('click', () => this.navegarParaPoi(poi));
      this.marcadoresLeaflet.push(marcador);
      pontos.push(posicao);
    });

    if (pontos.length > 1) {
      this.rotaLeaflet = leaflet
        .polyline(pontos, {
          color: '#2c7a6e',
          dashArray: '8 8',
          lineCap: 'round',
          lineJoin: 'round',
          opacity: 0.86,
          weight: 4
        })
        .addTo(this.mapaLeaflet);
    }

    if (pontos.length > 1) {
      this.mapaLeaflet.fitBounds(leaflet.latLngBounds(pontos), {
        maxZoom: 16,
        padding: [28, 28]
      });
    } else {
      this.mapaLeaflet.setView(centro, 16);
    }

    setTimeout(() => this.mapaLeaflet?.invalidateSize(), 100);
  }

  private criarTileLayerComCache(leaflet: any): any {
    const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const tileLayer = leaflet.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    });

    const originalGetTileUrl = tileLayer.getTileUrl.bind(tileLayer);
    tileLayer.getTileUrl = (coords: any) => {
      const url = originalGetTileUrl(coords);
      this.cachearTileEmBackground(url);
      return url;
    };

    const originalCreateTile = tileLayer.createTile.bind(tileLayer);
    tileLayer.createTile = (coords: any) => {
      const tile = originalCreateTile(coords);
      const url = tileLayer.getTileUrl(coords);

      if (tile instanceof HTMLImageElement) {
        const originalSrc = tile.src;

        tile.onerror = async () => {
          const cacheBlob = await this.mapCacheService.obterTile(url);
          if (cacheBlob) {
            const objectUrl = URL.createObjectURL(cacheBlob);
            tile.src = objectUrl;
          } else {
            const canvas = document.createElement('canvas');
            canvas.width = 256;
            canvas.height = 256;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.fillStyle = '#f0f0f0';
              ctx.fillRect(0, 0, 256, 256);
              ctx.fillStyle = '#999';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('Offline', 128, 128);
            }
            tile.src = canvas.toDataURL();
          }
        };

        const originalOnload = tile.onload;
        tile.onload = () => {
          if (originalOnload) originalOnload.call(tile, new Event('load'));
          this.cachearTileDeImg(url, tile);
        };

        tile.src = originalSrc;
      }

      return tile;
    };

    return tileLayer;
  }

  private cachearTileEmBackground(url: string): void {
    fetch(url)
      .then(res => res.blob())
      .then(blob => this.mapCacheService.cachearTile(url, blob))
      .catch(() => {});
  }

  private cachearTileDeImg(url: string, imgElement: HTMLImageElement): void {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = imgElement.width || 256;
    canvas.height = imgElement.height || 256;
    ctx.drawImage(imgElement, 0, 0);

    canvas.toBlob(blob => {
      if (blob) {
        this.mapCacheService.cachearTile(url, blob);
      }
    }, 'image/png');
  }

  private destruirMapa() {
    if (this.mapaLeaflet) {
      this.mapaLeaflet.remove();
      this.mapaLeaflet = null;
      this.marcadoresLeaflet = [];
      this.rotaLeaflet = null;
    }
  }

  private destruirCamadasMapa() {
    this.marcadoresLeaflet.forEach(marcador => marcador.remove());
    this.marcadoresLeaflet = [];

    if (this.rotaLeaflet) {
      this.rotaLeaflet.remove();
      this.rotaLeaflet = null;
    }
  }

  private navegarParaPoi(poi: POI) {
    if (!this.viagemId || !this.diaId || poi.id === this.poiId) {
      return;
    }

    this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId, 'poi', poi.id]);
  }

  private criarIconePoi(leaflet: any, poi: POI, index: number) {
    const ativo = poi.id === this.poi?.id;
    const numero = String(index + 1);
    const cor = this.obterCorPin(poi.categoria);
    const escala = ativo ? ' scale(1.12)' : '';
    const sombra = ativo
      ? '0 0 0 4px rgba(242, 201, 76, 0.34), 0 4px 10px rgba(0, 0, 0, 0.32)'
      : '0 3px 8px rgba(0, 0, 0, 0.28)';
    const borda = ativo ? '#f2c94c' : '#ffffff';

    return leaflet.divIcon({
      className: '',
      html: `
        <span style="
          align-items:center;background:${cor};border:2px solid ${borda};border-radius:50% 50% 50% 0;
          box-shadow:${sombra};color:#fff;display:flex;font-size:12px;font-weight:700;height:30px;
          justify-content:center;line-height:1;transform:rotate(-45deg)${escala};width:30px;">
          <span style="transform:rotate(45deg);">${numero}</span>
        </span>
      `,
      iconAnchor: [15, 34],
      iconSize: [30, 34],
      popupAnchor: [0, -30]
    });
  }

  private criarPopupPoi(poi: POI, index: number): string {
    const nome = this.escapeHtml(poi.nome || `POI ${index + 1}`);
    const tipo = poi.tipo || poi.categoria;
    const endereco = poi.endereco;

    return [
      `<strong>${index + 1}. ${nome}</strong>`,
      tipo ? `<br><span>${this.escapeHtml(tipo)}</span>` : '',
      endereco ? `<br><small>${this.escapeHtml(endereco)}</small>` : ''
    ].join('');
  }

  private escapeHtml(valor: string): string {
    return valor
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  private obterCorPin(categoria?: string): string {
    const cores: Record<string, string> = {
      gastronomia: '#e8823a',
      cultura: '#5e35b1',
      natureza: '#2c7a6e',
      aventura: '#d84315',
      compras: '#c2185b',
      hospedagem: '#00796b',
      outro: '#607d8b'
    };

    return cores[categoria || 'outro'] || cores['outro'];
  }

  abrirTelefone() {
    if (this.poi?.telefone) {
      window.open(`tel:${this.poi.telefone}`);
    }
  }

  abrirUrl() {
    if (this.poi?.url) {
      window.open(this.poi.url, '_blank');
    }
  }

}
