/**
 * @file Renderiza o conteúdo da aba "Agendamentos".
 * Este módulo constrói a visualização em cartões para os próximos agendamentos
 * e anexa os event listeners para as ações de editar e excluir.
 */

import { formatCurrency } from '../utils/formatters.js';

// Funções para abrir os modais serão passadas ou gerenciadas pelo main.js
// Por enquanto, os listeners serão preparados para serem conectados depois.

/**
 * Popula a aba "Agendamentos" com os dados dos compromissos futuros.
 * @param {Array<object>} appointments - A lista de objetos de agendamento.
 * @param {Function} onEdit - Callback a ser chamado quando o botão de editar é clicado.
 * @param {Function} onDelete - Callback a ser chamado quando o botão de excluir é clicado.
 */
export function populateSchedulesTab(appointments = [], onEdit, onDelete) {
    const container = document.getElementById('schedules-tab');
    if (!container) return;

    let cardsHtml = '';
    if (appointments.length === 0) {
        cardsHtml = '<p class="text-muted md:col-span-2 xl:col-span-3 text-center">Nenhum agendamento futuro encontrado.</p>';
    } else {
        appointments.forEach(app => {
            const formattedDate = new Date(app.data + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
            const cleanPhone = app.telefone ? String(app.telefone).replace(/\D/g, '') : '';
            let whatsappButton = '';
            if (cleanPhone) {
                const message = `Olá ${app.nome}, passando para confirmar seu agendamento de ${app.servico} para o dia ${formattedDate} às ${app.hora}.`;
                whatsappButton = `<a href="https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}" target="_blank" class="flex items-center gap-1.5 text-sm bg-green-500/20 hover:bg-green-500/40 text-green-300 font-semibold py-1.5 px-3 rounded-md transition-all" title="Confirmar via WhatsApp"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="currentColor" viewBox="0 0 16 16"><path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/></svg>WhatsApp</a>`;
            }
            cardsHtml += `
                <div class="bg-interactive/80 rounded-lg p-4 border-l-4 border-info flex flex-col h-full shadow-lg" data-id="${app.id}" data-table-name="appointments">
                    <div class="flex-grow">
                        <div class="flex justify-between items-center mb-3 pb-2 border-b border-main"><span class="font-bold text-lg text-white">${formattedDate}</span><span class="text-primary font-semibold text-lg">${app.hora}</span></div>
                        <div class="space-y-2">
                            <p class="font-semibold text-xl text-white truncate" title="${app.nome}">${app.nome}</p>
                            <p class="text-sm text-muted">${app.servico}</p>
                            <div class="flex justify-between items-center text-sm pt-2"><span class="text-xs bg-indigo-500/50 text-indigo-300 px-2 py-1 rounded-full">${app.professional || 'N/A'}</span><span class="text-green-400 font-bold">${formatCurrency(app.preco)}</span></div>
                        </div>
                    </div>
                    <div class="border-t border-main mt-4 pt-3 flex flex-wrap justify-end gap-2">
                        ${whatsappButton}
                        <button class="edit-appointment-btn flex items-center gap-1.5 text-sm bg-yellow-500/20 hover:bg-yellow-500/40 text-yellow-300 font-semibold py-1.5 px-3 rounded-md transition-all" title="Editar" data-appointment='${JSON.stringify(app)}'><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>Editar</button>
                        <button class="delete-btn flex items-center gap-1.5 text-sm bg-red-500/20 hover:bg-red-500/40 text-red-400 font-semibold py-1.5 px-3 rounded-md transition-all" title="Excluir"><svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>Excluir</button>
                    </div>
                </div>`;
        });
    }

    container.innerHTML = `
        <div class="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
            <h2 class="text-2xl font-semibold mb-1">Próximos Agendamentos</h2>
            <p class="text-sm text-muted mb-4">Veja, edite ou exclua os agendamentos futuros.</p>
            <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">${cardsHtml}</div>
        </div>
    `;

    // Adiciona os event listeners após o HTML ser inserido no DOM.
    container.querySelectorAll('.edit-appointment-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const appointmentData = JSON.parse(e.currentTarget.dataset.appointment);
            onEdit(appointmentData); // Chama o callback passado
        });
    });

    container.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.currentTarget.closest('[data-id]');
            onDelete(card.dataset.id, card.dataset.tableName); // Chama o callback
        });
    });
}
