// app/pages/editar-custo/editar-custo.page.ts | Controlador da pagina editar custo, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import { CustosService } from '../../services/custos.service';
// Importa dependencias usadas neste ficheiro.
import { StringsService } from '../../services/strings.service';
// Importa dependencias usadas neste ficheiro.
import { Custo } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { AlertController, ToastController } from '@ionic/angular';

/** Chaves das categorias de custos apresentadas no selector. */
const CATEGORIAS_DISPONIVEIS = [
  // Executa uma instrucao necessaria para este fluxo.
  'alimentacao',
  // Executa uma instrucao necessaria para este fluxo.
  'transporte',
  // Executa uma instrucao necessaria para este fluxo.
  'alojamento',
  // Executa uma instrucao necessaria para este fluxo.
  'compras',
  // Executa uma instrucao necessaria para este fluxo.
  'cultura',
  // Executa uma instrucao necessaria para este fluxo.
  'natureza',
  // Executa uma instrucao necessaria para este fluxo.
  'aventura',
  // Executa uma instrucao necessaria para este fluxo.
  'gastronomia',
  // Executa uma instrucao necessaria para este fluxo.
  'semCategoria'
];

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-editar-custo',
  // Define um campo ou opcao de configuracao.
  templateUrl: './editar-custo.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./editar-custo.page.scss'],
  // Define um campo ou opcao de configuracao.
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
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private custosService: CustosService,
    // Define um membro interno desta classe.
    private alertController: AlertController,
    // Define um membro interno desta classe.
    private toastController: ToastController,
    // Define um membro interno desta classe.
    public strings: StringsService
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  /** Lê o identificador da rota e inicia o carregamento do custo. */
  ngOnInit(): void {
    // Atualiza ou consulta estado da pagina.
    this.custoId = this.route.snapshot.paramMap.get('id');
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.custoId) {
      // Atualiza ou consulta estado da pagina.
      this.carregarCusto();
    }
  }

  /** Obtém o custo no serviço e prepara as cópias de edição e comparação. */
  private carregarCusto(): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custoId) {
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.custosService.getCustoById(this.custoId).subscribe({
      // Define um campo ou opcao de configuracao.
      next: (custo) => {
        // Define um metodo chamado pela pagina ou por outros metodos.
        if (custo) {
          // Atualiza ou consulta estado da pagina.
          this.custo = { ...custo };
          // Atualiza ou consulta estado da pagina.
          this.custoOriginal = { ...custo };
        // Executa uma instrucao necessaria para este fluxo.
        } else {
          // Atualiza ou consulta estado da pagina.
          this.mostrarErro(this.strings.get('custos.editar.mensagens.custoNaoEncontrado'));
        }
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      },
      // Define um campo ou opcao de configuracao.
      error: (erro) => {
        // Executa uma instrucao necessaria para este fluxo.
        console.error(this.strings.get('custos.editar.logs.erroCarregar'), erro);
        // Atualiza ou consulta estado da pagina.
        this.mostrarErro(this.strings.get('custos.editar.mensagens.erroCarregar'));
        // Atualiza ou consulta estado da pagina.
        this.carregando = false;
      }
    });
  }

  /** Valida o formulário, calcula alterações e guarda apenas os campos modificados. */
  async salvarAlteracoes(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custo || !this.custoId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.validarFormulario()) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.salvando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Compara e actualiza apenas os campos que mudaram.
      const alteracoes: Partial<Custo> = {};
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.custo.descricao !== this.custoOriginal?.descricao) {
        // Executa uma instrucao necessaria para este fluxo.
        alteracoes.descricao = this.custo.descricao;
      }
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.custo.valor !== this.custoOriginal?.valor) {
        // Executa uma instrucao necessaria para este fluxo.
        alteracoes.valor = this.custo.valor;
      }
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.custo.categoria !== this.custoOriginal?.categoria) {
        // Executa uma instrucao necessaria para este fluxo.
        alteracoes.categoria = this.custo.categoria;
      }
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (this.custo.data !== this.custoOriginal?.data) {
        // Executa uma instrucao necessaria para este fluxo.
        alteracoes.data = this.custo.data;
      }

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (Object.keys(alteracoes).length === 0) {
        // Atualiza ou consulta estado da pagina.
        this.mostrarMensagem(this.strings.get('custos.editar.mensagens.semAlteracoes'));
        // Atualiza ou consulta estado da pagina.
        this.salvando = false;
        // Devolve o resultado deste bloco.
        return;
      }

      // Aguarda a conclusao de uma operacao assincrona.
      await this.custosService.updateCusto(this.custoId, alteracoes);

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastController.create({
        // Define um campo ou opcao de configuracao.
        message: this.strings.get('custos.editar.mensagens.custoAtualizado'),
        // Define um campo ou opcao de configuracao.
        duration: 2000,
        // Define um campo ou opcao de configuracao.
        position: 'bottom',
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();

      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/resumo-custos']);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (erro) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error(this.strings.get('custos.editar.logs.erroGuardar'), erro);
      // Atualiza ou consulta estado da pagina.
      this.mostrarErro(this.strings.get('custos.editar.mensagens.erroGuardar'));
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.salvando = false;
    }
  }

  /** Pede confirmação antes de eliminar definitivamente o custo. */
  async eliminarCusto(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custoId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const alert = await this.alertController.create({
      // Define um campo ou opcao de configuracao.
      header: this.strings.get('custos.editar.confirmarEliminar.titulo'),
      // Define um campo ou opcao de configuracao.
      message: this.strings.get('custos.editar.confirmarEliminar.mensagem'),
      // Define um campo ou opcao de configuracao.
      buttons: [
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: this.strings.get('common.cancel'),
          // Define um campo ou opcao de configuracao.
          role: 'cancel'
        },
        // Executa uma instrucao necessaria para este fluxo.
        {
          // Define um campo ou opcao de configuracao.
          text: this.strings.get('common.delete'),
          // Define um campo ou opcao de configuracao.
          role: 'destructive',
          // Define um campo ou opcao de configuracao.
          handler: async () => {
            // Aguarda a conclusao de uma operacao assincrona.
            await this.executarEliminacao();
          }
        }
      ]
    });

    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  /** Executa a eliminação do custo depois da confirmação do utilizador. */
  private async executarEliminacao(): Promise<void> {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custoId) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.salvando = true;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.custosService.deleteCusto(this.custoId);

      // Cria uma variavel local para esta operacao.
      const toast = await this.toastController.create({
        // Define um campo ou opcao de configuracao.
        message: this.strings.get('custos.editar.mensagens.custoEliminado'),
        // Define um campo ou opcao de configuracao.
        duration: 2000,
        // Define um campo ou opcao de configuracao.
        position: 'bottom',
        // Define um campo ou opcao de configuracao.
        color: 'success'
      });
      // Aguarda a conclusao de uma operacao assincrona.
      await toast.present();

      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/resumo-custos']);
    // Executa uma instrucao necessaria para este fluxo.
    } catch (erro) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error(this.strings.get('custos.editar.logs.erroEliminar'), erro);
      // Atualiza ou consulta estado da pagina.
      this.mostrarErro(this.strings.get('custos.editar.mensagens.erroEliminar'));
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.salvando = false;
    }
  }

  /** Cancela a edição e volta ao resumo de custos. */
  cancelar(): void {
    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/resumo-custos']);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  normalizarValorCusto(event: CustomEvent<{ value?: string | null }>): void {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custo) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const valorNormalizado = this.normalizarDecimal(event.detail?.value);
    // Atualiza ou consulta estado da pagina.
    this.custo.valor = valorNormalizado === '' || valorNormalizado === '.'
      // Executa uma instrucao necessaria para este fluxo.
      ? 0
      // Executa uma instrucao necessaria para este fluxo.
      : Number(valorNormalizado);
  }

  /** Garante que os campos obrigatórios do custo estão preenchidos. */
  private validarFormulario(): boolean {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custo) {
      // Atualiza ou consulta estado da pagina.
      this.mostrarMensagem(this.strings.get('custos.editar.mensagens.dadosNaoCarregados'));
      // Devolve o resultado deste bloco.
      return false;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custo.descricao || this.custo.descricao.trim() === '') {
      // Atualiza ou consulta estado da pagina.
      this.mostrarMensagem(this.strings.get('custos.editar.validacao.descricaoObrigatoria'));
      // Devolve o resultado deste bloco.
      return false;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custo.valor || this.custo.valor <= 0) {
      // Atualiza ou consulta estado da pagina.
      this.mostrarMensagem(this.strings.get('custos.editar.validacao.valorMaiorZero'));
      // Devolve o resultado deste bloco.
      return false;
    }

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.custo.data) {
      // Atualiza ou consulta estado da pagina.
      this.mostrarMensagem(this.strings.get('custos.editar.validacao.dataObrigatoria'));
      // Devolve o resultado deste bloco.
      return false;
    }

    // Devolve o resultado deste bloco.
    return true;
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

  /** Mostra um alerta simples com uma mensagem informativa. */
  private async mostrarMensagem(mensagem: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const alert = await this.alertController.create({
      // Define um campo ou opcao de configuracao.
      header: this.strings.get('common.warning'),
      // Define um campo ou opcao de configuracao.
      message: mensagem,
      // Define um campo ou opcao de configuracao.
      buttons: [this.strings.get('common.ok')]
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await alert.present();
  }

  /** Mostra uma notificação de erro no fundo do ecrã. */
  private async mostrarErro(mensagem: string): Promise<void> {
    // Cria uma variavel local para esta operacao.
    const toast = await this.toastController.create({
      // Define um campo ou opcao de configuracao.
      message: mensagem,
      // Define um campo ou opcao de configuracao.
      duration: 3000,
      // Define um campo ou opcao de configuracao.
      position: 'bottom',
      // Define um campo ou opcao de configuracao.
      color: 'danger'
    });
    // Aguarda a conclusao de uma operacao assincrona.
    await toast.present();
  }

  /** Devolve a cor visual associada à categoria seleccionada. */
  obterCorCategoria(categoria: string | undefined): string {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!categoria) {
      // Devolve o resultado deste bloco.
      return 'medium';
    }

    // Cria uma variavel local para esta operacao.
    const coresMap: Record<string, string> = {
      // Define um campo ou opcao de configuracao.
      alimentacao: 'danger',
      // Define um campo ou opcao de configuracao.
      transporte: 'warning',
      // Define um campo ou opcao de configuracao.
      alojamento: 'primary',
      // Define um campo ou opcao de configuracao.
      compras: 'secondary',
      // Define um campo ou opcao de configuracao.
      cultura: 'tertiary',
      // Define um campo ou opcao de configuracao.
      natureza: 'success',
      // Define um campo ou opcao de configuracao.
      aventura: 'medium',
      // Define um campo ou opcao de configuracao.
      gastronomia: 'warning',
      // Define um campo ou opcao de configuracao.
      semCategoria: 'light'
    };
    // Devolve o resultado deste bloco.
    return coresMap[categoria] || 'medium';
  }

  /** Formata valores monetários com vírgula decimal. */
  formatarValor(valor: number): string {
    // Devolve o resultado deste bloco.
    return valor.toFixed(2).replace('.', ',');
  }

  /** Obtém o texto visível de uma categoria a partir da sua chave. */
  obterNomeCategoria(categoria: string): string {
    // Devolve o resultado deste bloco.
    return this.strings.get(`custos.categorias.${categoria}`);
  }
}
