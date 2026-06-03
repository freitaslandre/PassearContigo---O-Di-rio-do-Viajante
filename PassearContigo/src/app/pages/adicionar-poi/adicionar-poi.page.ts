import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ViagensService } from '../../services/viagens.service';
import { POIService } from '../../services/poi.service';
import { CameraService } from '../../services/camera.service';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { GeolocationService } from '../../services/geolocation.service';
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';
import { POI, Viagem } from '../../models/viagem.model';
import { getAuth } from 'firebase/auth';
import * as L from 'leaflet';

@Component({
  standalone: false,
  selector: 'app-adicionar-poi',
  templateUrl: './adicionar-poi.page.html',
  styleUrls: ['./adicionar-poi.page.scss']
})
export class AdicionarPoiPage implements OnInit, AfterViewInit, OnDestroy {
  poi: Omit<Partial<POI>, 'custo'> & { latitude?: string | number; longitude?: string | number; custo?: string | number } = {
    nome: '',
    descricao: '',
    tipo: '',
    endereco: '',
    telefone: '',
    horario: '',
    url: '',
    latitude: undefined,
    longitude: undefined,
    nota: '',
    custo: undefined,
    categoria: '',
    avaliacao: 0
  };

  viagemId: string | null = null;
  diaId: string | null = null;
  diaTitulo = '';
  viagem: Viagem | null = null;
  sugestoesLocais: NominatimSearchResult[] = [];
  carregandoSugestoes = false;
  erroSugestoes = '';
  obtendoLocalizacaoAtual = false;
  localizacaoAtualDetetada = false;
  erroLocalizacaoAtual = '';
  horarioAbertura = '';
  horarioFecho = '';
  private pesquisaSugestaoAtual = 0;

