/**
 * @file Gerencia a navegação e a exibição das abas principais do dashboard.
 */

/**
 * @property {HTMLElement | null} currentTab - Mantém uma referência ao elemento da aba
 * que está atualmente visível para o usuário.
 */
let currentTab = null;

/**
 * Alterna a visibilidade de uma aba para outra, aplicando animações de fade.
 * Também atualiza o estado visual (cores, bordas) dos botões de controle das abas.
 * @param {string} tabId - O identificador da aba de destino (ex: "overview", "finance").
 */
export function switchTab(tabId) {
    const newTabContent = document.getElementById(`${tabId}-tab`);
    // Se a aba não existe ou já é a aba atual, não faz nada.
    if (!newTabContent || currentTab === newTabContent) {
        return;
    }

    // Se uma aba estiver visível, inicia a animação de fade-out.
    if (currentTab) {
        currentTab.classList.remove('fade-in');
        currentTab.classList.add('fade-out');
        // Esconde a aba antiga após a animação de 300ms terminar.
        setTimeout(() => {
            if (currentTab) { // Verificação extra caso o usuário clique rápido
                currentTab.classList.remove('active');
                currentTab.style.display = 'none';
            }
        }, 300);
    }

    // Exibe a nova aba. A animação de fade-in começa com um pequeno atraso
    // para permitir que a aba antiga desapareça primeiro.
    const fadeInDelay = currentTab ? 300 : 0;
    setTimeout(() => {
        newTabContent.style.display = 'block';
        newTabContent.classList.remove('fade-out');
        newTabContent.classList.add('active', 'fade-in');
        currentTab = newTabContent;
    }, fadeInDelay);

    // Atualiza o estilo de todos os botões de aba (desktop e mobile).
    document.querySelectorAll('.tab-button, .mobile-tab-button').forEach(btn => {
        const isActive = btn.dataset.tab === tabId;
        btn.classList.toggle('active', isActive);

        // Estilos específicos para os botões do desktop
        if (btn.classList.contains('tab-button')) {
            btn.classList.toggle('text-primary', isActive);
            btn.classList.toggle('border-primary', isActive);
            btn.classList.toggle('text-muted', !isActive);
            btn.classList.toggle('border-transparent', !isActive);
        }
        // Estilos específicos para os botões do menu mobile
        else {
            btn.classList.toggle('bg-interactive', isActive);
            btn.classList.toggle('text-white', isActive);
            btn.classList.toggle('text-gray-300', !isActive);
        }
    });
}
