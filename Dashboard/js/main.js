/**
 * @file Ponto de entrada principal e orquestrador da aplicação do dashboard.
 * Este módulo é responsável por inicializar todos os outros módulos,
 * gerenciar o estado da aplicação, e conectar os eventos da UI com a lógica de negócios.
 */

// --- 1. IMPORTAÇÕES DE MÓDULOS ---

// API e Estado
import * as api from './api/supabaseService.js';
import { getDashboardData, setDashboardData } from './utils/state.js';

// Componentes de UI
import { setupMobileNav } from './ui/mobileNav.js';
import { switchTab } from './ui/tabs.js';
import { openEditModal, closeEditModal, openDeleteModal, closeDeleteModal } from './ui/modals.js';

// Funções de Ajuda
import { setButtonLoadingState, restoreButtonState } from './utils/helpers.js';

// Módulos de Visualização (Views)
import { populateAnalyticsTab } from './views/overviewView.js';
import { populateSchedulesTab } from './views/schedulesView.js';
import { populateFinanceTab } from './views/financeView.js';
import { populateEmployeesTab } from './views/employeesView.js';
import { populateGeneralSettingsTab } from './views/settingsView.js';


// --- 2. LÓGICA DE PROCESSAMENTO DE DADOS ---

/**
 * Calcula os dados de análise a partir dos dados brutos da API.
 * @param {Array} appointmentsData - Dados de agendamentos.
 * @param {Array} financialData - Dados de entradas financeiras.
 * @returns {object} Objeto com os dados de análise calculados.
 */
function calculateAnalytics(appointmentsData, financialData) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    const todayAppointments = appointmentsData.filter(row => row.appointment_datetime.startsWith(todayStr));
    const ganhosDia = todayAppointments.reduce((sum, row) => sum + (Number(row.price) || 0), 0);
    const agendamentosHoje = todayAppointments.length;
    const ticketMedio = agendamentosHoje > 0 ? ganhosDia / agendamentosHoje : 0;

    const agendaDoDia = todayAppointments.map(row => {
        const dateObj = new Date(row.appointment_datetime);
        const utcHours = String(dateObj.getUTCHours()).padStart(2, '0');
        const utcMinutes = String(dateObj.getUTCMinutes()).padStart(2, '0');
        const displayTime = `${utcHours}:${utcMinutes}`;

        return {
            hora: displayTime,
            cliente: row.client_name,
            servico: row.service,
            preco: Number(row.price) || 0,
            professional: row.professional_name || '',
            telefone: row.phone
        };
    }).sort((a, b) => a.hora.localeCompare(b.hora));

    const weeklyGains = { labels: [], data: [] };
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        const dayLabel = date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const dayAppointments = appointmentsData.filter(row => row.appointment_datetime.startsWith(dateStr));
        const dayGain = dayAppointments.reduce((sum, row) => sum + (Number(row.price) || 0), 0);
        weeklyGains.labels.push(`${dayLabel} (${date.toLocaleDateString('pt-BR', {day: '2-digit', month:'2-digit'})})`);
        weeklyGains.data.push(dayGain);
    }

    const serviceCounts = appointmentsData.reduce((acc, row) => {
        if (row.service) { acc[row.service] = (acc[row.service] || 0) + 1; }
        return acc;
    }, {});
    const popularServices = { labels: Object.keys(serviceCounts), data: Object.values(serviceCounts) };

    const professionalCounts = appointmentsData.reduce((acc, row) => {
        if (row.professional_name) { acc[row.professional_name] = (acc[row.professional_name] || 0) + 1; }
        return acc;
    }, {});
    const popularProfessionals = { labels: Object.keys(professionalCounts), data: Object.values(professionalCounts) };

    // --- INÍCIO DA NOVA LÓGICA DE DESPESAS ---
    const allExpenses = [];
    financialData.forEach(entry => {
        if (entry.value >= 0) return; // Ignora entradas que não são despesas

        if (entry.type === 'Pontual') {
            allExpenses.push({ ...entry, originalId: entry.id, isVirtual: false });
        } else if (entry.type === 'Fixa') {
            const startDate = new Date(entry.entry_date + 'T00:00:00');
            let monthRunner = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);

            while (monthRunner <= today) {
                // Adiciona a despesa fixa para o mês corrente no loop
                allExpenses.push({
                    ...entry,
                    id: `${entry.id}-${monthRunner.toISOString().slice(0, 7)}`, // ID único para a despesa virtual
                    entry_date: new Date(monthRunner.getUTCFullYear(), monthRunner.getUTCMonth(), startDate.getUTCDate()).toISOString().split('T')[0],
                    originalId: entry.id,
                    isVirtual: true,
                });
                
                // Vai para o próximo mês
                monthRunner.setUTCMonth(monthRunner.getUTCMonth() + 1);
            }
        }
    });

    const monthlySummary = { revenue: 0, expenses: 0, netProfit: 0 };

    appointmentsData.forEach(app => {
        const appDate = new Date(app.appointment_datetime);
        if (appDate.getFullYear() === currentYear && appDate.getMonth() === currentMonth) {
            monthlySummary.revenue += (Number(app.price) || 0);
        }
    });
    
    // Recalcula as despesas do mês atual usando a nova lista que inclui as fixas
    allExpenses.forEach(entry => {
        const entryDate = new Date(entry.entry_date + 'T00:00:00');
        if (entryDate.getFullYear() === currentYear && entryDate.getMonth() === currentMonth) {
            monthlySummary.expenses += Math.abs(entry.value);
        }
    });

    monthlySummary.netProfit = monthlySummary.revenue - monthlySummary.expenses;

    const annualSummary = {
        labels: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        revenueData: Array(12).fill(0),
        expenseData: Array(12).fill(0)
    };

    appointmentsData.forEach(app => {
        const appDate = new Date(app.appointment_datetime);
        if (appDate.getFullYear() === currentYear) {
            annualSummary.revenueData[appDate.getMonth()] += (Number(app.price) || 0);
        }
    });

    // Calcula as despesas anuais usando a nova lista
    allExpenses.forEach(entry => {
        const entryDate = new Date(entry.entry_date + 'T00:00:00');
        if (entryDate.getFullYear() === currentYear) {
            annualSummary.expenseData[entryDate.getMonth()] += Math.abs(entry.value);
        }
    });
    // --- FIM DA NOVA LÓGICA DE DESPESAS ---

    return {
        kpis: { ganhosDia, agendamentosHoje, ticketMedio },
        agendaDoDia,
        desempenhoSemanal: weeklyGains,
        popularidadeServicos: popularServices,
        popularidadeProfissionais: popularProfessionals,
        financials: {
            monthlySummary,
            annualSummary,
            // Mapeia para o formato esperado pela view, mantendo o ID original para exclusão
            allExpenses: allExpenses.map(exp => ({
                id: exp.originalId,
                date: exp.entry_date,
                description: exp.description,
                value: exp.value,
                type: exp.type,
                isVirtual: exp.isVirtual,
            }))
        }
    };
}


