/**
 * @file Renderiza o conteúdo da aba "Financeiro".
 * Constrói a UI para o resumo financeiro, balanço anual, formulário de despesas
 * e a tabela de despesas detalhadas.
 * @version 3.3 - Corrigido bug sutil no tratamento de callbacks assíncronos.
 * - Adicionado async/await para as chamadas onAddExpense e onDelete para garantir o tratamento correto de erros e estados de UI.
 * - Adicionado feedback visual (botão desabilitado) durante a exclusão.
 */

import { formatCurrency } from '../utils/formatters.js';
import { createChart } from '../ui/charts.js';
import { createCustomInput } from '../components/customInputs.js';

// Armazena a instância do gráfico para que possa ser destruída antes de recriar.
let financeChartInstance = null;
// Estado para controlar o mês e ano de visualização.
let viewDate = new Date();
// Armazena as referências mais recentes dos dados e callbacks.
let currentFinancials = null;
let currentOnAddExpense = null;
let currentOnDelete = null;

// Constantes para seletores do DOM para evitar erros de digitação e facilitar a manutenção.
const SELECTORS = {
    FINANCE_TAB: '#finance-tab',
    SUMMARY_TITLE: '[data-summary="title"]',
    SUMMARY_REVENUE: '[data-summary="revenue"]',
    SUMMARY_EXPENSES: '[data-summary="expenses"]',
    SUMMARY_NET_PROFIT: '[data-summary="netProfit"]',
    FINANCE_CHART: '#financeChart',
    EXPENSE_FORM: '#add-expense-form',
    EXPENSE_DESC: '#expense-desc',
    EXPENSE_VALUE: '#expense-value',
    EXPENSE_TYPE_WRAPPER: '#expense-type-wrapper',
    EXPENSE_DATE_WRAPPER: '#expense-date-wrapper',
    ADD_EXPENSE_BTN: '#add-expense-button',
    EXPENSES_TABLE_BODY: '#expenses-table-body',
    CURRENT_MONTH_DISPLAY: '#current-month-display',
    PREV_MONTH_BTN: '#prev-month-btn',
    NEXT_MONTH_BTN: '#next-month-btn',
    DELETE_BTN: '.delete-btn',
};


/**
 * Analisa uma string de data no formato 'AAAA-MM-DD' de forma segura, usando UTC para evitar problemas de fuso horário.
 * @param {string} dateString - A data no formato 'AAAA-MM-DD'.
 * @returns {Date} - Um objeto Date correspondente ou uma data inválida se a entrada for incorreta.
 */
function parseDateSafely(dateString) {
    if (!dateString || typeof dateString !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date('invalid');
    }
    const parts = dateString.split('-').map(Number);
    return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
}


/**
 * Calcula o resumo de faturamento, despesas e lucro para um conjunto de entradas.
 * @param {Array<object>} entries - A lista de entradas financeiras.
 * @returns {object} - Um objeto contendo { revenue, expenses, netProfit }.
 */
function calculateSummary(entries) {
    const summary = entries.reduce((acc, entry) => {
        if (entry.value > 0) {
            acc.revenue += entry.value;
        } else if (entry.value < 0) {
            acc.expenses += entry.value;
        }
        return acc;
    }, { revenue: 0, expenses: 0 });

    summary.netProfit = summary.revenue + summary.expenses;
    return summary;
}

/**
 * Renderiza a tabela de despesas de forma segura e performática, prevenindo XSS.
 * @param {Array<object>} expenses - Lista de despesas do mês.
 * @param {HTMLElement} tableBody - O elemento tbody da tabela.
 * @param {string} tableName - O nome da tabela de dados para o dataset do botão de exclusão.
 */
