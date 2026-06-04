// app/models/user.model.ts | Modelos e tipos TypeScript usados para representar dados da aplicacao.
/**
 * User Model
 * Define a estrutura de um objeto de Utilizador
 */
export interface User {
  // Define um campo ou opcao de configuracao.
  id: string;
  // Define um campo ou opcao de configuracao.
  name: string;
  // Define um campo ou opcao de configuracao.
  email: string;
  // Executa uma instrucao necessaria para este fluxo.
  profilePicture?: string;
  // Executa uma instrucao necessaria para este fluxo.
  bio?: string;
  // Executa uma instrucao necessaria para este fluxo.
  preferences?: UserPreferences;
}

/**
 * UserPreferences Model
 * Define as preferências do utilizador
 */
export interface UserPreferences {
  // Define um campo ou opcao de configuracao.
  language: string;
  // Define um campo ou opcao de configuracao.
  theme: 'light' | 'dark';
  // Define um campo ou opcao de configuracao.
  notifications: boolean;
}