// --- 3. FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO E ATUALIZAÇÃO ---

/**
 * Busca os dados mais recentes, processa-os e atualiza a UI.
 * Esta é a função central que redesenha o dashboard.
 */
async function refreshUI() {
    const lastUpdatedEl = document.getElementById('last-updated');
    if (lastUpdatedEl) lastUpdatedEl.textContent = 'Atualizando...';

    try {
        const { settings, appointments, financialEntries } = await api.fetchAllDashboardData();
        const analytics = calculateAnalytics(appointments, financialEntries);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const futureAppointments = appointments
            .filter(app => new Date(app.appointment_datetime) >= today)
            .sort((a, b) => new Date(a.appointment_datetime) - new Date(b.appointment_datetime))
            .map(app => {
                const dateObj = new Date(app.appointment_datetime);

                const utcYear = dateObj.getUTCFullYear();
                const utcMonth = String(dateObj.getUTCMonth() + 1).padStart(2, '0');
                const utcDay = String(dateObj.getUTCDate()).padStart(2, '0');
                
                const utcHours = String(dateObj.getUTCHours()).padStart(2, '0');
                const utcMinutes = String(dateObj.getUTCMinutes()).padStart(2, '0');

                const displayDate = `${utcYear}-${utcMonth}-${utcDay}`;
                const displayTime = `${utcHours}:${utcMinutes}`;

                return {
                    id: app.id,
                    nome: app.client_name,
                    telefone: app.phone,
                    data: displayDate,
                    hora: displayTime,
                    servico: app.service,
                    preco: app.price,
                    professional: app.professional_name,
                    timestamp: app.created_at
                };
            });

        // O objeto 'financials' agora vem diretamente de 'analytics'
        setDashboardData({
            settings: {
                id: settings.id,
                professionals: settings.professionals || [],
                professionalSchedules: settings.professional_schedules || {},
                general: settings.general_schedule || {},
            },
            futureAppointments,
            financials: analytics.financials,
            analytics
        });

        const data = getDashboardData();
        const activeTabId = document.querySelector('.tab-button.active')?.dataset.tab || 'overview';

        populateAnalyticsTab(data.analytics);
        populateSchedulesTab(data.futureAppointments, handleEditAppointment, handleDeleteItem);
        populateFinanceTab(data.financials, handleAddExpense, handleDeleteItem);
        populateEmployeesTab(data.settings.professionals, data.settings.professionalSchedules, handleSaveEmployeesList, handleSaveEmployeeSchedule);
        populateGeneralSettingsTab(data.settings.general, handleSaveGeneralSettings);

        switchTab(activeTabId);

        if (lastUpdatedEl) lastUpdatedEl.textContent = `Última atualização: ${new Date().toLocaleTimeString('pt-BR')}`;

    } catch (error) {
        console.error("Falha ao atualizar a UI:", error);
        if (lastUpdatedEl) lastUpdatedEl.textContent = 'Erro ao carregar dados.';
    }
}


