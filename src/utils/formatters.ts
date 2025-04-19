/**
 * Formata um CNPJ (adiciona pontuação)
 * @param cnpj - String contendo o CNPJ (com ou sem formatação)
 * @returns CNPJ formatado (00.000.000/0000-00)
 */
export const formatCNPJ = (cnpj: string): string => {
  if (!cnpj) return "";
  
  // Remove todos os caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '');
  
  // Aplica a formatação do CNPJ: 00.000.000/0000-00
  return cleaned.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
  );
};
  
  /**
   * Formata valores monetários
   * @param value - Valor numérico ou string
   * @returns Valor formatado (1.234,56)
   */
  export const formatCurrency = (value: number | string): string => {
    if (!value && value !== 0) return '';
    
    const num = typeof value === 'string' 
        ? parseFloat(value.replace(/[^\d]/g, '')) / 100 
        : value;
    
    if (isNaN(num)) return '';
    
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(num);
};

  /**
   * Formata datas para o padrão brasileiro
   * @param dateString - Data em formato ISO ou string reconhecível
   * @returns Data formatada (dd/mm/aaaa)
   */
  export const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    return date.toLocaleDateString('pt-BR');
  };