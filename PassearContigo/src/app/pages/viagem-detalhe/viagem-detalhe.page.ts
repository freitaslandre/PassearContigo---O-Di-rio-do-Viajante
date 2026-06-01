import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, NavController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { Dia, POI, Viagem } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';
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
  erro = '';
  fotosPoiAEnviar: Record<string, boolean> = {};
  localizacaoPoiAObter: Record<string, boolean> = {};

  titulo = '';
  descricao = '';
  local = '';
  dataInicio = '';
  dataFim = '';
  status: Viagem['status'] = 'planejada';

  private routeSub: Subscription | null = null;
  private viagemSub: Subscription | null = null;
  private tentouObterGpsInicial = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
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
        this.erro = 'ID de viagem invalido.';
        this.carregando = false;
        return;
      }

      this.viagemId = id;
      this.carregarViagem(id);
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.viagemSub?.unsubscribe();
  }

  voltar() {
    this.router.navigate(['/tabs', 'viagens']);
  }

  irParaDia(diaId: string) {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'dias', diaId]);
  }

  editarViagem() {
    if (!this.viagem) return;
    this.router.navigate(['/tabs', 'viagens', this.viagem.id, 'editar']);
  }

  async confirmarEliminarViagem() {
    if (!this.viagem || this.eliminando) return;

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

  adicionarDia() {
    const ultimaData = this.dias.length > 0
      ? this.dias[this.dias.length - 1].data
      : this.dataInicio;
    const novaData = this.adicionarUmDia(ultimaData || this.dataInicio);
    const numeroDia = this.dias.length + 1;

    this.dias.push({
      id: `dia-${novaData || Date.now()}`,
      titulo: `Dia ${numeroDia}`,
      data: novaData,
      local: '',
      descricao: '',
      observacoes: '',
      pontosInteresse: [],
      custos: []
    });
  }

  removerDia(index: number) {
    this.dias.splice(index, 1);
  }

  async guardar() {
    if (!this.viagem) return;

    if (!this.titulo.trim() || !this.local.trim() || !this.dataInicio || !this.dataFim) {
      await this.mostrarToast('Preencha titulo, destino e datas da viagem.', 'warning');
      return;
    }

    if (new Date(this.dataFim) < new Date(this.dataInicio)) {
      await this.mostrarToast('A data de fim nao pode ser anterior a data de inicio.', 'warning');
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
        return 'Planejada';
      case 'em-andamento':
        return 'Em Andamento';
      case 'concluida':
        return 'Concluida';
      case 'cancelada':
        return 'Cancelada';
      default:
        return 'Sem Status';
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
      await this.mostrarToast('Nao foi possivel capturar a foto.', 'warning');
      return;
    }

    await this.guardarFotoPoi(dia, poi, foto);
  }

  async escolherFotoPoiDaGaleria(dia: DiaViewModel, poi: POI) {
    const foto = await this.cameraService.selectPictureFromGallery();
    if (!foto) {
      await this.mostrarToast('Nao foi possivel selecionar a foto.', 'warning');
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
        await this.mostrarToast('Nao foi possivel obter a localizacao.', 'warning');
        return;
      }

      poi.latitude = position.coords.latitude;
      poi.longitude = position.coords.longitude;
      poi.endereco = await this.obterEnderecoPorReverseGeocoding(poi.latitude, poi.longitude, poi.endereco);

      await this.persistirDias();
      await this.mostrarToast('Localizacao associada ao POI.', 'success');
    } catch (error: any) {
      console.error('Erro ao obter localizacao do POI:', error);
      await this.mostrarToast(error?.message || 'Erro ao obter localizacao.', 'danger');
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

  private carregarViagem(id: string) {
    this.carregando = true;
    this.erro = '';
    this.viagem = null;
    this.dias = [];

    this.viagemSub?.unsubscribe();
    this.viagemSub = this.viagensService.getViagemById(id).subscribe({
      next: (viagem) => {
        this.viagem = viagem ?? null;
        this.carregando = false;

        if (!viagem) {
          this.erro = 'Viagem nao encontrada ou nao pertence ao utilizador.';
          return;
        }

        this.preencherFormulario(viagem);
      },
      error: (err) => {
        this.carregando = false;
        this.erro = err?.message || 'Erro ao carregar viagem.';
        console.error('Erro ao carregar viagem:', err);
      }
    });
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

      this.dias.forEach(dia => {
        dia.pontosInteresse.forEach(poi => {
          if (!this.temCoordenadas(poi)) {
            poi.latitude = position.coords.latitude;
            poi.longitude = position.coords.longitude;
          }
        });
      });

      await this.preencherEnderecoDosPoisSemEndereco(position.coords.latitude, position.coords.longitude);
    } catch (error) {
      console.warn('Nao foi possivel obter coordenadas GPS ao abrir o formulario de POI:', error);
    }
  }

  private async preencherEnderecoDosPoisSemEndereco(latitude: number, longitude: number) {
    const temPoiSemEndereco = this.dias.some(dia =>
      dia.pontosInteresse.some(poi => !poi.endereco?.trim())
    );

    if (!temPoiSemEndereco) {
      return;
    }

    const endereco = await this.obterEnderecoPorReverseGeocoding(latitude, longitude);

    if (!endereco) {
      return;
    }

    this.dias.forEach(dia => {
      dia.pontosInteresse.forEach(poi => {
        if (!poi.endereco?.trim()) {
          poi.endereco = endereco;
        }
      });
    });
  }

  private async obterEnderecoPorReverseGeocoding(latitude: number, longitude: number, enderecoAtual = ''): Promise<string> {
    if (enderecoAtual.trim()) {
      return enderecoAtual;
    }

    try {
      return await this.nominatimService.obterEnderecoPorCoordenadas(latitude, longitude);
    } catch (error) {
      console.warn('Reverse geocoding Nominatim falhou:', error);
      return '';
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
      fotoUrl: poi.fotoUrl || ''
    };

    if (typeof poi.latitude === 'number') {
      poiPayload.latitude = poi.latitude;
    }

    if (typeof poi.longitude === 'number') {
      poiPayload.longitude = poi.longitude;
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
