// app/pages/gerir-colaboradores/gerir-colaboradores.page.ts | Controlador da pagina gerir colaboradores, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit } from '@angular/core';
// Importa dependencias usadas neste ficheiro.
import { ActivatedRoute, Router } from '@angular/router';
// Importa dependencias usadas neste ficheiro.
import firebase from 'firebase/compat/app';
// Importa dependencias usadas neste ficheiro.
import 'firebase/compat/firestore';
// Importa dependencias usadas neste ficheiro.
import { Colaborador, NivelAcessoColaborador, Viagem } from '../../models/viagem.model';
// Importa dependencias usadas neste ficheiro.
import { ViagensService } from '../../services/viagens.service';

// Aplica metadados/decoradores ao elemento seguinte.
@Component({
  // Define um campo ou opcao de configuracao.
  selector: 'app-gerir-colaboradores',
  // Define um campo ou opcao de configuracao.
  standalone: false,
  // Define um campo ou opcao de configuracao.
  templateUrl: './gerir-colaboradores.page.html',
  // Define um campo ou opcao de configuracao.
  styleUrls: ['./gerir-colaboradores.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class GerirColaboradoresPage implements OnInit {
  // Atribui um valor a esta propriedade.
  viagemId = '';
  // Define um campo ou opcao de configuracao.
  viagem: Viagem | null = null;
  // Define um campo ou opcao de configuracao.
  convidados: Colaborador[] = [];

  // Define um campo ou opcao de configuracao.
  novoConvidado: Partial<Colaborador> = {
    // Define um campo ou opcao de configuracao.
    nome: '',
    // Define um campo ou opcao de configuracao.
    email: '',
    // Define um campo ou opcao de configuracao.
    nivelAcesso: 'visualizador'
  };

  // Define um campo ou opcao de configuracao.
  niveisAcesso: NivelAcessoColaborador[] = ['editor', 'visualizador'];
  // Define um campo ou opcao de configuracao.
  mensagemErro: string | null = null;
  // Define um campo ou opcao de configuracao.
  pesquisando: boolean = false;
  // Atribui um valor a esta propriedade.
  carregando = true;
  // Atribui um valor a esta propriedade.
  guardando = false;

  // Recebe os servicos necessarios por injecao de dependencias.
  constructor(
    // Define um membro interno desta classe.
    private route: ActivatedRoute,
    // Define um membro interno desta classe.
    private router: Router,
    // Define um membro interno desta classe.
    private viagensService: ViagensService
  // Executa uma instrucao necessaria para este fluxo.
  ) {}

  // Define um metodo chamado pela pagina ou por outros metodos.
  ngOnInit() {
    // Atualiza ou consulta estado da pagina.
    this.viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id') || '';

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Viagem não encontrada.';
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.carregarViagem();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  voltar() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (this.viagemId) {
      // Atualiza ou consulta estado da pagina.
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.router.navigate(['/tabs', 'viagens']);
  }

  // Executa uma instrucao necessaria para este fluxo.
  get podeGerirViagem(): boolean {
    // Devolve o resultado deste bloco.
    return this.viagensService.podeGerirViagemAtual(this.viagem);
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async adicionarConvidado() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeGerirViagem) {
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Apenas o dono da viagem pode gerir colaboradores.';
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const email = this.novoConvidado.email?.trim();
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!email || !this.novoConvidado.nivelAcesso) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.mensagemErro = null;
    // Atualiza ou consulta estado da pagina.
    this.pesquisando = true;

    // Cria uma variavel local para esta operacao.
    const usuario = await this.obterUtilizadorPorEmail(email);
    // Atualiza ou consulta estado da pagina.
    this.pesquisando = false;

    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!usuario) {
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Utilizador não encontrado no Firestore. Certifique-se de que o email está registado.';
      // Devolve o resultado deste bloco.
      return;
    }

    // Cria uma variavel local para esta operacao.
    const convidado: Colaborador = {
      // Define um campo ou opcao de configuracao.
      uid: usuario.uid,
      // Define um campo ou opcao de configuracao.
      nome: usuario.nome || this.novoConvidado.nome?.trim() || 'Convidado',
      // Define um campo ou opcao de configuracao.
      email: usuario.email,
      // Define um campo ou opcao de configuracao.
      nivelAcesso: this.novoConvidado.nivelAcesso,
      // Define um campo ou opcao de configuracao.
      telefone: usuario.telefone,
      // Define um campo ou opcao de configuracao.
      avatarUrl: usuario.avatarUrl
    };

    // Cria uma variavel local para esta operacao.
    const existe = this.convidados.some(item => item.uid === convidado.uid || item.email === convidado.email);
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (existe) {
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Este colaborador já foi adicionado.';
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.convidados = [...this.convidados, convidado];
    // Atualiza ou consulta estado da pagina.
    this.novoConvidado = { nome: '', email: '', nivelAcesso: 'visualizador' };
    // Aguarda a conclusao de uma operacao assincrona.
    await this.guardarColaboradores();
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async obterUtilizadorPorEmail(email: string): Promise<any | null> {
    // Inicia um bloco protegido contra erros.
    try {
      // Cria uma variavel local para esta operacao.
      const querySnapshot = await firebase.firestore()
        // Executa uma instrucao necessaria para este fluxo.
        .collection('users')
        // Executa uma instrucao necessaria para este fluxo.
        .where('email', '==', email)
        // Executa uma instrucao necessaria para este fluxo.
        .limit(1)
        // Executa uma instrucao necessaria para este fluxo.
        .get();

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (querySnapshot.empty) {
        // Devolve o resultado deste bloco.
        return null;
      }

      // Cria uma variavel local para esta operacao.
      const doc = querySnapshot.docs[0];
      // Devolve o resultado deste bloco.
      return {
        // Define um campo ou opcao de configuracao.
        uid: doc.id,
        // Executa uma instrucao necessaria para este fluxo.
        ...doc.data()
      };
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao pesquisar utilizador por email:', error);
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Erro ao pesquisar utilizador. Tente novamente mais tarde.';
      // Devolve o resultado deste bloco.
      return null;
    }
  }

  // Define um metodo chamado pela pagina ou por outros metodos.
  async removerConvidado(index: number) {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.podeGerirViagem) {
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Apenas o dono da viagem pode gerir colaboradores.';
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.convidados = this.convidados.filter((_, i) => i !== index);
    // Aguarda a conclusao de uma operacao assincrona.
    await this.guardarColaboradores();
  }

  // Define um membro interno desta classe.
  private async carregarViagem() {
    // Inicia um bloco protegido contra erros.
    try {
      // Atualiza ou consulta estado da pagina.
      this.viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);
      // Atualiza ou consulta estado da pagina.
      this.convidados = this.viagem?.colaboradores || [];

      // Define um metodo chamado pela pagina ou por outros metodos.
      if (!this.viagem) {
        // Atualiza ou consulta estado da pagina.
        this.mensagemErro = 'Viagem não encontrada.';
      }
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao carregar colaboradores:', error);
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Erro ao carregar colaboradores.';
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.carregando = false;
    }
  }

  // Define um membro interno desta classe.
  private async guardarColaboradores() {
    // Define um metodo chamado pela pagina ou por outros metodos.
    if (!this.viagemId || this.guardando || !this.podeGerirViagem) {
      // Devolve o resultado deste bloco.
      return;
    }

    // Atualiza ou consulta estado da pagina.
    this.guardando = true;
    // Atualiza ou consulta estado da pagina.
    this.mensagemErro = null;

    // Inicia um bloco protegido contra erros.
    try {
      // Aguarda a conclusao de uma operacao assincrona.
      await this.viagensService.updateViagem(this.viagemId, {
        // Define um campo ou opcao de configuracao.
        colaboradores: this.convidados
      });
    // Executa uma instrucao necessaria para este fluxo.
    } catch (error) {
      // Executa uma instrucao necessaria para este fluxo.
      console.error('Erro ao guardar colaboradores:', error);
      // Atualiza ou consulta estado da pagina.
      this.mensagemErro = 'Erro ao guardar colaboradores.';
    // Executa uma instrucao necessaria para este fluxo.
    } finally {
      // Atualiza ou consulta estado da pagina.
      this.guardando = false;
    }
  }

  // Define um membro interno desta classe.
  private obterParametroDaRota(nome: string): string | null {
    // Define um metodo chamado pela pagina ou por outros metodos.
    for (const rota of [...this.route.pathFromRoot].reverse()) {
      // Cria uma variavel local para esta operacao.
      const valor = rota.snapshot.paramMap.get(nome);
      // Define um metodo chamado pela pagina ou por outros metodos.
      if (valor) {
        // Devolve o resultado deste bloco.
        return valor;
      }
    }

    // Devolve o resultado deste bloco.
    return null;
  }
}
