/**
 * @file Gerencia o comportamento do menu de navegação lateral para dispositivos móveis.
 */

// Seleciona os elementos do DOM necessários para o menu mobile uma única vez.
const mobileMenuButton = document.getElementById('mobile-menu-button');
const mobileNavContainer = document.getElementById('mobile-nav-container');
const mobileNavBackdrop = document.getElementById('mobile-nav-backdrop');
const mobileNavCloseButton = document.getElementById('mobile-nav-close-button');
const mobileNavPanel = document.getElementById('mobile-nav-panel');
const mobileTabButtons = document.querySelectorAll('.mobile-tab-button');

/**
 * Controla a exibição (abrir/fechar) do menu de navegação mobile.
 * @param {boolean} show - `true` para mostrar o menu, `false` para esconder.
 */
const toggleMobileNav = (show) => {
    if (show) {
        mobileNavContainer.style.visibility = 'visible';
        mobileNavBackdrop.classList.remove('opacity-0');
        mobileNavPanel.classList.remove('translate-x-full');
    } else {
        mobileNavBackdrop.classList.add('opacity-0');
        mobileNavPanel.classList.add('translate-x-full');
        // Espera a animação de transição (300ms) terminar antes de esconder o container.
        setTimeout(() => {
            mobileNavContainer.style.visibility = 'hidden';
        }, 300);
    }
};

/**
 * Configura todos os event listeners necessários para o menu mobile.
 * Esta função deve ser chamada uma vez quando a aplicação é inicializada.
 */
export function setupMobileNav() {
    // Verifica se os elementos essenciais existem antes de adicionar os listeners.
    if (!mobileMenuButton || !mobileNavContainer || !mobileNavCloseButton) {
        console.warn("Elementos da navegação mobile não foram encontrados. A funcionalidade pode estar desabilitada.");
        return;
    }

    mobileMenuButton.addEventListener('click', () => toggleMobileNav(true));
    mobileNavCloseButton.addEventListener('click', () => toggleMobileNav(false));
    mobileNavBackdrop.addEventListener('click', () => toggleMobileNav(false));

    // Adiciona um listener para cada botão de aba dentro do menu mobile.
    // Ao clicar, a aba é trocada e o menu é fechado.
    mobileTabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // A lógica de `switchTab` será chamada pelo main.js,
            // aqui apenas garantimos que o menu feche.
            toggleMobileNav(false);
        });
    });
}