function renderExpensesTable(expenses, tableBody, tableName) {
    tableBody.innerHTML = '';

    if (expenses.length === 0) {
        const row = tableBody.insertRow();
        const cell = row.insertCell();
        cell.colSpan = 5;
        cell.className = 'text-center py-4 text-muted';
        cell.textContent = 'Nenhuma despesa registrada para este mês.';
        return;
    }
    
    const fragment = document.createDocumentFragment();
    expenses
        .sort((a, b) => parseDateSafely(b.date) - parseDateSafely(a.date))
        .forEach(exp => {
            const row = document.createElement('tr');
            row.className = 'border-b border-main';

            const formattedDate = parseDateSafely(exp.date).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
            const typeClass = exp.type === 'Fixa' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300';
            
            const cellDate = document.createElement('td');
            cellDate.className = 'py-3 px-4';
            cellDate.textContent = formattedDate;

            const cellDesc = document.createElement('td');
            cellDesc.className = 'py-3 px-4';
            cellDesc.textContent = exp.description;

            const cellValue = document.createElement('td');
            cellValue.className = 'py-3 px-4 text-red-400';
            cellValue.textContent = formatCurrency(exp.value);

            const cellType = document.createElement('td');
            cellType.className = 'py-3 px-4';
            const typeSpan = document.createElement('span');
            typeSpan.className = `px-2 py-1 text-xs font-medium rounded-full ${typeClass}`;
            typeSpan.textContent = exp.type;
            cellType.appendChild(typeSpan);

            const cellAction = document.createElement('td');
            cellAction.className = 'py-3 px-4 text-right';
            if (!exp.isVirtual) {
                const button = document.createElement('button');
                button.className = 'delete-btn text-muted hover:text-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
                button.title = 'Excluir Despesa';
                button.dataset.id = exp.id;
                button.dataset.tableName = tableName;
                button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 pointer-events-none" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>`;
                cellAction.appendChild(button);
            }
            
            row.append(cellDate, cellDesc, cellValue, cellType, cellAction);
            fragment.appendChild(row);
        });
    
    tableBody.appendChild(fragment);
}


/**
 * Atualiza a UI com os dados do mês/ano atualmente selecionados.
 * @param {string} tableName - O nome da tabela de dados para passar para a renderização da tabela.
 */
function updateDisplayedMonthData(tableName) {
    if (!currentFinancials) return;

    const year = viewDate.getUTCFullYear();
    const month = viewDate.getUTCMonth();
    const container = document.querySelector(SELECTORS.FINANCE_TAB);
    if (!container) return;

    const entriesForMonth = currentFinancials.allEntries.filter(entry => {
        const entryDate = parseDateSafely(entry.date);
        return entryDate.getUTCFullYear() === year && entryDate.getUTCMonth() === month;
    });

    const expensesForMonth = entriesForMonth.filter(entry => entry.value < 0);
    
    const summaryData = calculateSummary(entriesForMonth);
    
    container.querySelector(SELECTORS.SUMMARY_REVENUE).textContent = formatCurrency(summaryData.revenue);
    container.querySelector(SELECTORS.SUMMARY_EXPENSES).textContent = formatCurrency(Math.abs(summaryData.expenses));
    
    const netProfitEl = container.querySelector(SELECTORS.SUMMARY_NET_PROFIT);
    netProfitEl.textContent = formatCurrency(summaryData.netProfit);
    netProfitEl.className = `text-2xl font-bold ${summaryData.netProfit >= 0 ? 'text-primary' : 'text-danger'}`;
    
    const now = new Date();
    const nowUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    
    const title = nowUTC.getUTCFullYear() === year && nowUTC.getUTCMonth() === month 
        ? 'Resumo Financeiro (Mês Atual)'
        : `Resumo Financeiro (${viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })})`;
    container.querySelector(SELECTORS.SUMMARY_TITLE).textContent = title;
    container.querySelector(SELECTORS.CURRENT_MONTH_DISPLAY).textContent = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

    const tableBody = container.querySelector(SELECTORS.EXPENSES_TABLE_BODY);
    if (tableBody) {
        renderExpensesTable(expensesForMonth, tableBody, tableName);
    } else {
        console.warn(`Elemento '${SELECTORS.EXPENSES_TABLE_BODY}' não encontrado. A tabela de despesas não pode ser renderizada.`);
    }
}

/**
 * Exibe uma mensagem de erro visualmente no formulário.
 * @param {HTMLElement} field - O campo de input ou wrapper com erro.
 * @param {string} message - A mensagem de erro.
 */
function showFormError(field, message) {
    clearFormError(field);
    const error = document.createElement('p');
    error.className = 'form-error-message text-red-500 text-xs mt-1';
    error.textContent = message;
    field.parentNode.appendChild(error);
    field.classList.add('border-red-500');
}

/**
 * Remove a mensagem de erro de um campo do formulário.
 * @param {HTMLElement} field - O campo de input ou wrapper.
 */
function clearFormError(field) {
    const parent = field.parentNode;
    const oldError = parent.querySelector('.form-error-message');
    if (oldError) {
        parent.removeChild(oldError);
    }
    field.classList.remove('border-red-500');
}

/**
 * Retorna a data de hoje no formato AAAA-MM-DD, baseado na data local do usuário.
 * @returns {string} A data formatada.
 */
function getTodayLocalString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Reseta todos os campos do formulário para seus valores padrão.
 * @param {HTMLElement} container - O elemento que contém os wrappers dos inputs.
 */
