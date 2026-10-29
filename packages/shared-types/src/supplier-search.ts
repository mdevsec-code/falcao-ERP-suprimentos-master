import type { SupplierCategory } from "./enums";

/**
 * Busca de fornecedores por palavra-chave, em português, chinês ou inglês.
 *
 * - O texto do fornecedor (nome, atividades, produtos e serviços nos dois
 *   idiomas, categoria, cidade) é guardado normalizado em `searchText`.
 * - A consulta vira grupos de termos: todo grupo precisa aparecer em algum
 *   lugar (E entre grupos), e cada grupo aceita qualquer uma das suas
 *   variações (OU dentro do grupo) — "tijolo de cimento" vira
 *   [tijolo] E [cimento, 水泥, cement].
 * - Um glossário de obra liga os idiomas: quem busca "水泥" acha o fornecedor
 *   que escreveu só "cimento", e vice-versa.
 */

/** Minúsculas, sem acento, só letras, dígitos e ideogramas, separados por um espaço. */
export function normalizeSearchText(text: string | null | undefined): string {
  return (text ?? "")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

const CJK = /\p{Script=Han}/u;
const isCjk = (term: string) => CJK.test(term);

/**
 * Glossário de suprimentos de obra: cada linha junta os termos que significam
 * a mesma coisa em português, chinês e inglês. Escritos como se digita
 * (com acento); a comparação normaliza.
 */
export const SUPPLY_GLOSSARY: ReadonlyArray<readonly string[]> = [
  // Compostos que contêm "cimento" mas são outra coisa (ver COMPOUND_REWRITES).
  ["fibrocimento", "纤维水泥", "fiber cement", "fibre cement"],
  ["forno de cimento", "fornodecimento", "水泥窑", "cement kiln"],
  ["cimento", "水泥", "cement"],
  ["concreto", "混凝土", "砼", "concrete"],
  ["argamassa", "砂浆", "mortar"],
  ["tijolo", "砖", "brick"],
  ["bloco", "砌块", "block"],
  ["areia", "沙", "砂", "sand"],
  ["brita", "pedra britada", "碎石", "石子", "gravel", "crushed stone"],
  ["cal", "石灰", "lime"],
  ["gesso", "石膏", "gypsum", "plaster"],
  ["drywall", "石膏板", "plasterboard"],
  ["aço", "钢", "钢材", "steel"],
  ["vergalhão", "钢筋", "rebar"],
  ["estrutura metálica", "钢结构", "steel structure"],
  ["ferro", "铁", "iron"],
  ["arame", "铁丝", "wire rod", "binding wire"],
  ["prego", "钉", "钉子", "nail"],
  ["parafuso", "螺丝", "螺栓", "screw", "bolt"],
  ["madeira", "木材", "木料", "wood", "timber", "lumber"],
  ["compensado", "胶合板", "plywood"],
  ["telha", "瓦", "roof tile"],
  ["tinta", "油漆", "涂料", "paint"],
  ["impermeabilizante", "impermeabilização", "防水", "waterproofing"],
  ["isolamento", "保温", "隔热", "insulation"],
  ["tubo", "cano", "管", "管道", "pipe", "tube"],
  ["conexão", "管件", "fitting"],
  ["válvula", "registro", "阀", "阀门", "valve"],
  ["bomba", "泵", "pump"],
  ["mangueira", "软管", "hose"],
  ["cabo", "电缆", "cable"],
  ["fio", "电线", "electric wire"],
  ["disjuntor", "断路器", "circuit breaker"],
  ["quadro elétrico", "配电箱", "配电柜", "switchboard"],
  ["lâmpada", "luminária", "灯", "灯具", "lamp", "light fixture"],
  ["transformador", "变压器", "transformer"],
  ["motor", "电机", "电动机"],
  ["gerador", "发电机", "generator"],
  ["compressor", "压缩机"],
  ["solda", "焊接", "焊材", "welding"],
  ["rolamento", "轴承", "bearing"],
  ["vedação", "密封", "seal"],
  ["borracha", "橡胶", "rubber"],
  ["cobre", "铜", "copper"],
  ["alumínio", "铝", "aluminum", "aluminium"],
  ["vidro", "玻璃", "glass"],
  ["porta", "门", "door"],
  ["janela", "窗", "窗户", "window"],
  ["piso", "cerâmica", "porcelanato", "azulejo", "瓷砖", "地砖", "tile", "ceramic"],
  ["ferramenta", "工具", "tool"],
  ["andaime", "脚手架", "scaffold", "scaffolding"],
  ["escavadeira", "挖掘机", "excavator"],
  ["guindaste", "起重机", "吊车", "crane"],
  ["caminhão", "卡车", "货车", "truck"],
  ["betoneira", "搅拌机", "concrete mixer"],
  ["equipamento", "设备", "equipment"],
  ["epi", "equipamento de proteção", "劳保", "劳保用品", "防护用品", "ppe", "safety equipment"],
  ["capacete", "安全帽", "helmet", "hard hat"],
  ["luva", "手套", "glove"],
  ["bota", "botina", "安全鞋", "劳保鞋", "boot", "safety shoe"],
  ["uniforme", "工作服", "workwear", "uniform"],
  ["extintor", "灭火器", "fire extinguisher"],
  ["combustível", "diesel", "柴油", "燃油", "fuel"],
  ["transporte", "frete", "logística", "运输", "物流", "transport", "freight", "logistics"],
  ["locação", "aluguel", "租赁", "rental", "rent"],
  ["manutenção", "维修", "保养", "maintenance", "repair"],
  ["limpeza", "清洁", "保洁", "cleaning"],
  ["topografia", "测量", "survey", "surveying"],
  ["projeto", "设计", "design"],
  ["consultoria", "咨询", "consulting", "consultancy"],
  ["mão de obra", "劳务", "人工", "labor", "labour"],
  ["elétrica", "elétrico", "电气", "electrical"],
  ["hidráulica", "hidráulico", "给排水", "水暖", "plumbing", "hydraulic"],
  ["mecânica", "mecânico", "机械", "mechanical"],
  ["instrumentação", "仪表", "instrumentation"],
  ["alimentação", "refeição", "餐饮", "食品", "food", "catering"],
  ["papelaria", "escritório", "办公用品", "office supplies", "stationery"],
  ["informática", "computador", "电脑", "计算机", "computer"],
];

/** Termos de cada categoria nos três idiomas — a categoria também entra na busca. */
export const SUPPLIER_CATEGORY_SEARCH_TERMS: Record<SupplierCategory, string> = {
  MATERIAIS_CONSTRUCAO: "materiais de construção 建筑材料 建材 construction materials",
  EQUIPAMENTOS: "equipamentos 设备 equipment",
  SERVICOS_ENGENHARIA: "serviços de engenharia 工程服务 engineering services",
  MAO_DE_OBRA: "mão de obra 劳务 labor",
  TRANSPORTE_LOGISTICA: "transporte logística 运输 物流 transport logistics",
  TECNOLOGIA: "tecnologia 技术 信息技术 technology",
  CONSULTORIA: "consultoria 咨询 consulting",
  MANUTENCAO: "manutenção 维修 保养 maintenance",
  OUTROS: "",
};

/** Palavras que não ajudam a achar nada. */
const STOPWORDS = new Set([
  "de", "da", "do", "das", "dos", "e", "em", "para", "com", "a", "o", "as", "os", "um", "uma", "por",
  "of", "the", "and", "for", "with", "in", "to",
]);
const CJK_STOPCHARS = new Set(["的", "和", "与", "及", "等", "类", "或"]);

/** Plural do português → forma que, por "contém", acha singular e plural. */
function stem(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("oes") || word.endsWith("aes")) return word.slice(0, -3);
  if (/[rzl]es$/.test(word) && word.length > 5) return word.slice(0, -2);
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function variantsOf(term: string): string[] {
  const normal = normalizeSearchText(term);
  const out = new Set([normal]);
  if (!isCjk(normal)) for (const word of [normal]) out.add(stem(word));
  // Forma original (com acento): o nome dos produtos é comparado sem normalizar.
  out.add(term.trim().toLowerCase());
  return [...out].filter(Boolean);
}

interface GlossaryTerm {
  normal: string;
  entry: readonly string[];
}

const GLOSSARY_TERMS: GlossaryTerm[] = SUPPLY_GLOSSARY.flatMap((entry) =>
  entry.map((term) => ({ normal: normalizeSearchText(term), entry })),
)
  // O mais longo primeiro: "estrutura metálica" antes de "aço"/"metálica".
  .sort((a, b) => b.normal.length - a.normal.length);

/** Acha `term` em `text` como palavra inteira (latim) ou como trecho (ideogramas). */
function findTerm(text: string, term: string): number {
  if (isCjk(term)) return text.indexOf(term);
  const padded = ` ${text} `;
  const index = padded.indexOf(` ${term} `);
  if (index >= 0) return index;
  // Plural de uma palavra do glossário ("tijolos", "tubos").
  const plural = padded.search(new RegExp(` ${term}(s|es) `));
  return plural;
}

function glossaryWordMatch(word: string): GlossaryTerm | undefined {
  const base = stem(word);
  return GLOSSARY_TERMS.find((g) => !isCjk(g.normal) && (g.normal === word || g.normal === base));
}

/**
 * Transforma a busca em grupos de variações. Todo grupo precisa ser achado;
 * dentro do grupo, basta uma variação.
 */
export function buildSupplierSearchGroups(query: string): string[][] {
  let rest = normalizeSearchText(query);
  const groups: string[][] = [];
  const seen = new Set<string>();
  const addGroup = (terms: Iterable<string>) => {
    const variants = [...new Set([...terms].flatMap(variantsOf))];
    const key = [...variants].sort().join("|");
    if (variants.length > 0 && !seen.has(key)) {
      seen.add(key);
      groups.push(variants);
    }
  };

  // 1. Termos do glossário (inclusive com mais de uma palavra e em chinês).
  for (const term of GLOSSARY_TERMS) {
    if (!term.normal) continue;
    let index = findTerm(rest, term.normal);
    while (index >= 0) {
      addGroup(term.entry);
      if (isCjk(term.normal)) {
        rest = `${rest.slice(0, index)} ${rest.slice(index + term.normal.length)}`;
      } else {
        // `index` é relativo ao texto com espaço antes; remove a palavra (e o plural).
        const padded = ` ${rest} `;
        const end = padded.indexOf(" ", index + 1 + term.normal.length);
        rest = `${padded.slice(0, index)} ${padded.slice(end)}`.trim();
      }
      rest = rest.replace(/\s+/g, " ").trim();
      index = findTerm(rest, term.normal);
    }
  }

  // 2. O que sobrou: palavras (latim) e ideogramas.
  for (const token of rest.split(" ").filter(Boolean)) {
    if (!isCjk(token)) {
      if (STOPWORDS.has(token) || (token.length < 2 && !/\d/.test(token))) continue;
      const glossary = glossaryWordMatch(token);
      addGroup(glossary ? glossary.entry : [token]);
      continue;
    }
    // Trecho em chinês fora do glossário: até 2 ideogramas fica inteiro; mais
    // que isso, cada ideograma vira um termo (o chinês não separa palavras).
    const chars = [...token].filter((char) => !CJK_STOPCHARS.has(char));
    if (chars.length <= 2) addGroup([chars.join("")]);
    else for (const char of chars) addGroup([char]);
  }
  return groups;
}

/**
 * Compostos que citam um material sem ser ele: "telha de fibrocimento"
 * (纤维水泥) não é cimento, e "coprocessamento em fornos de cimento" (水泥窑)
 * é serviço de resíduos. No texto indexado viram um termo próprio, que o
 * glossário liga aos dois idiomas — "cimento"/"水泥" não os acha mais, mas
 * "fibrocimento"/"纤维水泥" e "forno de cimento"/"水泥窑" continuam achando.
 * Aplicado depois de `normalizeSearchText` (minúsculas, sem acento).
 */
const COMPOUND_REWRITES: ReadonlyArray<readonly [RegExp, string]> = [
  [/纤维水泥/g, " fibrocimento "],
  [/水泥窑/g, " fornodecimento "],
  [/(^| )fornos? (?:de |para )?cimentos?(?= |$)/g, "$1fornodecimento"],
  [/(^| )fibro cimentos?(?= |$)/g, "$1fibrocimento"],
];

function rewriteCompounds(normalized: string): string {
  const out = COMPOUND_REWRITES.reduce((text, [pattern, replacement]) => text.replace(pattern, replacement), normalized);
  return out.replace(/\s+/g, " ").trim();
}

/** Termo em ideogramas (comparado como trecho) ou em letras (comparado pelo começo da palavra). */
export const isCjkSearchTerm = isCjk;

/**
 * Texto guardado no fornecedor para a busca, com espaço nas pontas: assim
 * `contains(" " + termo)` acha o começo de uma palavra (e o plural) sem
 * achar o meio de outra ("cal" não acha "local").
 */
export function buildSupplierSearchText(fields: {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  categoria: SupplierCategory;
  cidade: string;
  estado: string;
  atividades?: string | null;
  atividadesZh?: string | null;
  produtosServicos?: string | null;
  produtosServicosZh?: string | null;
}): string {
  const text = rewriteCompounds(normalizeSearchText(
    [
      fields.razaoSocial,
      fields.nomeFantasia,
      fields.cnpj,
      fields.cnpj.replace(/\D/g, ""),
      SUPPLIER_CATEGORY_SEARCH_TERMS[fields.categoria],
      fields.cidade,
      fields.estado,
      fields.atividades,
      fields.atividadesZh,
      fields.produtosServicos,
      fields.produtosServicosZh,
    ].join(" "),
  ));
  return ` ${text} `;
}