// --- 4. HANDLERS (Manipuladores de Eventos) ---

/**
 * Lida com a submissão do formulário de login.
 */
async function handleLogin(event) {
    event.preventDefault();
    const loginButton = document.getElementById('login-button');
    const loginErrorEl = document.getElementById('login-error');
    setButtonLoadingState(loginButton, 'Verificando...');
    loginErrorEl.textContent = '';

    const email = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const { success, error } = await api.signInUser(email, password);

    if (error) {
        loginErrorEl.textContent = 'Email ou senha inválidos.';
        restoreButtonState(loginButton, false, 'Entrar');
    } else {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('main-content').classList.remove('hidden');
        document.getElementById('main-content').classList.add('fade-in');
        await refreshUI();
    }
}

function handleEditAppointment(appointmentData) {
    const { settings } = getDashboardData();
    openEditModal(appointmentData, settings.professionals);
}

async function handleDeleteItem(itemId, tableName) {
    openDeleteModal(itemId, tableName);
}

async function handleConfirmDelete() {
    const button = document.getElementById('confirm-delete');
    const itemId = document.getElementById('delete-item-id').value;
    const tableName = document.getElementById('delete-table-name').value;

    setButtonLoadingState(button, 'Excluindo...');
    const { error } = await api.deleteItem(tableName, itemId);

    if (error) {
        restoreButtonState(button, false, 'Erro!');
    } else {
        restoreButtonState(button, true, 'Excluído!');
        await refreshUI();
        setTimeout(closeDeleteModal, 2000);
    }
}

async function handleSaveAppointment(event) {
    event.preventDefault();
    const button = document.getElementById('save-edit-appointment');
    const appointmentId = document.getElementById('edit-appointment-id').value;

    const appointmentDate = JSON.parse(document.getElementById('edit-appointment-data-wrapper').dataset.selectedValue);
    const appointmentTime = JSON.parse(document.getElementById('edit-appointment-hora-wrapper').dataset.selectedValue);
    const professionalName = JSON.parse(document.getElementById('edit-appointment-professional-wrapper').dataset.selectedValue);

    const updatedData = {
        client_name: document.getElementById('edit-appointment-nome').value,
        phone: document.getElementById('edit-appointment-telefone').value,
        appointment_datetime: `${appointmentDate}T${appointmentTime}:00`,
        service: document.getElementById('edit-appointment-servico').value,
        price: parseFloat(document.getElementById('edit-appointment-preco').value) || 0,
        professional_name: professionalName,
    };

    setButtonLoadingState(button);
    const { error } = await api.updateAppointment(appointmentId, updatedData);

    if (error) {
        console.error("Erro ao salvar o agendamento:", error);
        restoreButtonState(button, false, 'Erro!');
    } else {
        restoreButtonState(button, true, 'Salvo!');
        await refreshUI();
        setTimeout(closeEditModal, 2000);
    }
}

async function handleAddExpense(expenseData, formElement) {
    const button = formElement.querySelector('button[type="submit"]');
    setButtonLoadingState(button, 'Adicionando...');
    const { error } = await api.addExpense(expenseData);

    if (error) {
        restoreButtonState(button, false, 'Erro!');
    } else {
        restoreButtonState(button, true, 'Adicionado!');
        formElement.reset(); // Limpa o formulário após o sucesso
        await refreshUI();
    }
}

async function handleSaveSettings(settingsObject, button) {
    setButtonLoadingState(button);
    const { settings } = getDashboardData();
    const { error } = await api.saveSettings(settingsObject, settings.id);
    if (error) {
        restoreButtonState(button, false, 'Erro!');
    } else {
        await refreshUI();
        restoreButtonState(button, true, 'Salvo!');
    }
}

function handleSaveEmployeesList(list, button) {
    handleSaveSettings({ professionals: list }, button);
}

function handleSaveEmployeeSchedule(name, schedule, button) {
    const { settings } = getDashboardData();
    const updatedSchedules = { ...settings.professionalSchedules, [name]: schedule };
    handleSaveSettings({ professional_schedules: updatedSchedules }, button);
}

function handleSaveGeneralSettings(settings, button) {
    handleSaveSettings({ general_schedule: settings }, button);
}


// --- 5. INICIALIZAÇÃO DA APLICAÇÃO ---

/**
 * Função principal que inicializa a aplicação.
 */
function initializeApp() {
    setupMobileNav();

    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.querySelectorAll('.tab-button, .mobile-tab-button').forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    document.getElementById('cancel-edit-appointment').addEventListener('click', closeEditModal);
    document.getElementById('edit-appointment-form').addEventListener('submit', handleSaveAppointment);
    document.getElementById('cancel-delete').addEventListener('click', closeDeleteModal);
    document.getElementById('confirm-delete').addEventListener('click', handleConfirmDelete);

    switchTab('overview');
}

document.addEventListener('DOMContentLoaded', initializeApp);