function resetFormAndCustomInputs(container) {
    const descInput = container.querySelector(SELECTORS.EXPENSE_DESC);
    const valueInput = container.querySelector(SELECTORS.EXPENSE_VALUE);
    if (descInput) descInput.value = '';
    if (valueInput) valueInput.value = '';

    const typeWrapper = container.querySelector(SELECTORS.EXPENSE_TYPE_WRAPPER);
    const dateWrapper = container.querySelector(SELECTORS.EXPENSE_DATE_WRAPPER);
    
    if (typeWrapper) {
        createCustomInput('select', typeWrapper, [{value: 'Fixa', label: 'Fixa'}, {value: 'Pontual', label: 'Pontual'}], 'Pontual');
    }
    if (dateWrapper) {
        createCustomInput('date', dateWrapper, null, getTodayLocalString());
    }
}

/**
 * Popula a aba "Financeiro" com dados e anexa os event listeners.
 * @param {object} financials - Dados financeiros.
 * @param {Function} onAddExpense - Callback para adicionar despesa.
 * @param {Function} onDelete - Callback para excluir despesa.
 * @param {string} [tableName='financial_entries'] - O nome da tabela de dados para operações de exclusão.
 */
export function populateFinanceTab(financials, onAddExpense, onDelete, tableName = 'financial_entries') {
    if (!financials) {
        console.warn("Dados financeiros não fornecidos para populateFinanceTab.");
        return;
    }
    const container = document.querySelector(SELECTORS.FINANCE_TAB);
    if (!container) {
        console.warn(`Container principal '${SELECTORS.FINANCE_TAB}' não encontrado. A aba financeira não será populada.`);
        return;
    }
    
    currentFinancials = financials; 
    currentOnAddExpense = onAddExpense;
    currentOnDelete = onDelete;
    
    viewDate = new Date();

    if (!container.innerHTML.trim()) {
        container.innerHTML = `
            <div class="space-y-8">
                <div>
                    <h2 class="text-2xl font-semibold mb-4" data-summary="title"></h2>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Lucro Bruto</p><p class="text-2xl font-bold text-green-400" data-summary="revenue"></p></div>
                        <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Despesas</p><p class="text-2xl font-bold text-red-400" data-summary="expenses"></p></div>
                        <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Lucro Líquido</p><p class="text-2xl font-bold" data-summary="netProfit"></p></div>
                    </div>
                </div>
                <div class="bg-card rounded-lg p-6 border border-main">
                    <h2 class="text-xl font-semibold mb-4 text-primary">Balanço Anual</h2>
                    <div class="h-80"><canvas id="financeChart"></canvas></div>
                </div>
                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div class="lg:col-span-2 bg-card p-6 rounded-lg border border-main">
                        <h2 class="text-xl font-semibold mb-4">Adicionar Nova Despesa</h2>
                        <form id="add-expense-form" class="space-y-4" novalidate>
                            <div><label for="expense-desc" class="text-sm">Descrição</label><input type="text" id="expense-desc" class="mt-1 bg-interactive border border-main rounded-md p-2 w-full text-white" required></div>
                            <div><label for="expense-value" class="text-sm">Valor (R$)</label><input type="number" step="0.01" id="expense-value" class="mt-1 bg-interactive border border-main rounded-md p-2 w-full text-white" required></div>
                            <div><label class="text-sm">Tipo</label><div id="expense-type-wrapper" class="mt-1"></div></div>
                            <div><label class="text-sm">Data</label><div id="expense-date-wrapper" class="mt-1"></div></div>
                            <button type="submit" id="add-expense-button" class="w-full bg-info hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all">Adicionar Despesa</button>
                        </form>
                    </div>
                    <div class="lg:col-span-3 bg-card p-6 rounded-lg border border-main">
                        <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                            <h2 class="text-xl font-semibold">Detalhes das Despesas</h2>
                            <div class="flex items-center gap-2">
                                <button id="prev-month-btn" class="p-2 rounded-md bg-interactive hover:bg-interactive-hover transition-colors">&lt;</button>
                                <span id="current-month-display" class="font-semibold text-primary text-center w-32"></span>
                                <button id="next-month-btn" class="p-2 rounded-md bg-interactive hover:bg-interactive-hover transition-colors">&gt;</button>
                            </div>
                        </div>
                        <div class="overflow-x-auto max-h-96 scrollable-list">
                            <table class="w-full text-left">
                                <thead class="sticky top-0 bg-card">
                                    <tr class="border-b border-main"><th class="py-2 px-4 font-semibold">Data</th><th class="py-2 px-4 font-semibold">Descrição</th><th class="py-2 px-4 font-semibold">Valor</th><th class="py-2 px-4 font-semibold">Tipo</th><th></th></tr>
                                </thead>
                                <tbody id="expenses-table-body"></tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        `;

        resetFormAndCustomInputs(container);

        const expenseForm = container.querySelector(SELECTORS.EXPENSE_FORM);
        const descInput = container.querySelector(SELECTORS.EXPENSE_DESC);
        const valueInput = container.querySelector(SELECTORS.EXPENSE_VALUE);
        const dateWrapper = container.querySelector(SELECTORS.EXPENSE_DATE_WRAPPER);
        const submitButton = container.querySelector(SELECTORS.ADD_EXPENSE_BTN);

        descInput.addEventListener('input', () => clearFormError(descInput));
        valueInput.addEventListener('input', () => clearFormError(valueInput));
        new MutationObserver(() => clearFormError(dateWrapper)).observe(dateWrapper, { attributes: true, attributeFilter: ['data-selected-value'] });
        
        // CORREÇÃO: Tornar o handler assíncrono para aguardar o callback.
        expenseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const description = descInput.value.trim();
            const value = parseFloat(valueInput.value) || 0;
            const dateValue = dateWrapper.dataset.selectedValue;

            let hasError = false;
            if (!description) {
                showFormError(descInput, "A descrição não pode estar vazia.");
                hasError = true;
            }
            if (value <= 0) {
                showFormError(valueInput, "O valor da despesa deve ser maior que zero.");
                hasError = true;
            }
            if (isNaN(parseDateSafely(dateValue).getTime())) {
                showFormError(dateWrapper, "A data selecionada é inválida.");
                hasError = true;
            }
            if (hasError) return;

            const expenseData = {
                description,
                value: -Math.abs(value),
                type: container.querySelector(SELECTORS.EXPENSE_TYPE_WRAPPER).dataset.selectedValue,
                date: dateValue,
            };
            
            submitButton.disabled = true;
            submitButton.textContent = 'Adicionando...';
            
            try {
                if (currentOnAddExpense) {
                    await currentOnAddExpense(expenseData); // Aguarda a conclusão
                }
                resetFormAndCustomInputs(container);
                descInput.focus();
            } catch (error) {
                console.error("Falha ao adicionar despesa:", error);
                // Opcional: Mostrar um erro para o usuário aqui (ex: com um toast)
            } finally {
                submitButton.disabled = false;
                submitButton.textContent = 'Adicionar Despesa';
            }
        });

        const changeMonth = (offset) => {
            viewDate.setUTCDate(1);
            viewDate.setUTCMonth(viewDate.getUTCMonth() + offset);
            updateDisplayedMonthData(tableName);
        };

        container.querySelector(SELECTORS.PREV_MONTH_BTN).addEventListener('click', () => changeMonth(-1));
        container.querySelector(SELECTORS.NEXT_MONTH_BTN).addEventListener('click', () => changeMonth(1));
        
        // CORREÇÃO: Tornar o handler assíncrono para aguardar o callback.
        container.querySelector(SELECTORS.EXPENSES_TABLE_BODY).addEventListener('click', async (e) => {
            const deleteButton = e.target.closest(SELECTORS.DELETE_BTN);
            if (deleteButton && currentOnDelete) {
                deleteButton.disabled = true; // MELHORIA: Feedback visual imediato
                try {
                    await currentOnDelete(deleteButton.dataset.id, deleteButton.dataset.tableName); // Aguarda a conclusão
                } catch (error) {
                    console.error(`Falha ao excluir item ${deleteButton.dataset.id}:`, error);
                    deleteButton.disabled = false; // Reativa o botão em caso de erro
                }
            }
        });
    }

    if (financeChartInstance) {
        financeChartInstance.destroy();
    }
    const chartCanvasId = SELECTORS.FINANCE_CHART.substring(1);
    financeChartInstance = createChart(chartCanvasId, 'bar', currentFinancials.annualSummary,
        {
            y: { beginAtZero: true, ticks: { color: 'var(--color-text-muted)' }, grid: { color: 'var(--color-border-main)' } },
            x: { ticks: { color: 'var(--color-text-muted)' }, grid: { display: false } }
        },
        [
            { label: 'Faturamento', data: currentFinancials.annualSummary.revenueData, backgroundColor: 'var(--chart-color-4)' },
            { label: 'Despesas', data: currentFinancials.annualSummary.expenseData, backgroundColor: 'var(--chart-color-3)' }
        ]
    );

    updateDisplayedMonthData(tableName);
}
