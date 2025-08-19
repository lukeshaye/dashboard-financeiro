/**
 * @file Gerencia a exibição e o comportamento dos modais da aplicação.
 */

// A função createCustomInput será importada de outro módulo para criar os seletores.
import { createCustomInput } from '../components/customInputs.js';

/**
 * Alterna a visibilidade de um modal.
 * @param {string} modalId - O ID do elemento do modal.
 * @param {boolean} show - `true` para mostrar, `false` para esconder.
 */
function toggleModal(modalId, show) {
    const modal = document.getElementById(modalId);
    if (!modal) {
        console.error(`Modal com ID "${modalId}" não encontrado.`);
        return;
    }
    if (show) {
        modal.classList.add('open');
    } else {
        modal.classList.remove('open');
    }
}

/**
 * Abre e popula o modal de edição de agendamento.
 * @param {object} appointment - O objeto com os dados do agendamento.
 * @param {string[]} professionals - Uma lista com os nomes dos profissionais disponíveis.
 */
export function openEditModal(appointment, professionals) {
    // Prepara as opções para o seletor de profissionais.
    const professionalOptions = [
        { value: '', label: 'N/A' },
        ...professionals.map(p => ({ value: p, label: p }))
    ];

    // Utiliza o componente customizado para criar os seletores.
    createCustomInput('select', document.getElementById('edit-appointment-professional-wrapper'), professionalOptions, appointment.professional);
    createCustomInput('date', document.getElementById('edit-appointment-data-wrapper'), null, appointment.data);
    createCustomInput('time', document.getElementById('edit-appointment-hora-wrapper'), null, appointment.hora);

    // Preenche os campos do formulário com os dados do agendamento.
    document.getElementById('edit-appointment-id').value = appointment.id;
    document.getElementById('edit-appointment-timestamp').value = appointment.timestamp;
    document.getElementById('edit-appointment-nome').value = appointment.nome;
    document.getElementById('edit-appointment-telefone').value = appointment.telefone;
    document.getElementById('edit-appointment-servico').value = appointment.servico;
    document.getElementById('edit-appointment-preco').value = appointment.preco;

    toggleModal('edit-appointment-modal', true);
}

/**
 * Abre o modal de confirmação de exclusão.
 * @param {string} itemId - O ID do item a ser excluído.
 * @param {string} tableName - O nome da tabela de onde o item será excluído.
 */
export function openDeleteModal(itemId, tableName) {
    document.getElementById('delete-item-id').value = itemId;
    document.getElementById('delete-table-name').value = tableName;
    toggleModal('delete-confirm-modal', true);
}

/**
 * Fecha o modal de edição de agendamento.
 */
export function closeEditModal() {
    toggleModal('edit-appointment-modal', false);
}

/**
 * Fecha o modal de confirmação de exclusão.
 */
export function closeDeleteModal() {
    toggleModal('delete-confirm-modal', false);
}
