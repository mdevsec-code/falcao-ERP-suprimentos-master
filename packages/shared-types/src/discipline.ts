export interface DisciplineDto {
  id: string;
  nome: string;
  ordem: number;
  isActive: boolean;
  /** Produtos do catálogo nesta disciplina. */
  productCount: number;
}

/** Lista inicial criada para cada empresa; depois é editável pela tela. */
export const DEFAULT_DISCIPLINES = [
  "Civil",
  "Elétrica",
  "Mecânica",
  "Eletromecânica",
  "Hidráulica",
  "Instrumentação",
] as const;
