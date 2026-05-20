/**
 * Trip Model
 * Define a estrutura de um objeto de Viagem
 */
export interface Trip {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: Date;
  endDate: Date;
  activities?: Activity[];
}

/**
 * Activity Model
 * Define a estrutura de uma atividade dentro de uma viagem
 */
export interface Activity {
  id: string;
  name: string;
  description: string;
  date: Date;
  location: string;
}
