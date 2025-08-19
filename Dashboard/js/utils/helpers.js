/**
 * @file Contém funções de ajuda (helpers) para manipulação da UI.
 * Este módulo isola a lógica de feedback visual, como estados de carregamento
 * e sucesso/erro em botões, tornando-a reutilizável e fácil de manter.
 */

/**
 * @property {Map<HTMLElement, string>} originalButtonContent - Armazena o conteúdo HTML original
 * de um botão antes de ele entrar no estado de carregamento. Isso é crucial para
 * restaurar o estado original corretamente.
 */
const originalButtonContent = new Map();

/**
 * Altera um botão para o estado de "carregando", mostrando um ícone de spinner e um texto.
 * Desabilita o botão para prevenir cliques múltiplos.
 * @param {HTMLElement} button - O elemento do botão a ser modificado.
 * @param {string} [text='Salvando...'] - O texto a ser exibido ao lado do spinner.
 */
export function setButtonLoadingState(button, text = 'Salvando...') {
    if (!button) return;
    // Salva o conteúdo original apenas se ainda não foi salvo
    if (!originalButtonContent.has(button)) {
        originalButtonContent.set(button, button.innerHTML);
    }
    button.disabled = true;
    button.classList.add('flex', 'items-center', 'justify-center', 'cursor-not-allowed');
    const spinnerIcon = `<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`;
    button.innerHTML = `${spinnerIcon} <span>${text}</span>`;
}

/**
 * Restaura o estado original de um botão após uma operação.
 * Mostra um feedback temporário de sucesso ou erro antes de voltar ao normal.
 * @param {HTMLElement} button - O elemento do botão a ser restaurado.
 * @param {boolean} [success=true] - Indica se a operação foi bem-sucedida.
 * @param {string} [feedbackText='Salvo!'] - O texto de feedback a ser exibido.
 */
export function restoreButtonState(button, success = true, feedbackText = 'Salvo!') {
    if (!button || !originalButtonContent.has(button)) return;

    const originalContent = originalButtonContent.get(button);

    if (success) {
        button.innerHTML = `<svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clip-rule="evenodd" /></svg> <span>${feedbackText}</span>`;
    } else {
        button.innerHTML = `<svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" /></svg> <span class="truncate">${feedbackText}</span>`;
    }

    // Define um tempo para mostrar o feedback antes de restaurar o conteúdo original.
    const delay = success ? 2000 : 4000;
    setTimeout(() => {
        if (button) {
            button.disabled = false;
            button.innerHTML = originalContent;
            // Limpa a referência do mapa para permitir que o botão seja manipulado novamente.
            originalButtonContent.delete(button);
        }
    }, delay);
}
