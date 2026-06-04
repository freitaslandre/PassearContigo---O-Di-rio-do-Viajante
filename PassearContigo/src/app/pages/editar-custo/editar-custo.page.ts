// app/pages/editar-custo/editar-custo.page.ts | Controlador da pagina editar custo, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CustosService } from '../../services/custos.service';
import { StringsService } from '../../services/strings.service';
import { Custo } from '../../models/viagem.model';
import { AlertController, ToastController } from '@ionic/angular';

/** Chaves das categorias de custos apresentadas no selector. */
const CATEGORIAS_DISPONIVEIS = [
  'alimentacao',
  'transporte',
  'alojamento',
  'compras',
  'cultura',
  'natureza',
  'aventura',
  'gastronomia',
  'semCategoria'
];

@Component({
  selector: 'app-editar-custo',
  templateUrl: './editar-custo.page.html',
  styleUrls: ['./editar-custo.page.scss'],
  standalone: false
})
/** Página responsável por editar ou eliminar um custo já registado. */
export class EditarCustoPage implements OnInit {
  /** Cópia editável do custo carregado. */
  custo: Custo | null = null;
  /** Cópia original usada para calcular apenas os campos alterados. */
  custoOriginal: Custo | null = null;
  /** Indica se o custo ainda está a ser carregado. */
  carregando = true;
  /** Bloqueia acções enquanto uma gravação ou eliminação está em curso. */
  salvando = false;
  /** Lista de categorias disponíveis, guardada como chaves de tradução. */
  categoriasDisponiveis = CATEGORIAS_DISPONIVEIS;
  /** Identificador do custo recebido pela rota. */
  custoId: string | null = null;

  /** Injeta serviços de rota, navegação, persistência, mensagens e strings. */
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private custosService: CustosService,
    private alertController: AlertController,
    private toastController: ToastController,
    public strings: StringsService
  ) {}

  /** Lê o identificador da rota e inicia o carregamento do custo. */
  ngOnInit(): void {
    this.custoId = this.route.snapshot.paramMap.get('id');
    if (this.custoId) {
      this.carregarCusto();
    }
  }

  /** Obtém o custo no serviço e prepara as cópias de edição e comparação. */
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
          this.mostrarErro(this.strings.get('custos.editar.mensagens.custoNaoEncontrado'));
        }
        this.carregando = false;
      },
      error: (erro) => {
        console.error(this.strings.get('custos.editar.logs.erroCarregar'), erro);
        this.mostrarErro(this.strings.get('custos.editar.mensagens.erroCarregar'));
        this.carregando = false;
      }
    });
  }

  /** Valida o formulário, calcula alterações e guarda apenas os campos modificados. */
  async salvarAlteracoes(): Promise<void> {
    if (!this.custo || !this.custoId) {
      return;
    }

    if (!this.validarFormulario()) {
      return;
    }

    this.salvando = true;

    try {
      // Compara e actualiza apenas os campos que mudaram.
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
        this.mostrarMensagem(this.strings.get('custos.editar.mensagens.semAlteracoes'));
        this.salvando = false;
        return;
      }

      await this.custosService.updateCusto(this.custoId, alteracoes);

      const toast = await this.toastController.create({
        message: this.strings.get('custos.editar.mensagens.custoAtualizado'),
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/resumo-custos']);
    } catch (erro) {
      console.error(this.strings.get('custos.editar.logs.erroGuardar'), erro);
      this.mostrarErro(this.strings.get('custos.editar.mensagens.erroGuardar'));
    } finally {
      this.salvando = false;
    }
  }

  /** Pede confirmação antes de eliminar definitivamente o custo. */
  async eliminarCusto(): Promise<void> {
    if (!this.custoId) {
      return;
    }

    const alert = await this.alertController.create({
      header: this.strings.get('custos.editar.confirmarEliminar.titulo'),
      message: this.strings.get('custos.editar.confirmarEliminar.mensagem'),
      buttons: [
        {
          text: this.strings.get('common.cancel'),
          role: 'cancel'
        },
        {
          text: this.strings.get('common.delete'),
          role: 'destructive',
          handler: async () => {
            await this.executarEliminacao();
          }
        }
      ]
    });

    await alert.present();
  }

  /** Executa a eliminação do custo depois da confirmação do utilizador. */
  private async executarEliminacao(): Promise<void> {
    if (!this.custoId) {
      return;
    }

    this.salvando = true;

    try {
      await this.custosService.deleteCusto(this.custoId);

      const toast = await this.toastController.create({
        message: this.strings.get('custos.editar.mensagens.custoEliminado'),
        duration: 2000,
        position: 'bottom',
        color: 'success'
      });
      await toast.present();

      this.router.navigate(['/resumo-custos']);
    } catch (erro) {
      console.error(this.strings.get('custos.editar.logs.erroEliminar'), erro);
      this.mostrarErro(this.strings.get('custos.editar.mensagens.erroEliminar'));
    } finally {
      this.salvando = false;
    }
  }

  /** Cancela a edição e volta ao resumo de custos. */
  cancelar(): void {
    this.router.navigate(['/resumo-custos']);
  }

  normalizarValorCusto(event: CustomEvent<{ value?: string | null }>): void {
    if (!this.custo) {
      return;
    }

    const valorNormalizado = this.normalizarDecimal(event.detail?.value);
    this.custo.valor = valorNormalizado === '' || valorNormalizado === '.'
      ? 0
      : Number(valorNormalizado);
  }

  /** Garante que os campos obrigatórios do custo estão preenchidos. */
  private validarFormulario(): boolean {
    if (!this.custo) {
      this.mostrarMensagem(this.strings.get('custos.editar.mensagens.dadosNaoCarregados'));
      return false;
    }

    if (!this.custo.descricao || this.custo.descricao.trim() === '') {
      this.mostrarMensagem(this.strings.get('custos.editar.validacao.descricaoObrigatoria'));
      return false;
    }

    if (!this.custo.valor || this.custo.valor <= 0) {
      this.mostrarMensagem(this.strings.get('custos.editar.validacao.valorMaiorZero'));
      return false;
    }

    if (!this.custo.data) {
      this.mostrarMensagem(this.strings.get('custos.editar.validacao.dataObrigatoria'));
      return false;
    }

    return true;
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

  /** Mostra um alerta simples com uma mensagem informativa. */
  private async mostrarMensagem(mensagem: string): Promise<void> {
    const alert = await this.alertController.create({
      header: this.strings.get('common.warning'),
      message: mensagem,
      buttons: [this.strings.get('common.ok')]
    });
    await alert.present();
  }

  /** Mostra uma notificação de erro no fundo do ecrã. */
  private async mostrarErro(mensagem: string): Promise<void> {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }

  /** Devolve a cor visual associada à categoria seleccionada. */
  obterCorCategoria(categoria: string | undefined): string {
    if (!categoria) {
      return 'medium';
    }

    const coresMap: Record<string, string> = {
      alimentacao: 'danger',
      transporte: 'warning',
      alojamento: 'primary',
      compras: 'secondary',
      cultura: 'tertiary',
      natureza: 'success',
      aventura: 'medium',
      gastronomia: 'warning',
      semCategoria: 'light'
    };
    return coresMap[categoria] || 'medium';
  }

  /** Formata valores monetários com vírgula decimal. */
  formatarValor(valor: number): string {
    return valor.toFixed(2).replace('.', ',');
  }

  /** Obtém o texto visível de uma categoria a partir da sua chave. */
  obterNomeCategoria(categoria: string): string {
    return this.strings.get(`custos.categorias.${categoria}`);
  }
}
