import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Unsubscribe } from 'firebase/firestore';
import { Dia, POI, Viagem, VisibilidadePublicacao } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';
import { PublicacoesService } from '../../services/publicacoes.service';
import { CameraService } from '../../services/camera.service';
import { FirebaseStorageService } from '../../services/firebase-storage.service';
import { GeolocationService } from '../../services/geolocation.service';
import { NominatimService } from '../../services/nominatim.service';

interface DiaViewModel {
  id: string;
  titulo: string;
  data: string;
  local: string;
  descricao: string;
  observacoes: string;
  pontosInteresse: POI[];
  custos: Dia['custos'];
}

@Component({
  selector: 'app-viagem-detalhe',
  standalone: false,
  templateUrl: 'viagem-detalhe.page.html',
  styleUrls: ['viagem-detalhe.page.scss']
})
export class ViagemDetalhePage implements OnInit, OnDestroy {
  viagemId = '';
  viagem: Viagem | null = null;
  dias: DiaViewModel[] = [];
  carregando = true;
  guardando = false;
  eliminando = false;
  publicando = false;
  erro = '';
  fotosPoiAEnviar: Record<string, boolean> = {};
  localizacaoPoiAObter: Record<string, boolean> = {};
  diaExpandidoId: string | null = null;

  titulo = '';
  descricao = '';
  local = '';
  dataInicio = '';
  dataFim = '';
  status: Viagem['status'] = 'planejada';
  visibilidadePublicacao: VisibilidadePublicacao = 'privada';
  textoPublicacao = '';

  private routeSub: Subscription | null = null;
  private viagemSub: Unsubscribe | null = null;
  private tentouObterGpsInicial = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private publicacoesService: PublicacoesService,
    private cameraService: CameraService,
    private firebaseStorageService: FirebaseStorageService,
    private geolocationService: GeolocationService,
    private nominatimService: NominatimService,
    private alertCtrl: AlertController,
    private navCtrl: NavController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      const id = params.get('id') || this.obterParametroDaRota('id');
      if (!id) {
        this.erro = 'ID de viagem inválido.';
        this.carregando = false;
        return;
      }

