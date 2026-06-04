// app/pages/gerir-colaboradores/gerir-colaboradores.page.ts | Controlador da pagina gerir colaboradores, onde ficam os dados, eventos e chamadas aos servicos.
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Colaborador, NivelAcessoColaborador, Viagem } from '../../models/viagem.model';
import { ViagensService } from '../../services/viagens.service';

@Component({
  selector: 'app-gerir-colaboradores',
  standalone: false,
  templateUrl: './gerir-colaboradores.page.html',
  styleUrls: ['./gerir-colaboradores.page.scss']
})
// Classe que agrupa o estado e o comportamento deste ficheiro.
export class GerirColaboradoresPage implements OnInit {
  viagemId = '';
  viagem: Viagem | null = null;
  convidados: Colaborador[] = [];

  novoConvidado: Partial<Colaborador> = {
    nome: '',
    email: '',
    nivelAcesso: 'visualizador'
  };

  niveisAcesso: NivelAcessoColaborador[] = ['editor', 'visualizador'];
  mensagemErro: string | null = null;
  pesquisando: boolean = false;
  carregando = true;
  guardando = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private viagensService: ViagensService
  ) {}

  ngOnInit() {
    this.viagemId = this.route.snapshot.paramMap.get('id') || this.obterParametroDaRota('id') || '';

    if (!this.viagemId) {
      this.mensagemErro = 'Viagem não encontrada.';
      this.carregando = false;
      return;
    }

    this.carregarViagem();
  }

  voltar() {
    if (this.viagemId) {
      this.router.navigate(['/tabs', 'viagens', this.viagemId]);
      return;
    }

    this.router.navigate(['/tabs', 'viagens']);
  }

  get podeGerirViagem(): boolean {
    return this.viagensService.podeGerirViagemAtual(this.viagem);
  }

  async adicionarConvidado() {
    if (!this.podeGerirViagem) {
      this.mensagemErro = 'Apenas o dono da viagem pode gerir colaboradores.';
      return;
    }

    const email = this.novoConvidado.email?.trim();
    if (!email || !this.novoConvidado.nivelAcesso) {
      return;
    }

    this.mensagemErro = null;
    this.pesquisando = true;

    const usuario = await this.obterUtilizadorPorEmail(email);
    this.pesquisando = false;

    if (!usuario) {
      this.mensagemErro = 'Utilizador não encontrado no Firestore. Certifique-se de que o email está registado.';
      return;
    }

    const convidado: Colaborador = {
      uid: usuario.uid,
      nome: usuario.nome || this.novoConvidado.nome?.trim() || 'Convidado',
      email: usuario.email,
      nivelAcesso: this.novoConvidado.nivelAcesso,
      telefone: usuario.telefone,
      avatarUrl: usuario.avatarUrl
    };

    const existe = this.convidados.some(item => item.uid === convidado.uid || item.email === convidado.email);
    if (existe) {
      this.mensagemErro = 'Este colaborador já foi adicionado.';
      return;
    }

    this.convidados = [...this.convidados, convidado];
    this.novoConvidado = { nome: '', email: '', nivelAcesso: 'visualizador' };
    await this.guardarColaboradores();
  }

  async obterUtilizadorPorEmail(email: string): Promise<any | null> {
    try {
      const querySnapshot = await firebase.firestore()
        .collection('users')
        .where('email', '==', email)
        .limit(1)
        .get();

      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        uid: doc.id,
        ...doc.data()
      };
    } catch (error) {
      console.error('Erro ao pesquisar utilizador por email:', error);
      this.mensagemErro = 'Erro ao pesquisar utilizador. Tente novamente mais tarde.';
      return null;
    }
  }

  async removerConvidado(index: number) {
    if (!this.podeGerirViagem) {
      this.mensagemErro = 'Apenas o dono da viagem pode gerir colaboradores.';
      return;
    }

    this.convidados = this.convidados.filter((_, i) => i !== index);
    await this.guardarColaboradores();
  }

  private async carregarViagem() {
    try {
      this.viagem = await this.viagensService.getViagemByIdOnce(this.viagemId);
      this.convidados = this.viagem?.colaboradores || [];

      if (!this.viagem) {
        this.mensagemErro = 'Viagem não encontrada.';
      }
    } catch (error) {
      console.error('Erro ao carregar colaboradores:', error);
      this.mensagemErro = 'Erro ao carregar colaboradores.';
    } finally {
      this.carregando = false;
    }
  }

  private async guardarColaboradores() {
    if (!this.viagemId || this.guardando || !this.podeGerirViagem) {
      return;
    }

    this.guardando = true;
    this.mensagemErro = null;

    try {
      await this.viagensService.updateViagem(this.viagemId, {
        colaboradores: this.convidados
      });
    } catch (error) {
      console.error('Erro ao guardar colaboradores:', error);
      this.mensagemErro = 'Erro ao guardar colaboradores.';
    } finally {
      this.guardando = false;
    }
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
