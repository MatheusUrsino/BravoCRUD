/**
 * Converte valor para número, tratando strings e valores nulos.
 */
export function parseNumber(value: any): number {
  if (typeof value === "number") return value;
  if (!value) return 0;
  return Number(value);
}

/**
 * Formata uma data para o padrão dd/mm/yyyy.
 */
export function formatDate(value: string | Date): string {
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  // Usa getUTCDate, getUTCMonth, getUTCFullYear para garantir UTC
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const year = date.getUTCFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formata um número para percentual no padrão brasileiro (ex: 12,34%).
 * Espera valor em centésimos (ex: 1234 => "12,34%").
 */
export function formatPercentage(value: number | string): string {
  let num = typeof value === "number" ? value : parseFloat(value.toString().replace(',', '.'));
  if (isNaN(num)) return "0,00%";
  // Se for inteiro, assume que está em centésimos (ex: 1234 => 12,34)
  if (Number.isInteger(num)) num = num / 100;
  return `${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
}

export function formatCompetencia(competencia: string): string {
  if (!competencia) return "";
  // Aceita formatos "2024-06-01T00:00:00.000Z" ou "2024-06"
  const match = competencia.match(/^(\d{4})-(\d{2})/);
  if (!match) return competencia;
  return `${match[2]}/${match[1]}`; // MM/YYYY
};

/**
 * Converte string para número, tratando vírgula como separador decimal.
 */
export function parseFormValue(value: string): number | null {
  if (!value) return null;
  const num = Number(value.toString().replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Converte valor para data ISO ou retorna null se inválido.
 */
export function parseDate(value: any): string | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date.toISOString();
}

export function calculateVlIssqn(values: {
  base_calculo?: string | number;
  aliquota?: string | number;
  multa?: string | number;
  juros?: string | number;
  taxa?: string | number;
  faturamento?: string | number;
  vl_issqn?: string | number;

}): { raw: number; formatted: number } {
  const base = parseFormValue(values.base_calculo?.toString() || '0') || 0;
  const aliquota = parseFormValue(values.aliquota?.toString() || '0') || 0;
  const multa = parseFormValue(values.multa?.toString() || '0') || 0;
  const juros = parseFormValue(values.juros?.toString() || '0') || 0;
  const taxa = parseFormValue(values.taxa?.toString() || '0') || 0;

  const vlIssqn = (base * (aliquota / 10000)) + multa + juros + taxa;

  return {
    raw: vlIssqn,
    formatted: vlIssqn
  };
}

// Agora fora de qualquer função:
export function formatCNPJ(value: string | number): string {
  const cnpj = String(value).replace(/\D/g, "");
  if (cnpj.length !== 14) return value.toString();
  return cnpj.replace(
    /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
    "$1.$2.$3/$4-$5"
  );
}

/**
* Formata número em centavos para moeda brasileira (R$ 1.234,56).
* Exemplo: 123456 => "R$ 1.234,56"
*/
export function formatCurrency(value: number | string): string {
  let num = typeof value === "number" ? value : parseFloat(value);
  if (isNaN(num)) return "R$ 0,00";
  // Se for inteiro, assume que está em centavos
  if (Number.isInteger(num)) num = num / 100;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}