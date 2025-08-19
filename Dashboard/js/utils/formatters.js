/**
 * @file Contém funções puras para formatação de dados.
 * Módulos como este são ótimos para isolar a lógica de apresentação
 * e garantir que a formatação seja consistente em toda a aplicação.
 */

/**
 * Formata um valor numérico como uma string de moeda no formato BRL (Real Brasileiro).
 * @param {number} value - O valor a ser formatado. O padrão é 0 se nada for fornecido.
 * @returns {string} - A string formatada, por exemplo, "R$ 1.234,56".
 */
export const formatCurrency = (value = 0) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value || 0);
};

/**
 * Converte uma data no formato 'AAAA-MM-DD' para 'DD/MM/AAAA'.
 * @param {string} dateString - A data no formato ISO (AAAA-MM-DD).
 * @returns {string} A data formatada como DD/MM/AAAA.
 */
export const formatDateToBrazilian = (dateString) => {
    if (!dateString || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return ''; // Retorna vazio se a data for inválida
    }
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
};

/**
 * Converte uma data no formato 'DD/MM/AAAA' para 'AAAA-MM-DD'.
 * @param {string} dateString - A data no formato brasileiro (DD/MM/AAAA).
 * @returns {string} A data formatada como AAAA-MM-DD.
 */
export const formatDateToISO = (dateString) => {
    if (!dateString || !/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        return ''; // Retorna vazio se a data for inválida
    }
    const [day, month, year] = dateString.split('/');
    return `${year}-${month}-${day}`;
};
