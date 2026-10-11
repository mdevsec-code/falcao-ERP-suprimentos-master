/**
 * Identidade verbal da Falcão Suprimentos. Centraliza copy
 * (taglines, descrições) para evitar strings espalhadas pelo código.
 */
export const brand = {
  name: 'Falcão Suprimentos',
  shortName: 'Falcão',
  legalName: 'Falcão Construções e Engenharia',
  tagline: 'Suprimentos de alto padrão',
  description:
    'Plataforma de gestão de Suprimentos para Solicitantes, Gestores, Compradores, Almoxarifado, Financeiro e Administradores.',
  copyright: `© ${new Date().getFullYear()} Falcão Construções e Engenharia. Todos os direitos reservados.`,
  version: '0.2.0',
} as const;
