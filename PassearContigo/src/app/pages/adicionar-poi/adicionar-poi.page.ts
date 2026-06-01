import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { ViagensService } from '../../services/viagens.service';
import { POI } from '../../models/viagem.model';

@Component({
  standalone: false,
  selector: 'app-adicionar-poi',
  templateUrl: './adicionar-poi.page.html',
  styleUrls: ['./adicionar-poi.page.scss']
})
export class AdicionarPoiPage implements OnInit {
  poi: Partial<POI> & { latitude?: string | number; longitude?: string | number } = {
    nome: '',
    descricao: '',
    tipo: '',
    endereco: '',
    telefone: '',
    horario: '',
    url: '',
    latitude: undefined,
    longitude: undefined
  };

  viagemId: string | null = null;
  diaId: string | null = null;
  diaTitulo = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.viagemId = this.route.snapshot.paramMap.get('id');
    this.diaId = this.route.snapshot.paramMap.get('diaId');
    this.carregarDiaTitulo();
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
      const viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);
      if (!viagem || !viagem.dias) {
        throw new Error('Viagem ou dia não encontrado.');
      }

      const dia = viagem.dias.find(d => d.id === this.diaId);
      if (!dia) {
        throw new Error('Dia não encontrado.');
      }

      const novoPoi: POI = {
        id: `poi-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nome: this.poi.nome.trim(),
        descricao: this.poi.descricao?.trim() || undefined,
        tipo: this.poi.tipo?.trim() || undefined,
        endereco: this.poi.endereco?.trim() || undefined,
        telefone: this.poi.telefone?.trim() || undefined,
        horario: this.poi.horario?.trim() || undefined,
        url: this.poi.url?.trim() || undefined
      };

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

      const diasAtualizados = viagem.dias.map(d => {
        if (d.id !== this.diaId) {
          return d;
        }

        return {
          ...d,
          pontosInteresse: [...(d.pontosInteresse || []), novoPoi]
        };
      });

      await this.viagensService.updateViagem(this.viagemId, { dias: diasAtualizados });
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
