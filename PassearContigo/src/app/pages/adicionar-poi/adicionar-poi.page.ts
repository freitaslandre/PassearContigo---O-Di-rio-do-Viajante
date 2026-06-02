import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ViagensService } from '../../services/viagens.service';
import { POIService } from '../../services/poi.service';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';
import { POI } from '../../models/viagem.model';
import * as L from 'leaflet';

@Component({
  standalone: false,
  selector: 'app-adicionar-poi',
  templateUrl: './adicionar-poi.page.html',
  styleUrls: ['./adicionar-poi.page.scss']
})
export class AdicionarPoiPage implements OnInit, AfterViewInit, OnDestroy {
  poi: Partial<POI> & { latitude?: string | number; longitude?: string | number } = {
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
  sugestoesLocais: NominatimSearchResult[] = [];
  carregandoSugestoes = false;
  erroSugestoes = '';
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
    private storageService: FirebaseStorageService
  ) {}

  ngOnInit() {
    this.viagemId = this.route.snapshot.paramMap.get('id');
    this.diaId = this.route.snapshot.paramMap.get('diaId');
    this.carregarDiaTitulo();
  }

  ngAfterViewInit() {
    this.inicializarMapa();
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
    this.atualizarNomePorGeolocalizacao();
  }

  private async carregarDiaTitulo() {
    if (!this.viagemId || !this.diaId) {
      return;
    }

    const viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);
    if (!viagem || !viagem.dias) {
      return;
    }

    const dia = viagem.dias.find(d => d.id === this.diaId);
    this.diaTitulo = dia?.titulo || '';
  }

  async atualizarNomePorGeolocalizacao() {
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

      if (!this.poi.nome?.trim() && detalhes.nomeSugerido) {
        this.poi.nome = detalhes.nomeSugerido.trim();
      }

      if (!this.poi.endereco?.trim() && detalhes.endereco) {
        this.poi.endereco = detalhes.endereco;
      }
    } catch (error) {
      // Silenciosamente ignorar erros de geolocalização
      console.debug('Erro ao obter geolocalização:', error);
    }
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
        this.erroSugestoes = 'Nao foi possivel carregar sugestoes agora.';
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

    if (this.map && this.marker) {
      this.adicionarMarcador(local.latitude, local.longitude);
    }
  }

  selecionarFoto() {
    this.fotoInput.nativeElement.click();
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

  async adicionarPoi() {
    if (!this.poi.nome?.trim()) {
      const alert = await this.alertCtrl.create({
        header: 'Formulário Inválido',
        message: 'Por favor preencha o nome do ponto de interesse.',
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    if (!this.viagemId || !this.diaId) {
      return;
    }

    const loader = await this.loadingCtrl.create({
      message: 'Adicionando ponto de interesse...'
    });
    await loader.present();

    try {
      const poiId = `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

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
          console.warn('Aviso: Não foi possível fazer upload da foto, continuando sem imagem', error);
        }
      }

      await this.poiService.adicionarPOI(this.viagemId, this.diaId, novoPoi);

      await loader.dismiss();

      const toast = await this.toastCtrl.create({
        message: 'POI adicionado com sucesso!',
        duration: 1800,
        color: 'success'
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
}