      this.viagemId = id;
      this.carregarViagem(id);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.();
  }

  voltar() {
    this.router.navigate(['/tabs', 'viagens']);
  }

  irParaDia(diaId: string) {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId]);
  }

  irParaItinerarioDia(diaId: string) {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId, 'itinerario']);
  }

  editarViagem() {
    if (!this.viagem || !this.podeEditarViagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'editar']);
  }

  abrirDiario() {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'diario']);
  }

  abrirAlbum() {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'album']);
  }

  abrirColaboradores() {
    if (!this.viagem || !this.podeGerirViagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'colaboradores']);
  }

  async publicarViagem() {
    if (!this.viagem || this.publicando || !this.podeGerirViagem) return;

    if (!this.titulo.trim() || !this.local.trim() || !this.dataInicio || !this.dataFim) {
      await this.mostrarToast('Preencha título, destino e datas antes de publicar.', 'warning');
      return;
    }

    if (new Date(this.dataFim) < new Date(this.dataInicio)) {
      await this.mostrarToast('A data de fim não pode ser anterior à data de início.', 'warning');
      return;
    }

    this.publicando = true;

    try {
      const viagemAtualizada: Viagem = {
        ...this.viagem,
        titulo: this.titulo.trim() || this.viagem.titulo,
        descricao: this.descricao.trim(),
        local: this.local.trim(),
        dataInicio: new Date(this.dataInicio),
        dataFim: new Date(this.dataFim),
        status: this.status,
        dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
      };
      const texto = this.textoPublicacao.trim() || this.descricao.trim();
      const publicacaoId = await this.publicacoesService.publicarViagem(viagemAtualizada, texto, 'publica');

      await this.viagensService.updateViagem(this.viagem.id, {
        publicada: true,
        publicacaoId,
        visibilidadePublicacao: 'publica',
        textoPublicacao: texto
      });

      await this.mostrarToast('Viagem publicada no feed público.', 'success');
    } catch (error: any) {
      console.error('Erro ao publicar viagem:', error);
      await this.mostrarToast(error?.message || 'Erro ao publicar viagem.', 'danger');
    } finally {
      this.publicando = false;
    }
  }

  async removerDoFeed() {
    if (!this.viagem || this.publicando || !this.podeGerirViagem) return;

    this.publicando = true;

    try {
      const texto = this.textoPublicacao.trim() || this.descricao.trim();
      await this.publicacoesService.despublicarViagem(this.viagem.id);
      await this.viagensService.updateViagem(this.viagem.id, {
        publicada: false,
        publicacaoId: null as any,
        visibilidadePublicacao: 'privada',
        textoPublicacao: texto
      });

      this.visibilidadePublicacao = 'privada';
      await this.mostrarToast('Viagem removida do feed.', 'success');
    } catch (error: any) {
      console.error('Erro ao remover viagem do feed:', error);
      await this.mostrarToast(error?.message || 'Erro ao remover viagem do feed.', 'danger');
    } finally {
      this.publicando = false;
    }
  }

  async confirmarEliminarViagem() {
    if (!this.viagem || this.eliminando || !this.podeGerirViagem) return;

    const alert = await this.alertCtrl.create({
      header: 'Eliminar viagem',
      message: `Tem a certeza que pretende eliminar "${this.titulo || this.viagem.titulo}"? Esta ação não pode ser anulada.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => {
            this.eliminarViagem();
          }
        }
      ]
    });

    await alert.present();
  }

  async adicionarDia() {
    if (!this.podeEditarViagem || this.guardando) return;

    const ultimaData = this.dias.length > 0
      ? this.dias[this.dias.length - 1].data
      : this.dataInicio;
    const novaData = this.adicionarUmDia(ultimaData || this.dataInicio);
    const numeroDia = this.dias.length + 1;

    const novoDia: DiaViewModel = {
      id: `dia-${novaData || Date.now()}`,
      titulo: `Dia ${numeroDia}`,
      data: novaData,
      local: '',
      descricao: '',
      observacoes: '',
      pontosInteresse: [],
      custos: []
    };

    this.dias.push(novoDia);
    this.diaExpandidoId = novoDia.id;

    this.guardando = true;

    try {
      await this.persistirDias();
      await this.mostrarToast('Dia adicionado à viagem.', 'success');
    } catch (error: any) {
      this.dias = this.dias.filter(dia => dia.id !== novoDia.id);
      this.diaExpandidoId = null;
      console.error('Erro ao adicionar dia:', error);
      await this.mostrarToast(error?.message || 'Erro ao adicionar dia.', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  async removerDia(index: number) {
    if (!this.podeEditarViagem || this.guardando) return;

    const diaRemovido = this.dias[index];
    const diasAntes = [...this.dias];
    const diaExpandidoAntes = this.diaExpandidoId;

    if (!diaRemovido) {
      return;
    }

    this.dias.splice(index, 1);

    if (diaRemovido?.id === this.diaExpandidoId) {
      this.diaExpandidoId = null;
    }

    this.guardando = true;

    try {
      await this.persistirDias();
      await this.mostrarToast('Dia removido da viagem.', 'success');
    } catch (error: any) {
      this.dias = diasAntes;
      this.diaExpandidoId = diaExpandidoAntes;
      console.error('Erro ao remover dia:', error);
      await this.mostrarToast(error?.message || 'Erro ao remover dia.', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  async confirmarRemoverDia(index: number) {
    if (!this.podeEditarViagem) return;

    const dia = this.dias[index];
    if (!dia) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Eliminar dia',
      message: `Tem a certeza que pretende eliminar "${dia.titulo || `Dia ${index + 1}`}"? Os POIs deste dia também serão removidos.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Eliminar',
          role: 'destructive',
          handler: () => this.removerDia(index)
        }
      ]
    });

    await alert.present();
  }

  alternarDiaExpandido(diaId: string) {
    this.diaExpandidoId = this.diaExpandidoId === diaId ? null : diaId;
  }

  diaEstaExpandido(dia: DiaViewModel): boolean {
    return this.diaExpandidoId === dia.id;
  }

  trackByDiaId(_index: number, dia: DiaViewModel): string {
    return dia.id;
  }

  obterCustoDia(dia: DiaViewModel): number {
    if (!dia.pontosInteresse) {
      return 0;
    }
    return dia.pontosInteresse.reduce((total, poi) => total + (poi.custo || 0), 0);
  }

  async guardar() {
    if (!this.viagem || !this.podeEditarViagem) return;

    if (!this.titulo.trim() || !this.local.trim() || !this.dataInicio || !this.dataFim) {
      await this.mostrarToast('Preencha título, destino e datas da viagem.', 'warning');
      return;
    }

    if (new Date(this.dataFim) < new Date(this.dataInicio)) {
      await this.mostrarToast('A data de fim não pode ser anterior à data de início.', 'warning');
      return;
    }

    this.guardando = true;

    try {
      await this.viagensService.updateViagem(this.viagem.id, {
        titulo: this.titulo.trim(),
        descricao: this.descricao.trim(),
        local: this.local.trim(),
        dataInicio: new Date(this.dataInicio),
        dataFim: new Date(this.dataFim),
        status: this.status,
        dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
      });

      await this.mostrarToast('Viagem guardada com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao guardar detalhes:', error);
      await this.mostrarToast(error?.message || 'Erro ao guardar .', 'danger');
    } finally {
      this.guardando = false;
    }
  }

  private async eliminarViagem() {
    if (!this.viagem) return;

    this.eliminando = true;

    try {
      await this.viagensService.deleteViagem(this.viagem.id);
      await this.mostrarToast('Viagem eliminada com sucesso.', 'success');
      this.navCtrl.navigateRoot('/tabs/viagens');
    } catch (error: any) {
      console.error('Erro ao eliminar viagem:', error);
      await this.mostrarToast(error?.message || 'Erro ao eliminar viagem.', 'danger');
    } finally {
      this.eliminando = false;
    }
  }

  formatarData(data: Date | string | any): string {
    const date = this.converterParaDate(data);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('pt-PT');
  }

  obterNumDias(dataInicio: Date | string | any, dataFim: Date | string | any): number {
    const inicio = this.converterParaDate(dataInicio);
    const fim = this.converterParaDate(dataFim);
    const differenceMs = fim.getTime() - inicio.getTime();
    return Math.floor(differenceMs / (1000 * 60 * 60 * 24)) + 1;
  }

  obterCorStatus(status?: string): string {
    switch (status) {
      case 'planejada':
        return 'primary';
      case 'em-andamento':
        return 'warning';
      case 'concluida':
        return 'success';
      case 'cancelada':
        return 'danger';
      default:
        return 'medium';
    }
  }

  obterTextoStatus(status?: string): string {
    switch (status) {
      case 'planejada':
        return 'Planeada';
      case 'em-andamento':
        return 'Em curso';
      case 'concluida':
        return 'Concluída';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Sem estado';
    }
  }

  obterResumoCustos(dia: DiaViewModel): string {
    if (!dia.custos || dia.custos.length === 0) return 'Sem custos';
    const total = dia.custos.reduce((soma, custo) => soma + (custo.valor || 0), 0);
    return `${total.toFixed(2)} ${dia.custos[0].moeda || 'EUR'}`;
  }

  obterFotoPoi(poi: POI): string {
    return poi.fotoUrl || 'assets/icon/favicon.png';
  }

  fotoPoiAEnviar(diaId: string, poi: POI): boolean {
    return !!this.fotosPoiAEnviar[this.obterChaveFotoPoi(diaId, poi)];
  }

  localizacaoPoiAEnviar(diaId: string, poi: POI): boolean {
    return !!this.localizacaoPoiAObter[this.obterChaveFotoPoi(diaId, poi)];
  }

  async tirarFotoPoi(dia: DiaViewModel, poi: POI) {
    const foto = await this.cameraService.takePicture();
    if (!foto) {
      await this.mostrarToast('Não foi possível capturar a foto.', 'warning');
      return;
    }

    await this.guardarFotoPoi(dia, poi, foto);
  }

  async escolherFotoPoiDaGaleria(dia: DiaViewModel, poi: POI) {
    const foto = await this.cameraService.selectPictureFromGallery();
    if (!foto) {
      await this.mostrarToast('Não foi possível selecionar a foto.', 'warning');
      return;
    }

    await this.guardarFotoPoi(dia, poi, foto);
  }

  async usarLocalizacaoAtualNoPoi(dia: DiaViewModel, poi: POI) {
    poi.id = poi.id || this.gerarIdPoi();
    const chave = this.obterChaveFotoPoi(dia.id, poi);
    this.localizacaoPoiAObter[chave] = true;

    try {
      const position = await this.geolocationService.getCurrentPosition();

      if (!position) {
        await this.mostrarToast('Não foi possível obter a localização.', 'warning');
        return;
      }

      poi.latitude = position.coords.latitude;
      poi.longitude = position.coords.longitude;
      await this.aplicarSugestoesNominatimAoPoi(poi);

      await this.persistirDias();
      await this.mostrarToast('Localização associada ao POI.', 'success');
    } catch (error: any) {
      console.error('Erro ao obter localização do POI:', error);
      await this.mostrarToast(error?.message || 'Erro ao obter localização.', 'danger');
    } finally {
      delete this.localizacaoPoiAObter[chave];
    }
  }

  formatarCoordenada(valor?: number): string {
    return typeof valor === 'number' ? valor.toFixed(6) : '';
  }

  temCoordenadas(poi: POI): boolean {
    return typeof poi.latitude === 'number' && typeof poi.longitude === 'number';
  }

  get totalPois(): number {
    return this.dias.reduce((total, dia) => total + dia.pontosInteresse.length, 0);
  }

  get totalDias(): number {
    return this.dias.length;
  }

  get podeEditarViagem(): boolean {
    return this.viagensService.podeEditarViagemAtual(this.viagem);
  }

  get podeGerirViagem(): boolean {
    return this.viagensService.podeGerirViagemAtual(this.viagem);
  }

  private carregarViagem(id: string) {
    this.carregando = true;
    this.erro = '';
    this.viagem = null;
    this.dias = [];

    this.viagemSub?.();
    this.viagemSub = this.viagensService.subscribeToViagemById(
      id,
      (viagem) => {
        this.viagem = viagem ?? null;
        this.carregando = false;

        if (!viagem) {
          this.erro = 'Viagem não encontrada ou não pertence ao utilizador.';
          return;
        }

        this.preencherFormulario(viagem);
      },
      (err) => {
        this.carregando = false;
        this.erro = err?.message || 'Erro ao carregar viagem.';
        console.error('Erro ao carregar viagem:', err);
      }
    );
  }

  private async guardarFotoPoi(dia: DiaViewModel, poi: POI, dataUrl: string) {
    if (!this.viagem) return;

    poi.id = poi.id || this.gerarIdPoi();
    const chave = this.obterChaveFotoPoi(dia.id, poi);
    this.fotosPoiAEnviar[chave] = true;

    try {
      const downloadUrl = await this.firebaseStorageService.uploadPoiPhoto(this.viagem.id, dia.id, poi.id, dataUrl);
      poi.fotoUrl = downloadUrl;

      await this.persistirDias();
      await this.mostrarToast('Foto do POI guardada com sucesso.', 'success');
    } catch (error: any) {
      console.error('Erro ao guardar foto do POI:', error);
      await this.mostrarToast(error?.message || 'Erro ao guardar foto do POI.', 'danger');
    } finally {
      delete this.fotosPoiAEnviar[chave];
    }
  }

  private async persistirDias() {
    if (!this.viagem) return;

    await this.viagensService.updateViagem(this.viagem.id, {
      dias: this.dias.map((dia, index) => this.converterDiaParaModel(dia, index))
    });
  }

  private async obterCoordenadasGpsAoAbrirFormularioPoi() {
    if (this.tentouObterGpsInicial || !this.temPoisSemCoordenadas()) {
      return;
    }

    this.tentouObterGpsInicial = true;

    try {
      const position = await this.geolocationService.getCurrentPosition();

      if (!position) {
        return;
      }

      let alterouPois = false;

      this.dias.forEach(dia => {
        dia.pontosInteresse.forEach(poi => {
          if (!this.temCoordenadas(poi)) {
            poi.latitude = position.coords.latitude;
            poi.longitude = position.coords.longitude;
            alterouPois = true;
          }
        });
      });

      const alterouSugestoes = await this.preencherDadosDosPoisComSugestaoNominatim(
        position.coords.latitude,
        position.coords.longitude
      );

      if (alterouPois || alterouSugestoes) {
        await this.persistirDias();
      }
    } catch (error) {
      console.warn('Não foi possível obter coordenadas GPS ao abrir o formulario de POI:', error);
    }
  }

  private async preencherDadosDosPoisComSugestaoNominatim(latitude: number, longitude: number): Promise<boolean> {
    const temPoiSemDados = this.dias.some(dia =>
      dia.pontosInteresse.some(poi => !poi.endereco?.trim() || !poi.nome?.trim())
    );

    if (!temPoiSemDados) {
      return false;
    }

    const sugestoes = await this.obterSugestoesPorReverseGeocoding(latitude, longitude);

    if (!sugestoes) {
      return false;
    }

    let alterouPois = false;

    this.dias.forEach(dia => {
      dia.pontosInteresse.forEach(poi => {
        if (!poi.nome?.trim() && sugestoes.nomeSugerido) {
          poi.nome = sugestoes.nomeSugerido;
          alterouPois = true;
        }

        if (!poi.endereco?.trim() && sugestoes.endereco) {
          poi.endereco = sugestoes.endereco;
          alterouPois = true;
        }
      });
    });

    return alterouPois;
  }

  private async aplicarSugestoesNominatimAoPoi(poi: POI) {
    if (!this.temCoordenadas(poi)) {
      return;
    }

    const sugestoes = await this.obterSugestoesPorReverseGeocoding(poi.latitude!, poi.longitude!);

    if (!sugestoes) {
      return;
    }

    if (!poi.nome?.trim() && sugestoes.nomeSugerido) {
      poi.nome = sugestoes.nomeSugerido;
    }

    if (!poi.endereco?.trim() && sugestoes.endereco) {
      poi.endereco = sugestoes.endereco;
    }
  }

  private async obterSugestoesPorReverseGeocoding(latitude: number, longitude: number) {
    try {
      return await this.nominatimService.obterDetalhesPorCoordenadas(latitude, longitude);
    } catch (error) {
      console.warn('Reverse geocoding Nominatim falhou:', error);
      return null;
    }
  }

  private temPoisSemCoordenadas(): boolean {
    return this.dias.some(dia =>
      dia.pontosInteresse.some(poi => !this.temCoordenadas(poi))
    );
  }

  private preencherFormulario(viagem: Viagem) {
    this.titulo = viagem.titulo;
    this.descricao = viagem.descricao || '';
    this.local = viagem.local || '';
    this.dataInicio = this.formatarDataInput(viagem.dataInicio);
    this.dataFim = this.formatarDataInput(viagem.dataFim);
    this.status = viagem.status || 'planejada';
    this.visibilidadePublicacao = viagem.visibilidadePublicacao || (viagem.publicada ? 'publica' : 'privada');
    this.textoPublicacao = viagem.textoPublicacao || viagem.descricao || '';
    this.dias = (viagem.dias || []).map((dia, index) => ({
      id: dia.id || `dia-${index + 1}`,
      titulo: dia.titulo || `Dia ${index + 1}`,
      data: this.formatarDataInput(dia.data),
      local: dia.local || '',
      descricao: dia.descricao || '',
      observacoes: dia.observacoes || '',
      pontosInteresse: dia.pontosInteresse || [],
      custos: dia.custos || []
    }));

    this.obterCoordenadasGpsAoAbrirFormularioPoi();
  }

  private converterDiaParaModel(dia: DiaViewModel, index: number): Dia {
    return {
      id: dia.id || `dia-${index + 1}`,
      titulo: dia.titulo.trim() || `Dia ${index + 1}`,
      data: new Date(dia.data || this.dataInicio),
      local: dia.local.trim(),
      descricao: dia.descricao.trim(),
      observacoes: dia.observacoes.trim(),
      pontosInteresse: dia.pontosInteresse.map(poi => this.converterPoiParaModel(poi)),
      custos: dia.custos || []
    };
  }

  private converterPoiParaModel(poi: POI): POI {
    const poiPayload: POI = {
      id: poi.id,
      nome: poi.nome || '',
      descricao: poi.descricao || '',
      tipo: poi.tipo || '',
      endereco: poi.endereco || '',
      telefone: poi.telefone || '',
      horario: poi.horario || '',
      url: poi.url || '',
      fotoUrl: poi.fotoUrl || '',
      nota: poi.nota || '',
      categoria: poi.categoria || ''
    };

    if (typeof poi.latitude === 'number') {
      poiPayload.latitude = poi.latitude;
    }

    if (typeof poi.longitude === 'number') {
      poiPayload.longitude = poi.longitude;
    }

    if (typeof poi.custo === 'number') {
      poiPayload.custo = poi.custo;
    }

    if (typeof poi.avaliacao === 'number') {
      poiPayload.avaliacao = poi.avaliacao;
    }

    if (typeof poi.ordem === 'number') {
      poiPayload.ordem = poi.ordem;
    }

    return poiPayload;
  }

  private converterParaDate(data: Date | string | any): Date {
    if (data instanceof Date) {
      return data;
    }
    if (typeof data === 'string') {
      return new Date(data);
    }
    if (data && typeof data === 'object' && 'toDate' in data) {
      return (data as any).toDate();
    }
    return new Date(data);
  }

  private formatarDataInput(data: Date | string | any): string {
    const date = this.converterParaDate(data);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    const ano = date.getFullYear();
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const dia = String(date.getDate()).padStart(2, '0');

    return `${ano}-${mes}-${dia}`;
  }

  private adicionarUmDia(data: string): string {
    if (!data) {
      return this.formatarDataInput(new Date());
    }

    const date = new Date(data);
    date.setDate(date.getDate() + 1);
    return this.formatarDataInput(date);
  }

  private obterChaveFotoPoi(diaId: string, poi: POI): string {
    return `${diaId}-${poi.id || poi.nome || 'poi'}`;
  }

  private gerarIdPoi(): string {
    return `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  private async mostrarToast(message: string, color: 'success' | 'warning' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color
    });
    await toast.present();
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
}
