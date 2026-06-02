import { Component } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { Colaborador, NivelAcessoColaborador } from '../../models/viagem.model';

@Component({
  selector: 'app-gerir-colaboradores',
  standalone: false,
  templateUrl: './gerir-colaboradores.page.html',
  styleUrls: ['./gerir-colaboradores.page.scss']
})
export class GerirColaboradoresPage {
  convidados: Colaborador[] = [];

  novoConvidado: Partial<Colaborador> = {
    nome: '',
    email: '',
    nivelAcesso: 'visualizador'
  };

  niveisAcesso: NivelAcessoColaborador[] = ['dono', 'editor', 'visualizador'];
  mensagemErro: string | null = null;
  pesquisando: boolean = false;

  async adicionarConvidado() {
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

    this.convidados = [...this.convidados, convidado];
    this.novoConvidado = { nome: '', email: '', nivelAcesso: 'visualizador' };
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

  removerConvidado(index: number) {
    this.convidados = this.convidados.filter((_, i) => i !== index);
  }
}
