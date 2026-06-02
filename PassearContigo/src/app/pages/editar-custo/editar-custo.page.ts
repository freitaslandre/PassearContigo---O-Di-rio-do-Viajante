import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CustosService } from '../../services/custos.service';
import { Custo } from '../../models/viagem.model';
import { AlertController, ToastController, LoadingController } from '@ionic/angular';

const CATEGORIAS_DISPONIVEIS = [
  'Alimentação',
  'Transporte',
  'Hospedagem',
  'Compras',
  'Cultura',
  'Natureza',
  'Aventura',
  'Gastronomia',
  'Sem categoria'
];

@Component({
  selector: 'app-editar-custo',
  standalone: true,
  templateUrl: './editar-custo.page.html',
  styleUrls: ['./editar-custo.page.scss'],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule]
})
export class EditarCustoPage implements OnInit {
  custo: Custo | null = null;
  custoOriginal: Custo | null = null;
  carregando = true;
  salvando = false;
  categoriasDisponiveis = CATEGORIAS_DISPONIVEIS;
  custoId: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private custosService: CustosService,
    private alertController: AlertController,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit(): void {
    this.custoId = this.route.snapshot.paramMap.get('id');
    if (this.custoId) {
      this.carregarCusto();
    }
  }

  private carregarCusto(): void {
    if (!this.custoId) {
      this.carregando = false;
      return;
    }

    this.custosService.getCustoById(this.custoId).subscribe({
      next: (custo) => {
        if (custo) {
          this.custo = { ...custo };
          this.custoOriginal = { ...custo };
        } else {
          this.mostrarErro('Custo não encontrado');
        }
        this.carregando = false;
      },
      error: (erro) => {
        console.error('Erro ao carregar custo:', erro);
        this.mostrarErro('Erro ao carregar custo');
        this.carregando = false;
      }
    });
  }

  async salvarAlteracoes(): Promise<void> {
    if (!this.custo || !this.custoId) {
      return;
    }

    if (!this.validarFormulario()) {
      return;
    }

    this.salvando = true;

    try {
      // Comparar e atualizar apenas os campos que mudaram
      const alteracoes: Partial<Custo> = {};
      if (this.custo.descricao !== this.custoOriginal?.descricao) {
        alteracoes.descricao = this.custo.descricao;
      }
      if (this.custo.valor !== this.custoOriginal?.valor) {
        alteracoes.valor = this.custo.valor;
      }
      if (this.custo.categoria !== this.custoOriginal?.categoria) {
        alteracoes.categoria = this.custo.categoria;
      }
      if (this.custo.data !== this.custoOriginal?.data) {
        alteracoes.data = this.custo.data;
      }

      if (Object.keys(alteracoes).length === 0) {
        this.mostrarMensagem('Nenhuma alteração foi feita');
        this.salvando = false;
        return;
      }

      await this.custosService.updateCusto(this.custoId, alteracoes);

      const toast = await this.toastController.create({
        message: 'Custo atualizado com sucesso',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/resumo-custos']);
    } catch (erro) {
      console.error('Erro ao guardar custo:', erro);
      this.mostrarErro('Erro ao guardar alterações');
    } finally {
      this.salvando = false;
    }
  }

  async deletarCusto(): Promise<void> {
    if (!this.custoId) {
      return;
    }

    const alert = await this.alertController.create({
      header: 'Confirmar Exclusão',
      message: 'Tem certeza que deseja deletar este custo? Esta ação não pode ser desfeita.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Deletar',
          role: 'destructive',
          handler: async () => {
            await this.executarDelecao();
          }
        }
      ]
    });

    await alert.present();
  }

  private async executarDelecao(): Promise<void> {
    if (!this.custoId) {
      return;
    }

    this.salvando = true;

    try {
      await this.custosService.deleteCusto(this.custoId);

      const toast = await this.toastController.create({
        message: 'Custo deletado com sucesso',
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/resumo-custos']);
    } catch (erro) {
      console.error('Erro ao deletar custo:', erro);
      this.mostrarErro('Erro ao deletar custo');
    } finally {
      this.salvando = false;
    }
  }

  cancelar(): void {
    this.router.navigate(['/resumo-custos']);
  }

  private validarFormulario(): boolean {
    if (!this.custo) {
      this.mostrarMensagem('Dados do custo não carregados');
      return false;
    }

    if (!this.custo.descricao || this.custo.descricao.trim() === '') {
      this.mostrarMensagem('Descrição é obrigatória');
      return false;
    }

    if (!this.custo.valor || this.custo.valor <= 0) {
      this.mostrarMensagem('Valor deve ser maior que zero');
      return false;
    }

    if (!this.custo.data) {
      this.mostrarMensagem('Data é obrigatória');
      return false;
    }

    return true;
  }

  private async mostrarMensagem(mensagem: string): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Atenção',
      message: mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  private async mostrarErro(mensagem: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  obterCorCategoria(categoria: string | undefined): string {
    if (!categoria) {
      return 'medium';
    }

    const coresMap: Record<string, string> = {
      'Alimentação': 'danger',
      'Transporte': 'warning',
      'Hospedagem': 'primary',
      'Compras': 'secondary',
      'Cultura': 'tertiary',
      'Natureza': 'success',
      'Aventura': 'medium',
      'Gastronomia': 'warning',
      'Sem categoria': 'light'
    };
    return coresMap[categoria] || 'medium';
  }

  formatarValor(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }
}
