// app/models/user.model.ts | Modelos e tipos TypeScript usados para representar dados da aplicacao.
/**
 * User Model
 * Define a estrutura de um objeto de Utilizador
 */
export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture?: string;
  bio?: string;
  preferences?: UserPreferences;
}

/**
 * UserPreferences Model
 * Define as preferências do utilizador
 */
export interface UserPreferences {
  language: string;
  theme: 'light' | 'dark';
  notifications: boolean;
}