  fotoPreview: string | null = null;
  fotoFile: File | null = null;
  @ViewChild('fotoInput') fotoInput!: ElementRef;

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private defaultLat = 40.7128;
  private defaultLng = -74.0060;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private poiService: POIService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController,
    private nominatimService: NominatimService,
    private geolocationService: GeolocationService,
    private storageService: FirebaseStorageService,
    private cameraService: CameraService
  ) {}

  ngOnInit() {
    this.viagemId = this.route.snapshot.paramMap.get('id');
    this.diaId = this.route.snapshot.paramMap.get('diaId');
    this.carregarDiaTitulo();
  }

  ngAfterViewInit() {
    this.inicializarMapa();
    this.preencherComLocalizacaoAtual(true);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }

  private inicializarMapa() {
    if (this.map) return;

    const lat = this.poi.latitude ? Number(this.poi.latitude) : this.defaultLat;
    const lng = this.poi.longitude ? Number(this.poi.longitude) : this.defaultLng;

    this.map = L.map('map').setView([lat, lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(this.map);

    if (this.poi.latitude && this.poi.longitude) {
      this.adicionarMarcador(Number(this.poi.latitude), Number(this.poi.longitude));
    }

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.atualizarPorCliqueMapa(e.latlng.lat, e.latlng.lng);
    });
  }

  private adicionarMarcador(lat: number, lng: number) {
    if (this.marker) {
      this.marker.setLatLng([lat, lng]);
    } else {
      this.marker = L.marker([lat, lng]).addTo(this.map!);
    }

    if (this.map) {
      this.map.setView([lat, lng], 13);
    }
  }

  private atualizarPorCliqueMapa(lat: number, lng: number) {
    this.poi.latitude = lat;
    this.poi.longitude = lng;
    this.adicionarMarcador(lat, lng);
    this.atualizarNomePorGeolocalizacao(true);
  }

  async preencherComLocalizacaoAtual(silencioso = false) {
    if (this.obtendoLocalizacaoAtual) {
      return;
    }

    this.obtendoLocalizacaoAtual = true;
    this.erroLocalizacaoAtual = '';

    try {
      const position = await this.geolocationService.getCurrentPosition();

      if (!position) {
        this.localizacaoAtualDetetada = false;
        this.erroLocalizacaoAtual = 'Não foi possível obter a localização atual.';

        if (!silencioso) {
          await this.mostrarToast(this.erroLocalizacaoAtual, 'warning');
        }
        return;
      }

      const lat = position.coords.latitude;
      const lng = position.coords.longitude;

      this.poi.latitude = lat;
      this.poi.longitude = lng;
      this.localizacaoAtualDetetada = true;
      this.sugestoesLocais = [];
      this.erroSugestoes = '';

      this.adicionarMarcador(lat, lng);
      await this.atualizarNomePorGeolocalizacao(true);

      if (!silencioso) {
        await this.mostrarToast('Localização atual aplicada ao POI.', 'success');
      }
    } catch (error) {
      console.debug('Erro ao preencher localização atual:', error);
      this.localizacaoAtualDetetada = false;
      this.erroLocalizacaoAtual = 'Não foi possível obter a localização atual.';

      if (!silencioso) {
        await this.mostrarToast(this.erroLocalizacaoAtual, 'warning');
      }
    } finally {
      this.obtendoLocalizacaoAtual = false;
    }
  }

  private async carregarDiaTitulo() {
    if (!this.viagemId || !this.diaId) {
      return;
    }

    const viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);
    this.viagem = viagem;
    if (!viagem || !viagem.dias) {
      return;
    }

    const dia = viagem.dias.find(d => d.id === this.diaId);
    this.diaTitulo = dia?.titulo || '';

    if (!this.podeEditarViagem) {
      const toast = await this.toastCtrl.create({
        message: 'Tem acesso apenas de visualização nesta viagem.',
        duration: 2200,
        color: 'warning'
      });
      await toast.present();
    }
  }

  get podeEditarViagem(): boolean {
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  async atualizarNomePorGeolocalizacao(sobrescrever = false) {
    const latitude = this.poi.latitude;
    const longitude = this.poi.longitude;

    // Validar que ambos os valores estão preenchidos
    if (latitude === undefined || latitude === null ||
        longitude === undefined || longitude === null) {
      return;
    }

    try {
      const lat = Number(latitude);
      const lng = Number(longitude);

      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        return;
      }

      const detalhes = await this.nominatimService.obterDetalhesPorCoordenadas(lat, lng);

      if ((sobrescrever || !this.poi.nome?.trim()) && detalhes.nomeSugerido) {
        this.poi.nome = detalhes.nomeSugerido.trim();
      }

      if ((sobrescrever || !this.poi.endereco?.trim()) && detalhes.endereco) {
        this.poi.endereco = detalhes.endereco;
      }

      if ((sobrescrever || !this.poi.tipo?.trim()) && detalhes.categoria) {
        this.poi.tipo = detalhes.categoria;
      }

      const categoriaApp = this.inferirCategoriaApp(detalhes.categoria, detalhes.nomeSugerido, detalhes.endereco);
      if ((sobrescrever || !this.poi.categoria?.trim()) && categoriaApp) {
        this.poi.categoria = categoriaApp;
      }
    } catch (error) {
      // Silenciosamente ignorar erros de geolocalização
      console.debug('Erro ao obter geolocalização:', error);
    }
  }

  private inferirCategoriaApp(...valores: Array<string | undefined>): string | undefined {
    const texto = valores.filter(Boolean).join(' ').toLowerCase();

    if (!texto) {
      return undefined;
    }

    if (/(restaurant|cafe|bar|pub|food|fast food|bakery|confectionery|gastronomia|restaurante|café|pastelaria)/.test(texto)) {
      return 'gastronomia';
    }

    if (/(museum|gallery|art|theatre|cinema|historic|monument|castle|church|cultura|museu|galeria|teatro|igreja|monumento)/.test(texto)) {
      return 'cultura';
    }

    if (/(park|garden|beach|viewpoint|nature|forest|waterfall|natureza|jardim|praia|miradouro|floresta)/.test(texto)) {
      return 'natureza';
    }

    if (/(adventure|sports|climbing|trail|hiking|cycling|aventura|trilho|caminhada|desporto)/.test(texto)) {
      return 'aventura';
    }

    if (/(shop|mall|market|supermarket|compras|loja|mercado|centro comercial)/.test(texto)) {
      return 'compras';
    }

    if (/(hotel|hostel|guest house|apartment|accommodation|hospedagem|alojamento)/.test(texto)) {
      return 'hospedagem';
    }

    return 'outro';
  }

  async pesquisarSugestoesLocais() {
    const termo = `${this.poi.nome || ''} ${this.poi.endereco || ''}`.trim();
    const pesquisaId = ++this.pesquisaSugestaoAtual;

    this.erroSugestoes = '';

    if (termo.length < 3) {
      this.sugestoesLocais = [];
      this.carregandoSugestoes = false;
      return;
    }

    this.carregandoSugestoes = true;

    try {
      const resultados = await this.nominatimService.pesquisarLocais(termo);

      if (pesquisaId === this.pesquisaSugestaoAtual) {
        this.sugestoesLocais = resultados;
      }
    } catch (error) {
      if (pesquisaId === this.pesquisaSugestaoAtual) {
        this.sugestoesLocais = [];
        this.erroSugestoes = 'Não foi possível carregar sugestões agora.';
      }
    } finally {
      if (pesquisaId === this.pesquisaSugestaoAtual) {
        this.carregandoSugestoes = false;
      }
    }
  }

  selecionarSugestaoLocal(local: NominatimSearchResult) {
    this.poi.nome = local.nome;
    this.poi.endereco = local.endereco;
    this.poi.tipo = local.categoria;
    this.poi.latitude = local.latitude;
    this.poi.longitude = local.longitude;
    this.sugestoesLocais = [];
    this.erroSugestoes = '';

    if (this.map) {
      this.adicionarMarcador(local.latitude, local.longitude);
    }
  }

  selecionarFoto() {
    this.fotoInput.nativeElement.click();
  }

  async tirarFoto(): Promise<void> {
    const foto = await this.cameraService.takePicture();
    if (foto) {
      this.fotoFile = null;
      this.fotoPreview = foto;
      return;
    }

    const toast = await this.toastCtrl.create({
      message: 'Não foi possível capturar a foto.',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
  }

  async escolherFotoDaGaleria(): Promise<void> {
    const foto = await this.cameraService.selectPictureFromGallery();
    if (foto) {
      this.fotoFile = null;
      this.fotoPreview = foto;
      return;
    }

    const toast = await this.toastCtrl.create({
      message: 'Não foi possível selecionar a foto.',
      duration: 2000,
      color: 'warning'
    });
    await toast.present();
  }

  onFotoSelecionada(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    this.fotoFile = file;

    const reader = new FileReader();
    reader.onload = (e) => {
      this.fotoPreview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removerFoto() {
    this.fotoFile = null;
    this.fotoPreview = null;
    this.fotoInput.nativeElement.value = '';
  }

  normalizarTelefonePoi(event: CustomEvent<{ value?: string | null }>) {
    this.poi.telefone = this.apenasDigitos(event.detail?.value);
  }

  normalizarCustoPoi(event: CustomEvent<{ value?: string | null }>) {
    this.poi.custo = this.normalizarDecimal(event.detail?.value);
  }

  atualizarHorarioPoi() {
    this.poi.horario = this.montarHorario();
  }

  private apenasDigitos(valor: unknown): string {
    return String(valor ?? '').replace(/\D/g, '');
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

  private montarHorario(): string {
    const abertura = this.horarioAbertura.trim();
    const fecho = this.horarioFecho.trim();

    if (abertura && fecho) {
      return `${abertura} - ${fecho}`;
    }

    return abertura || fecho;
  }

  async adicionarPoi() {
    if (!this.podeEditarViagem) {
      const toast = await this.toastCtrl.create({
        message: 'Não tem permissão para adicionar POIs nesta viagem.',
        duration: 2200,
        color: 'warning'
      });
      await toast.present();
      return;
    }

    if (!this.poi.nome?.trim()) {
      const alert = await this.alertCtrl.create({
        header: 'Formulário inválido',
        message: 'Preencha o nome do ponto de interesse.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.viagemId || !this.diaId) {
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'A adicionar ponto de interesse...'
    });
    await loader.present();

    try {
      const poiId = `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      let fotoNaoGuardada = false;
      let fotoGuardadaNoPoi = false;
      this.poi.horario = this.montarHorario();

      const novoPoi: POI = {
        id: poiId,
        nome: this.poi.nome.trim(),
        descricao: this.poi.descricao?.trim() || undefined,
        tipo: this.poi.tipo?.trim() || undefined,
        endereco: this.poi.endereco?.trim() || undefined,
        telefone: this.poi.telefone?.trim() || undefined,
        horario: this.poi.horario?.trim() || undefined,
        url: this.poi.url?.trim() || undefined,
        nota: this.poi.nota?.trim() || undefined,
        categoria: this.poi.categoria?.trim() || undefined,
        avaliacao: this.poi.avaliacao ? Number(this.poi.avaliacao) : undefined
      };

      if (this.poi.custo !== undefined && this.poi.custo !== null) {
        const custValue = Number(this.poi.custo);
        if (!Number.isNaN(custValue)) {
          novoPoi.custo = custValue;
        }
      }

      const latitudeValue = this.poi.latitude;
      if (latitudeValue !== undefined && latitudeValue !== null) {
        const latitudeText = latitudeValue.toString().trim();
        if (latitudeText !== '') {
          const lat = Number(latitudeText);
          if (!Number.isNaN(lat)) {
            novoPoi.latitude = lat;
          }
        }
      }

      const longitudeValue = this.poi.longitude;
      if (longitudeValue !== undefined && longitudeValue !== null) {
        const longitudeText = longitudeValue.toString().trim();
        if (longitudeText !== '') {
          const lon = Number(longitudeText);
          if (!Number.isNaN(lon)) {
            novoPoi.longitude = lon;
          }
        }
      }

      if (this.fotoPreview && this.fotoPreview.startsWith('data:')) {
        try {
          const fotoUrl = await this.storageService.uploadPoiPhoto(
            this.viagemId,
            this.diaId,
            poiId,
            this.fotoPreview
          );
          novoPoi.fotoUrl = fotoUrl;
        } catch (error) {
          console.warn('Aviso: Não foi possível fazer upload da foto para o Storage, a guardar no POI', error);

          const fotoComprimida = await this.storageService.optimizeImage(this.fotoPreview, 720, 0.55);
          if (fotoComprimida.length <= 700_000) {
            novoPoi.fotoUrl = fotoComprimida;
            fotoGuardadaNoPoi = true;
          } else {
            fotoNaoGuardada = true;
          }
        }
      }

      const currentUser = getAuth().currentUser;
      if (currentUser) {
        novoPoi.colaboradorUid = currentUser.uid;
        novoPoi.colaboradorEmail = currentUser.email || undefined;
        novoPoi.colaboradorNome = currentUser.displayName || undefined;
      }

      await this.poiService.adicionarPOI(this.viagemId, this.diaId, novoPoi);

      await loader.dismiss();

      const toast = await this.toastCtrl.create({
        message: fotoNaoGuardada
          ? 'POI adicionado, mas a foto era demasiado pesada para guardar.'
          : fotoGuardadaNoPoi
            ? 'POI adicionado com foto guardada.'
            : 'POI adicionado com sucesso!',
        duration: 1800,
        color: fotoNaoGuardada ? 'warning' : 'success'
      });
      await toast.present();
      await toast.onDidDismiss();

      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
    } catch (error: any) {
      await loader.dismiss();
      const toast = await this.toastCtrl.create({
        message: error?.message || 'Erro ao adicionar POI.',
        duration: 2500,
        color: 'danger'
      });
      await toast.present();
    }
  }

  cancelar() {
    if (this.viagemId && this.diaId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
    } else {
      this.router.navigate(['/tabs', 'viagens']);
    }
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
  }
}
