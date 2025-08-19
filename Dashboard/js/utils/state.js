/**
 * @file Gerencia o estado global da aplicação.
 * Centralizar o estado em um único local (ou em um único módulo)
 * simplifica o fluxo de dados e torna a aplicação mais previsível.
 * Qualquer parte do código que precise dos dados do dashboard irá importá-los daqui.
 */

/**
 * @property {object} dashboardData - Armazena todos os dados dinâmicos
 * recuperados da API que são necessários para renderizar as visualizações.
 * Inclui configurações, agendamentos, dados financeiros, etc.
 */
let dashboardData = {};

/**
 * Retorna uma cópia do estado atual do dashboard.
 * Usar um "getter" como este previne mutações acidentais do estado.
 * @returns {object} Uma cópia do objeto dashboardData.
 */
export function getDashboardData() {
    // Retorna uma cópia superficial para evitar mutações diretas do objeto original.
    return { ...dashboardData };
}

/**
 * Atualiza o estado global do dashboard com novos dados.
 * Esta é a única função que deve ser usada para modificar o estado.
 * @param {object} newData - O novo objeto de dados completo para o dashboard.
 */
export function setDashboardData(newData) {
    dashboardData = newData;
}
