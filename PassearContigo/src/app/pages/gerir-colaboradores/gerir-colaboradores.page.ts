import { Component } from '@angular/core';
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

  adicionarConvidado() {
    if (!this.novoConvidado.email?.trim() || !this.novoConvidado.nivelAcesso) {
      return;
    }

    const convidado: Colaborador = {
      uid: this.gerarUid(),
      nome: this.novoConvidado.nome?.trim() || 'Convidado',
      email: this.novoConvidado.email.trim(),
      nivelAcesso: this.novoConvidado.nivelAcesso,
      telefone: this.novoConvidado.telefone,
      avatarUrl: this.novoConvidado.avatarUrl
    };

    this.convidados = [...this.convidados, convidado];
    this.novoConvidado = { nome: '', email: '', nivelAcesso: 'visualizador' };
  }

  removerConvidado(index: number) {
    this.convidados = this.convidados.filter((_, i) => i !== index);
  }

  private gerarUid(): string {
    return 'uid-' + Math.random().toString(36).substring(2, 12);
  }
}
