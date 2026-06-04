// app/pages/adicionar-poi/adicionar-poi.page.ts | Controlador da pagina adicionar poi, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';
// Importa dependencias usadas neste ficheiro.
import { POIService } from '../../services/poi.service';
// Importa dependencias usadas neste ficheiro.
import { CameraService } from '../../services/camera.service';
// Importa dependencias usadas neste ficheiro.
import { FirebaseStorageService } from '../../services/firebase-storage.service';
// Importa dependencias usadas neste ficheiro.
import { GeolocationService } from '../../services/geolocation.service';
// Importa dependencias usadas neste ficheiro.
import { NominatimSearchResult, NominatimService } from '../../services/nominatim.service';
// Importa dependencias usadas neste ficheiro.
import { POI, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { getAuth } from 'firebase/auth';
// Importa dependencias usadas neste ficheiro.
import * as L from 'leaflet';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  selector: 'app-adicionar-poi',
  // Define um campo ou opcao de configuracao.
  templateUrl: './adicionar-poi.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./adicionar-poi.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class AdicionarPoiPage implements OnInit, AfterViewInit, OnDestroy {
  // Define um campo ou opcao de configuracao.
  poi: Omit<Partial<POI>, 'custo'> & { latitude?: string | number; longitude?: string | number; custo?: string | number } = {
    // Define um campo ou opcao de configuracao.
    nome: '',
    // Define um campo ou opcao de configuracao.
    descricao: '',
    // Define um campo ou opcao de configuracao.
    tipo: '',
    // Define um campo ou opcao de configuracao.
    endereco: '',
    // Define um campo ou opcao de configuracao.
    telefone: '',
    // Define um campo ou opcao de configuracao.
    horario: '',
    // Define um campo ou opcao de configuracao.
    url: '',
    // Define um campo ou opcao de configuracao.
    latitude: undefined,
    // Define um campo ou opcao de configuracao.
    longitude: undefined,
    // Define um campo ou opcao de configuracao.
    nota: '',
    // Define um campo ou opcao de configuracao.
    custo: undefined,
    // Define um campo ou opcao de configuracao.
    categoria: '',
    // Define um campo ou opcao de configuracao.
    avaliacao: 0
  };

  // Define um campo ou opcao de configuracao.
  viagemId: string | null = null;
  // Define um campo ou opcao de configuracao.
  diaId: string | null = null;
  // Atribui um valor a esta propriedade.
  diaTitulo = '';
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  sugestoesLocais: NominatimSearchResult[] = [];
  // Atribui um valor a esta propriedade.
  carregandoSugestoes = false;
  // Atribui um valor a esta propriedade.
  erroSugestoes = '';
  // Atribui um valor a esta propriedade.
  obtendoLocalizacaoAtual = false;
  // Atribui um valor a esta propriedade.
  localizacaoAtualDetetada = false;
  // Atribui um valor a esta propriedade.
  erroLocalizacaoAtual = '';
  // Atribui um valor a esta propriedade.
  horarioAbertura = '';
  // Atribui um valor a esta propriedade.
  horarioFecho = '';
  // Define um membro interno desta classe.
  private pesquisaSugestaoAtual = 0;

  // Define um campo ou opcao de configuracao.
  fotoPreview: string | null = null;
  // Define um campo ou opcao de configuracao.
  fotoFile: File | null = null;
  // Aplica metadados/decoradores ao elemento seguinte.
  @ViewChild('fotoInput') fotoInput!: ElementRef;

  // Define um membro interno desta classe.
  private map: L.Map | null = null;
  // Define um membro interno desta classe.
  private marker: L.Marker | null = null;
  // Define um membro interno desta classe.
  private defaultLat = 40.7128;
  // Define um membro interno desta classe.
  private defaultLng = -74.0060;

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
    private loadingCtrl: LoadingController,
    // Define um membro interno desta classe.
    private toastCtrl: ToastController,
    // Define um membro interno desta classe.
    private nominatimService: NominatimService,
    // Define um membro interno desta classe.
    private geolocationService: GeolocationService,
    // Define um membro interno desta classe.
    private storageService: FirebaseStorageService,
    // Define um membro interno desta classe.
    private cameraService: CameraService
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.viagemId = this.route.snapshot.paramMap.get('id');
    // Atualiza ou consulta estado da pagina.
    this.diaId = this.route.snapshot.paramMap.get('diaId');
    // Atualiza ou consulta estado da pagina.
    this.carregarDiaTitulo();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngAfterViewInit() {
    // Atualiza ou consulta estado da pagina.
    this.inicializarMapa();
    // Atualiza ou consulta estado da pagina.
    this.preencherComLocalizacaoAtual(true);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnDestroy() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.map) {
      // Atualiza ou consulta estado da pagina.
      this.map.remove();
    }
  }

  // Define um membro interno desta classe.
  private inicializarMapa() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.map) return;

    // Cria uma variavel local para esta operacao.
    const lat = this.poi.latitude ? Number(this.poi.latitude) : this.defaultLat;
    // Cria uma variavel local para esta operacao.
    const lng = this.poi.longitude ? Number(this.poi.longitude) : this.defaultLng;

    // Atualiza ou consulta estado da pagina.
    this.map = L.map('map').setView([lat, lng], 13);

    // Executa uma instrucao necessaria para este fluxo.
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      // Define um campo ou opcao de configuracao.
      attribution: '© OpenStreetMap contributors',
      // Define um campo ou opcao de configuracao.
      maxZoom: 19
    // Executa uma instrucao necessaria para este fluxo.
    }).addTo(this.map);

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.poi.latitude && this.poi.longitude) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarMarcador(Number(this.poi.latitude), Number(this.poi.longitude));
    }

    // Atualiza ou consulta estado da pagina.
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      // Atualiza ou consulta estado da pagina.
      this.atualizarPorCliqueMapa(e.latlng.lat, e.latlng.lng);
    });
  }

  // Define um membro interno desta classe.
  private adicionarMarcador(lat: number, lng: number) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.marker) {
      // Atualiza ou consulta estado da pagina.
      this.marker.setLatLng([lat, lng]);
    // Executa uma instrucao necessaria para este fluxo.
    } else {
      // Atualiza ou consulta estado da pagina.
      this.marker = L.marker([lat, lng]).addTo(this.map!);
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.map) {
      // Atualiza ou consulta estado da pagina.
      this.map.setView([lat, lng], 13);
    }
  }

  // Define um membro interno desta classe.
  private atualizarPorCliqueMapa(lat: number, lng: number) {
    // Atualiza ou consulta estado da pagina.
    this.poi.latitude = lat;
    // Atualiza ou consulta estado da pagina.
    this.poi.longitude = lng;
    // Atualiza ou consulta estado da pagina.
    this.adicionarMarcador(lat, lng);
    // Atualiza ou consulta estado da pagina.
    this.atualizarNomePorGeolocalizacao(true);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async preencherComLocalizacaoAtual(silencioso = false) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.obtendoLocalizacaoAtual) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.obtendoLocalizacaoAtual = true;
    // Atualiza ou consulta estado da pagina.
    this.erroLocalizacaoAtual = '';

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const position = await this.geolocationService.getCurrentPosition();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!position) {
        // Atualiza ou consulta estado da pagina.
        this.localizacaoAtualDetetada = false;
        // Atualiza ou consulta estado da pagina.
        this.erroLocalizacaoAtual = 'Não foi possível obter a localização atual.';

        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!silencioso) {
          // Aguarda a conclusao de uma operacao assincrona.
          await this.mostrarToast(this.erroLocalizacaoAtual, 'warning');
        }
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const lat = position.coords.latitude;
      // Cria uma variavel local para esta operacao.
      const lng = position.coords.longitude;

      // Atualiza ou consulta estado da pagina.
      this.poi.latitude = lat;
      // Atualiza ou consulta estado da pagina.
      this.poi.longitude = lng;
      // Atualiza ou consulta estado da pagina.
      this.localizacaoAtualDetetada = true;
      // Atualiza ou consulta estado da pagina.
      this.sugestoesLocais = [];
      // Atualiza ou consulta estado da pagina.
      this.erroSugestoes = '';

      // Atualiza ou consulta estado da pagina.
      this.adicionarMarcador(lat, lng);
      // Aguarda a conclusao de uma operacao assincrona.
      await this.atualizarNomePorGeolocalizacao(true);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!silencioso) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast('Localização atual aplicada ao POI.', 'success');
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.debug('Erro ao preencher localização atual:', error);
      // Atualiza ou consulta estado da pagina.
      this.localizacaoAtualDetetada = false;
      // Atualiza ou consulta estado da pagina.
      this.erroLocalizacaoAtual = 'Não foi possível obter a localização atual.';

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!silencioso) {
        // Aguarda a conclusao de uma operacao assincrona.
        await this.mostrarToast(this.erroLocalizacaoAtual, 'warning');
      }
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.obtendoLocalizacaoAtual = false;
    }
  }

  // Define um membro interno desta classe.
  private async carregarDiaTitulo() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.diaId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);
    // Atualiza ou consulta estado da pagina.
    this.viagem = viagem;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!viagem || !viagem.dias) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const dia = viagem.dias.find(d => d.id === this.diaId);
    // Atualiza ou consulta estado da pagina.
    this.diaTitulo = dia?.titulo || '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: 'Tem acesso apenas de visualização nesta viagem.',
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'warning'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
    }
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeEditarViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async atualizarNomePorGeolocalizacao(sobrescrever = false) {
    // Cria uma variavel local para esta operacao.
    const latitude = this.poi.latitude;
    // Cria uma variavel local para esta operacao.
    const longitude = this.poi.longitude;

    // Validar que ambos os valores estão preenchidos
    if (latitude === undefined || latitude === null ||
        // Atribui um valor a esta propriedade.
        longitude === undefined || longitude === null) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const lat = Number(latitude);
      // Cria uma variavel local para esta operacao.
      const lng = Number(longitude);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        // Devolve o resultado deste bloco.
        return;
      }

      // Cria uma variavel local para esta operacao.
      const detalhes = await this.nominatimService.obterDetalhesPorCoordenadas(lat, lng);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if ((sobrescrever || !this.poi.nome?.trim()) && detalhes.nomeSugerido) {
        // Atualiza ou consulta estado da pagina.
        this.poi.nome = detalhes.nomeSugerido.trim();
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if ((sobrescrever || !this.poi.endereco?.trim()) && detalhes.endereco) {
        // Atualiza ou consulta estado da pagina.
        this.poi.endereco = detalhes.endereco;
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if ((sobrescrever || !this.poi.tipo?.trim()) && detalhes.categoria) {
        // Atualiza ou consulta estado da pagina.
        this.poi.tipo = detalhes.categoria;
      }

      // Cria uma variavel local para esta operacao.
      const categoriaApp = this.inferirCategoriaApp(detalhes.categoria, detalhes.nomeSugerido, detalhes.endereco);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if ((sobrescrever || !this.poi.categoria?.trim()) && categoriaApp) {
        // Atualiza ou consulta estado da pagina.
        this.poi.categoria = categoriaApp;
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Silenciosamente ignorar erros de geolocalização
      console.debug('Erro ao obter geolocalização:', error);
    }
  }

  // Define um membro interno desta classe.
  private inferirCategoriaApp(...valores: Array<string | undefined>): string | undefined {
    // Cria uma variavel local para esta operacao.
    const texto = valores.filter(Boolean).join(' ').toLowerCase();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!texto) {
      // Devolve o resultado deste bloco.
      return undefined;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (/(restaurant|cafe|bar|pub|food|fast food|bakery|confectionery|gastronomia|restaurante|café|pastelaria)/.test(texto)) {
      // Devolve o resultado deste bloco.
      return 'gastronomia';
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (/(museum|gallery|art|theatre|cinema|historic|monument|castle|church|cultura|museu|galeria|teatro|igreja|monumento)/.test(texto)) {
      // Devolve o resultado deste bloco.
      return 'cultura';
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (/(park|garden|beach|viewpoint|nature|forest|waterfall|natureza|jardim|praia|miradouro|floresta)/.test(texto)) {
      // Devolve o resultado deste bloco.
      return 'natureza';
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (/(adventure|sports|climbing|trail|hiking|cycling|aventura|trilho|caminhada|desporto)/.test(texto)) {
      // Devolve o resultado deste bloco.
      return 'aventura';
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (/(shop|mall|market|supermarket|compras|loja|mercado|centro comercial)/.test(texto)) {
      // Devolve o resultado deste bloco.
      return 'compras';
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (/(hotel|hostel|guest house|apartment|accommodation|hospedagem|alojamento)/.test(texto)) {
      // Devolve o resultado deste bloco.
      return 'hospedagem';
    }

    // Devolve o resultado deste bloco.
    return 'outro';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async pesquisarSugestoesLocais() {
    // Cria uma variavel local para esta operacao.
    const termo = `${this.poi.nome || ''} ${this.poi.endereco || ''}`.trim();
    // Cria uma variavel local para esta operacao.
    const pesquisaId = ++this.pesquisaSugestaoAtual;

    // Atualiza ou consulta estado da pagina.
    this.erroSugestoes = '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (termo.length < 3) {
      // Atualiza ou consulta estado da pagina.
      this.sugestoesLocais = [];
      // Atualiza ou consulta estado da pagina.
      this.carregandoSugestoes = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.carregandoSugestoes = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const resultados = await this.nominatimService.pesquisarLocais(termo);

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (pesquisaId === this.pesquisaSugestaoAtual) {
        // Atualiza ou consulta estado da pagina.
        this.sugestoesLocais = resultados;
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (pesquisaId === this.pesquisaSugestaoAtual) {
        // Atualiza ou consulta estado da pagina.
        this.sugestoesLocais = [];
        // Atualiza ou consulta estado da pagina.
        this.erroSugestoes = 'Não foi possível carregar sugestões agora.';
      }
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (pesquisaId === this.pesquisaSugestaoAtual) {
        // Atualiza ou consulta estado da pagina.
        this.carregandoSugestoes = false;
      }
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  selecionarSugestaoLocal(local: NominatimSearchResult) {
    // Atualiza ou consulta estado da pagina.
    this.poi.nome = local.nome;
    // Atualiza ou consulta estado da pagina.
    this.poi.endereco = local.endereco;
    // Atualiza ou consulta estado da pagina.
    this.poi.tipo = local.categoria;
    // Atualiza ou consulta estado da pagina.
    this.poi.latitude = local.latitude;
    // Atualiza ou consulta estado da pagina.
    this.poi.longitude = local.longitude;
    // Atualiza ou consulta estado da pagina.
    this.sugestoesLocais = [];
    // Atualiza ou consulta estado da pagina.
    this.erroSugestoes = '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.map) {
      // Atualiza ou consulta estado da pagina.
      this.adicionarMarcador(local.latitude, local.longitude);
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  selecionarFoto() {
    // Atualiza ou consulta estado da pagina.
    this.fotoInput.nativeElement.click();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async tirarFoto(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.takePicture();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto) {
      // Atualiza ou consulta estado da pagina.
      this.fotoFile = null;
      // Atualiza ou consulta estado da pagina.
      this.fotoPreview = foto;
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Define um campo ou opcao de configuracao.
      message: 'Não foi possível capturar a foto.',
      // Define um campo ou opcao de configuracao.
      duration: 2000,
      // Define um campo ou opcao de configuracao.
      color: 'warning'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async escolherFotoDaGaleria(): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const foto = await this.cameraService.selectPictureFromGallery();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (foto) {
      // Atualiza ou consulta estado da pagina.
      this.fotoFile = null;
      // Atualiza ou consulta estado da pagina.
      this.fotoPreview = foto;
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const toast = await this.toastCtrl.create({
      // Define um campo ou opcao de configuracao.
      message: 'Não foi possível selecionar a foto.',
      // Define um campo ou opcao de configuracao.
      duration: 2000,
      // Define um campo ou opcao de configuracao.
      color: 'warning'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  onFotoSelecionada(event: Event) {
    // Cria uma variavel local para esta operacao.
    const input = event.target as HTMLInputElement;
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!input.files || input.files.length === 0) return;

    // Cria uma variavel local para esta operacao.
    const file = input.files[0];
    // Atualiza ou consulta estado da pagina.
    this.fotoFile = file;

    // Cria uma variavel local para esta operacao.
    const reader = new FileReader();
    // Executa uma instrucao necessaria para este fluxo.
    reader.onload = (e) => {
      // Atualiza ou consulta estado da pagina.
      this.fotoPreview = e.target?.result as string;
    };
    // Executa uma instrucao necessaria para este fluxo.
    reader.readAsDataURL(file);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  removerFoto() {
    // Atualiza ou consulta estado da pagina.
    this.fotoFile = null;
    // Atualiza ou consulta estado da pagina.
    this.fotoPreview = null;
    // Atualiza ou consulta estado da pagina.
    this.fotoInput.nativeElement.value = '';
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  normalizarTelefonePoi(event: CustomEvent<{ value?: string | null }>) {
    // Atualiza ou consulta estado da pagina.
    this.poi.telefone = this.apenasDigitos(event.detail?.value);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  normalizarCustoPoi(event: CustomEvent<{ value?: string | null }>) {
    // Atualiza ou consulta estado da pagina.
    this.poi.custo = this.normalizarDecimal(event.detail?.value);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  atualizarHorarioPoi() {
    // Atualiza ou consulta estado da pagina.
    this.poi.horario = this.montarHorario();
  }

  // Define um membro interno desta classe.
  private apenasDigitos(valor: unknown): string {
    // Devolve o resultado deste bloco.
    return String(valor ?? '').replace(/\D/g, '');
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

  // Define um membro interno desta classe.
  private montarHorario(): string {
    // Cria uma variavel local para esta operacao.
    const abertura = this.horarioAbertura.trim();
    // Cria uma variavel local para esta operacao.
    const fecho = this.horarioFecho.trim();

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (abertura && fecho) {
      // Devolve o resultado deste bloco.
      return `${abertura} - ${fecho}`;
    }

    // Devolve o resultado deste bloco.
    return abertura || fecho;
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarPoi() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeEditarViagem) {
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: 'Não tem permissão para adicionar POIs nesta viagem.',
        // Define um campo ou opcao de configuracao.
        duration: 2200,
        // Define um campo ou opcao de configuracao.
        color: 'warning'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.poi.nome?.trim()) {
      // Cria uma variavel local para esta operacao.
      const alert = await this.alertCtrl.create({
        // Define um campo ou opcao de configuracao.
        header: 'Formulário inválido',
        // Define um campo ou opcao de configuracao.
        message: 'Preencha o nome do ponto de interesse.',
        // Define um campo ou opcao de configuracao.
        buttons: ['OK']
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await alert.present();
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || !this.diaId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const loader = await this.loadingCtrl.create({
      // Define um campo ou opcao de configuracao.
      message: 'A adicionar ponto de interesse...'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await loader.present();

    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const poiId = `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Cria uma variavel local para esta operacao.
      let fotoNaoGuardada = false;
      // Cria uma variavel local para esta operacao.
      let fotoGuardadaNoPoi = false;
      // Atualiza ou consulta estado da pagina.
      this.poi.horario = this.montarHorario();

      // Cria uma variavel local para esta operacao.
      const novoPoi: POI = {
        // Define um campo ou opcao de configuracao.
        id: poiId,
        // Define um campo ou opcao de configuracao.
        nome: this.poi.nome.trim(),
        // Define um campo ou opcao de configuracao.
        descricao: this.poi.descricao?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        tipo: this.poi.tipo?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        endereco: this.poi.endereco?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        telefone: this.poi.telefone?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        horario: this.poi.horario?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        url: this.poi.url?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        nota: this.poi.nota?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        categoria: this.poi.categoria?.trim() || undefined,
        // Define um campo ou opcao de configuracao.
        avaliacao: this.poi.avaliacao ? Number(this.poi.avaliacao) : undefined
      };

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.poi.custo !== undefined && this.poi.custo !== null) {
        // Cria uma variavel local para esta operacao.
        const custValue = Number(this.poi.custo);
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (!Number.isNaN(custValue)) {
          // Executa uma instrucao necessaria para este fluxo.
          novoPoi.custo = custValue;
        }
      }

      // Cria uma variavel local para esta operacao.
      const latitudeValue = this.poi.latitude;
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (latitudeValue !== undefined && latitudeValue !== null) {
        // Cria uma variavel local para esta operacao.
        const latitudeText = latitudeValue.toString().trim();
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (latitudeText !== '') {
          // Cria uma variavel local para esta operacao.
          const lat = Number(latitudeText);
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (!Number.isNaN(lat)) {
            // Executa uma instrucao necessaria para este fluxo.
            novoPoi.latitude = lat;
          }
        }
      }

      // Cria uma variavel local para esta operacao.
      const longitudeValue = this.poi.longitude;
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (longitudeValue !== undefined && longitudeValue !== null) {
        // Cria uma variavel local para esta operacao.
        const longitudeText = longitudeValue.toString().trim();
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (longitudeText !== '') {
          // Cria uma variavel local para esta operacao.
          const lon = Number(longitudeText);
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (!Number.isNaN(lon)) {
            // Executa uma instrucao necessaria para este fluxo.
            novoPoi.longitude = lon;
          }
        }
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.fotoPreview && this.fotoPreview.startsWith('data:')) {
        // Inicia um bloco protegido contra erros.
        try {
          // Cria uma variavel local para esta operacao.
          const fotoUrl = await this.storageService.uploadPoiPhoto(
            // Atualiza ou consulta estado da pagina.
            this.viagemId,
            // Atualiza ou consulta estado da pagina.
            this.diaId,
            // Executa uma instrucao necessaria para este fluxo.
            poiId,
            // Atualiza ou consulta estado da pagina.
            this.fotoPreview
          );
          // Executa uma instrucao necessaria para este fluxo.
          novoPoi.fotoUrl = fotoUrl;
        // Executa uma instrucao necessaria para este fluxo.
        } catch (error) {
          // Executa uma instrucao necessaria para este fluxo.
          console.warn('Aviso: Não foi possível fazer upload da foto para o Storage, a guardar no POI', error);

          // Cria uma variavel local para esta operacao.
          const fotoComprimida = await this.storageService.optimizeImage(this.fotoPreview, 720, 0.55);
          // Define um metodo chamado pela pagina ou por outros metodos.
          if (fotoComprimida.length <= 700_000) {
            // Executa uma instrucao necessaria para este fluxo.
            novoPoi.fotoUrl = fotoComprimida;
            // Atribui um valor a esta propriedade.
            fotoGuardadaNoPoi = true;
          // Executa uma instrucao necessaria para este fluxo.
          } else {
            // Atribui um valor a esta propriedade.
            fotoNaoGuardada = true;
          }
        }
      }

      // Cria uma variavel local para esta operacao.
      const currentUser = getAuth().currentUser;
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (currentUser) {
        // Executa uma instrucao necessaria para este fluxo.
        novoPoi.colaboradorUid = currentUser.uid;
        // Executa uma instrucao necessaria para este fluxo.
        novoPoi.colaboradorEmail = currentUser.email || undefined;
        // Executa uma instrucao necessaria para este fluxo.
        novoPoi.colaboradorNome = currentUser.displayName || undefined;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.poiService.adicionarPOI(this.viagemId, this.diaId, novoPoi);

      // Aguarda a conclusao de uma operacao assincrona.
      await loader.dismiss();

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: fotoNaoGuardada
          // Executa uma instrucao necessaria para este fluxo.
          ? 'POI adicionado, mas a foto era demasiado pesada para guardar.'
          // Executa uma instrucao necessaria para este fluxo.
          : fotoGuardadaNoPoi
            // Executa uma instrucao necessaria para este fluxo.
            ? 'POI adicionado com foto guardada.'
            // Executa uma instrucao necessaria para este fluxo.
            : 'POI adicionado com sucesso!',
        // Define um campo ou opcao de configuracao.
        duration: 1800,
        // Define um campo ou opcao de configuracao.
        color: fotoNaoGuardada ? 'warning' : 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.onDidDismiss();

      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId, 'dias', this.diaId]);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error: any) {
      // Aguarda a conclusao de uma operacao assincrona.
      await loader.dismiss();
      // Cria uma variavel local para esta operacao.
      const toast = await this.toastCtrl.create({
        // Define um campo ou opcao de configuracao.
        message: error?.message || 'Erro ao adicionar POI.',
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
  cancelar() {
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
}
