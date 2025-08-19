/**
 * @file Renderiza o conteúdo da aba "Visão Geral" (Overview).
 * Este módulo é responsável por construir o HTML e inicializar os gráficos
 * específicos desta visualização.
 */

import { formatCurrency } from '../utils/formatters.js';
import { createChart } from '../ui/charts.js';

/**
 * Popula a aba "Visão Geral" com os dados de análise.
 * @param {object} analytics - O objeto contendo todos os dados calculados para o dashboard.
 */
export function populateAnalyticsTab(analytics) {
    if (!analytics) return;

    const container = document.getElementById('overview-tab');
    if (!container) return;

    // Constrói o HTML para a lista de agendamentos do dia.
    let agendaHtml = '';
    if (!analytics.agendaDoDia || analytics.agendaDoDia.length === 0) {
        agendaHtml = `<p class="text-muted">Nenhum agendamento para hoje.</p>`;
    } else {
        analytics.agendaDoDia.forEach(ag => {
            const professionalInfo = ag.professional ? `<span class="text-xs bg-indigo-500/50 text-indigo-300 px-2 py-1 rounded-full">${ag.professional}</span>` : '';
            const cleanPhone = ag.telefone ? String(ag.telefone).replace(/\D/g, '') : '';
            let whatsappLink = '';
            if (cleanPhone) {
                const message = `Olá ${ag.cliente}, passando para lembrar do seu agendamento (${ag.servico}) hoje às ${ag.hora}h.`;
                whatsappLink = `<a href="https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}" target="_blank" class="flex items-center gap-1.5 text-sm bg-green-500/20 hover:bg-green-500/40 text-green-300 font-semibold py-1.5 px-3 rounded-md transition-all" title="Lembrar via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>Lembrar</a>`;
            }
            agendaHtml += `<div class="bg-interactive rounded-lg p-4 border-l-4 border-primary flex flex-col justify-between"><div><div class="flex items-center justify-between mb-1 flex-wrap gap-2"><div class="flex items-center gap-2"><span class="text-primary font-semibold">${ag.hora}</span><span class="text-muted">•</span><span class="text-white font-medium">${ag.cliente}</span></div>${professionalInfo}</div><p class="text-muted text-sm mt-1">${ag.servico}</p></div><div class="flex justify-between items-center mt-3 pt-3 border-t border-main"><span class="text-green-400 font-semibold">${formatCurrency(ag.preco)}</span>${whatsappLink}</div></div>`;
        });
    }

    // Template principal da aba.
    container.innerHTML = `
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Ganhos do Dia</p><p class="text-2xl font-bold text-green-400">${formatCurrency(analytics.kpis.ganhosDia)}</p></div>
            <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Agendamentos Hoje</p><p class="text-2xl font-bold text-blue-400">${analytics.kpis.agendamentosHoje}</p></div>
            <div class="bg-card rounded-lg p-6 border border-main sm:col-span-2 lg:col-span-1"><p class="text-muted text-sm">Ticket Médio (Dia)</p><p class="text-2xl font-bold text-primary">${formatCurrency(analytics.kpis.ticketMedio)}</p></div>
        </div>
        <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div class="lg:col-span-2 bg-card rounded-lg p-6 border border-main"><h2 class="text-xl font-semibold mb-4 text-primary">Agenda do Dia</h2><div class="space-y-3">${agendaHtml}</div></div>
            <div class="lg:col-span-3 space-y-6">
                <div class="bg-card rounded-lg p-6 border border-main"><h2 class="text-xl font-semibold mb-4 text-primary">Ganhos da Semana</h2><div class="h-64"><canvas id="ganhosChart"></canvas></div></div>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-card rounded-lg p-6 border border-main"><h2 class="text-xl font-semibold mb-4 text-primary">Serviços Populares</h2><div class="h-64 flex items-center justify-center"><canvas id="servicosChart"></canvas></div></div>
                    <div class="bg-card rounded-lg p-6 border border-main"><h2 class="text-xl font-semibold mb-4 text-primary">Desempenho (Profissionais)</h2><div class="h-64 flex items-center justify-center"><canvas id="profissionaisChart"></canvas></div></div>
                </div>
            </div>
        </div>
    `;

    // Após o HTML ser inserido no DOM, cria os gráficos.
    createChart('ganhosChart', 'bar', analytics.desempenhoSemanal, { y: { beginAtZero: true, ticks: { color: 'var(--color-text-muted)' }, grid: { color: 'var(--color-border-main)' } }, x: { ticks: { color: 'var(--color-text-muted)' }, grid: { display: false } } });
    createChart('servicosChart', 'doughnut', analytics.popularidadeServicos);
    createChart('profissionaisChart', 'doughnut', analytics.popularidadeProfissionais);
}
