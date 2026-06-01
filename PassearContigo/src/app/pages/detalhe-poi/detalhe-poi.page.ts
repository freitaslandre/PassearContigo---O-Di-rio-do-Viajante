import { Component, OnInit, OnDestroy, HostBinding } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ViagensService } from '../../services/viagens.service';
import { POIService } from '../../services/poi.service';
import { POI, Dia } from '../../models/viagem.model';

@Component({
  selector: 'app-detalhe-poi',
  standalone: false,
  templateUrl: './detalhe-poi.page.html',
  styleUrls: ['./detalhe-poi.page.scss']
})
export class DetalhePoiPage implements OnInit, OnDestroy {
  poi: POI | null = null;
  poiEditavel: Partial<POI> = {};
  modoEdicao = false;
  viagemId: string | null = null;
  diaId: string | null = null;
  poiId: string | null = null;
  carregando = true;
  erro = '';
  fotoUrl: string | undefined = undefined;
  fotoInput: any;

  // CSS Custom Properties
  @HostBinding('style.--card-bg-color') cardBgColor = '#ffffff';
  @HostBinding('style.--card-border-color') cardBorderColor = '#e0e0e0';
  @HostBinding('style.--card-border-width') cardBorderWidth = '1px';
  @HostBinding('style.--info-card-bg') infoCardBg = '#f9f9f9';
  @HostBinding('style.--info-card-border-left') infoCardBorderLeft = '4px solid #3b82f6';

  // Notas
  novaNotaTexto = '';
  notas: { id: string; texto: string; data: Date }[] = [];

  private routeSub: Subscription | null = null;
  private poiSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService,
    private poiService: POIService,
    private alertCtrl: AlertController,
    private toastCtrl: ToastController
  ) {}

  ngOnInit() {
    this.routeSub = this.route.paramMap.subscribe(params => {
      this.diaId = params.get('diaId');
      this.poiId = params.get('poiId');

      // Obter o ID da viagem da rota pai
      if (this.route.parent) {
        this.viagemId = this.route.parent.snapshot.paramMap.get('id');
      }

      if (!this.viagemId || !this.diaId || !this.poiId) {
        this.erro = 'IDs de viagem, dia ou POI inválidos.';
        this.carregando = false;
        return;
      }

      this.carregarPoi();
    });
  }

  ngOnDestroy() {
    this.routeSub?.unsubscribe();
    this.poiSub?.unsubscribe();
  }

  private carregarPoi() {
    if (!this.viagemId || !this.diaId || !this.poiId) {
      return;
    }

    this.carregando = true;
    this.erro = '';
    this.poi = null;

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

        this.poi = poiEncontrado;
        this.fotoUrl = this.poi.fotoUrl || undefined;
        this.carregarNotas();
        this.aplicarTemaPorCategoria();
        this.carregando = false;
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
    this.fotoInput?.click();
  }

  async onFotoSelecionada(event: any) {
    const file = event.target.files[0];
    if (!file) return;

    // Converter para base64 e guardar
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      this.fotoUrl = e.target.result;

      // Guardar no Firestore
      if (this.poi && this.viagemId && this.diaId && this.poiId) {
        try {
          await this.poiService.atualizarPOI(
            this.viagemId,
            this.diaId,
            this.poiId,
            { fotoUrl: this.fotoUrl }
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

  iniciarEdicao() {
    if (!this.poi) return;
    this.poiEditavel = {
      nota: this.poi.nota || '',
      custo: this.poi.custo || undefined,
      avaliacao: this.poi.avaliacao || 0
    };
    this.modoEdicao = true;
  }

  async guardarEdicao() {
    if (!this.poi || !this.viagemId || !this.diaId || !this.poiId) {
      return;
    }

    try {
      const poiAtualizado = {
        ...this.poi,
        nota: this.poiEditavel.nota,
        custo: this.poiEditavel.custo,
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

  async eliminarPoi() {
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
    return !!(this.poi?.latitude && this.poi?.longitude);
  }

  abrirMapa() {
    if (this.temLocalizacao) {
      const mapsUrl = `https://www.google.com/maps/search/${this.poi?.latitude},${this.poi?.longitude}`;
      window.open(mapsUrl, '_blank');
    }
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

  private aplicarTemaPorCategoria() {
    if (!this.poi?.categoria) return;

    const temas: { [key: string]: { bg: string; border: string; infoBg: string; infoBorder: string } } = {
      gastronomia: {
        bg: '#fff8f0',
        border: '#ff9800',
        infoBg: '#ffe0b2',
        infoBorder: '4px solid #ff9800'
      },
      cultura: {
        bg: '#f0f4ff',
        border: '#5e35b1',
        infoBg: '#e8eaf6',
        infoBorder: '4px solid #5e35b1'
      },
      natureza: {
        bg: '#f1f8e9',
        border: '#7cb342',
        infoBg: '#dcedc8',
        infoBorder: '4px solid #7cb342'
      },
      aventura: {
        bg: '#fff3e0',
        border: '#d84315',
        infoBg: '#ffccbc',
        infoBorder: '4px solid #d84315'
      },
      compras: {
        bg: '#fce4ec',
        border: '#c2185b',
        infoBg: '#f8bbd0',
        infoBorder: '4px solid #c2185b'
      },
      hospedagem: {
        bg: '#e0f2f1',
        border: '#00796b',
        infoBg: '#b2dfdb',
        infoBorder: '4px solid #00796b'
      },
      outro: {
        bg: '#f5f5f5',
        border: '#757575',
        infoBg: '#eeeeee',
        infoBorder: '4px solid #757575'
      }
    };

    const tema = temas[this.poi.categoria] || temas['outro'];
    this.cardBgColor = tema.bg;
    this.cardBorderColor = tema.border;
    this.infoCardBg = tema.infoBg;
    this.infoCardBorderLeft = tema.infoBorder;
  }

  alterarCorCard(bg: string, border: string, infoBg: string, infoBorder: string) {
    this.cardBgColor = bg;
    this.cardBorderColor = border;
    this.infoCardBg = infoBg;
    this.infoCardBorderLeft = infoBorder;
  }

  restaurarTemaDefault() {
    this.cardBgColor = '#ffffff';
    this.cardBorderColor = '#e0e0e0';
    this.infoCardBg = '#f9f9f9';
    this.infoCardBorderLeft = '4px solid #3b82f6';
  }
}
