/**
 * @file Renderiza o conteúdo da aba "Financeiro".
 * Constrói a UI para o resumo financeiro, balanço anual, formulário de despesas
 * e a tabela de despesas detalhadas.
 */

import { formatCurrency } from '../utils/formatters.js';
import { createChart } from '../ui/charts.js';
import { createCustomInput } from '../components/customInputs.js';

/**
 * Popula a aba "Financeiro" com os dados correspondentes.
 * @param {object} financials - Objeto com os dados financeiros (monthlySummary, annualSummary, allExpenses).
 * @param {Function} onAddExpense - Callback executado ao submeter o formulário de nova despesa.
 * @param {Function} onDelete - Callback executado ao clicar no botão de excluir uma despesa.
 */
export function populateFinanceTab(financials, onAddExpense, onDelete) {
    if (!financials) return;
    const container = document.getElementById('finance-tab');
    if (!container) return;

    // Estado para controlar o mês e ano de visualização
    let viewDate = new Date();

    // Função para renderizar a tabela de despesas para um mês/ano específico
    const renderExpensesTable = () => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();

        // Atualiza o display do mês
        const monthDisplay = document.getElementById('current-month-display');
        if (monthDisplay) {
            monthDisplay.textContent = viewDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        }

        const expensesForMonth = financials.allExpenses.filter(exp => {
            // Adiciona 'T00:00:00' para garantir que a data seja interpretada em UTC e evitar problemas de fuso horário
            const expDate = new Date(exp.date + 'T00:00:00');
            return expDate.getFullYear() === year && expDate.getMonth() === month;
        });

        let expensesHtml = '';
        if (expensesForMonth.length === 0) {
            expensesHtml = '<tr><td colspan="5" class="text-center py-4 text-muted">Nenhuma despesa registrada para este mês.</td></tr>';
        } else {
            expensesForMonth.forEach(exp => {
                const typeClass = exp.type === 'Fixa' ? 'bg-blue-500/20 text-blue-300' : 'bg-purple-500/20 text-purple-300';
                // O botão de deletar só aparece se a despesa não for uma "cópia virtual" de uma despesa fixa
                const deleteButtonHtml = !exp.isVirtual ? `
                    <button class="delete-btn text-muted hover:text-red-500 transition-colors" title="Excluir Despesa">
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" /></svg>
                    </button>
                ` : '';
                
                expensesHtml += `
                    <tr class="border-b border-main" data-id="${exp.id}" data-table-name="financial_entries">
                        <td class="py-3 px-4">${new Date(exp.date + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                        <td class="py-3 px-4">${exp.description}</td>
                        <td class="py-3 px-4 text-red-400">${formatCurrency(exp.value)}</td>
                        <td class="py-3 px-4"><span class="px-2 py-1 text-xs font-medium rounded-full ${typeClass}">${exp.type}</span></td>
                        <td class="py-3 px-4 text-right">${deleteButtonHtml}</td>
                    </tr>
                `;
            });
        }
        const tableBody = document.getElementById('expenses-table-body');
        if (tableBody) {
            tableBody.innerHTML = expensesHtml;
        }

        // Adiciona novamente os event listeners para os botões de delete
        document.querySelectorAll('#expenses-table-body .delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.currentTarget.closest('[data-id]');
                onDelete(row.dataset.id, row.dataset.tableName);
            });
        });
    };

    // Gera o HTML principal da aba apenas uma vez para evitar recriar listeners
    if (!container.innerHTML.trim()) {
        container.innerHTML = `
            <div class="space-y-8">
                <div>
                    <h2 class="text-2xl font-semibold mb-4">Resumo Financeiro (Mês Atual)</h2>
                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Lucro Bruto</p><p class="text-2xl font-bold text-green-400">${formatCurrency(financials.monthlySummary.revenue)}</p></div>
                        <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Despesas</p><p class="text-2xl font-bold text-red-400">${formatCurrency(financials.monthlySummary.expenses)}</p></div>
                        <div class="bg-card rounded-lg p-6 border border-main"><p class="text-muted text-sm">Lucro Líquido</p><p class="text-2xl font-bold ${financials.monthlySummary.netProfit >= 0 ? 'text-primary' : 'text-danger'}">${formatCurrency(financials.monthlySummary.netProfit)}</p></div>
                    </div>
                </div>

                <div class="bg-card rounded-lg p-6 border border-main">
                    <h2 class="text-xl font-semibold mb-4 text-primary">Balanço Anual</h2>
                    <div class="h-80"><canvas id="financeChart"></canvas></div>
                </div>

                <div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div class="lg:col-span-2 bg-card p-6 rounded-lg border border-main">
                        <h2 class="text-xl font-semibold mb-4">Adicionar Nova Despesa</h2>
                        <form id="add-expense-form" class="space-y-4">
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
        
        // Inicializa os componentes customizados no formulário.
        createCustomInput('select', container.querySelector('#expense-type-wrapper'), [{value: 'Fixa', label: 'Fixa'}, {value: 'Pontual', label: 'Pontual'}], 'Pontual');
        createCustomInput('date', container.querySelector('#expense-date-wrapper'), null, new Date().toISOString().split('T')[0]);

        // Adiciona os event listeners do formulário e dos botões de navegação de mês
        container.querySelector('#add-expense-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const expenseData = {
                description: document.getElementById('expense-desc').value,
                value: -Math.abs(parseFloat(document.getElementById('expense-value').value) || 0),
                type: document.getElementById('expense-type-wrapper').dataset.selectedValue,
                entry_date: document.getElementById('expense-date-wrapper').dataset.selectedValue,
            };
            onAddExpense(expenseData, e.currentTarget);
        });

        container.querySelector('#prev-month-btn').addEventListener('click', () => {
            viewDate.setMonth(viewDate.getMonth() - 1);
            renderExpensesTable();
        });

        container.querySelector('#next-month-btn').addEventListener('click', () => {
            viewDate.setMonth(viewDate.getMonth() + 1);
            renderExpensesTable();
        });

        // Cria o gráfico de balanço anual.
        createChart('financeChart', 'bar', financials.annualSummary,
            {
                y: { beginAtZero: true, ticks: { color: 'var(--color-text-muted)' }, grid: { color: 'var(--color-border-main)' } },
                x: { ticks: { color: 'var(--color-text-muted)' }, grid: { display: false } }
            },
            [
                { label: 'Faturamento', data: financials.annualSummary.revenueData, backgroundColor: 'var(--chart-color-4)' },
                { label: 'Despesas', data: financials.annualSummary.expenseData, backgroundColor: 'var(--chart-color-3)' }
            ]
        );
    } else {
        // Se o HTML já existe, apenas atualiza os dados dinâmicos
        container.querySelector('.text-green-400').textContent = formatCurrency(financials.monthlySummary.revenue);
        container.querySelector('.text-red-400').textContent = formatCurrency(financials.monthlySummary.expenses);
        const netProfitEl = container.querySelector('.text-2xl.font-bold:not(.text-green-400):not(.text-red-400)');
        netProfitEl.textContent = formatCurrency(financials.monthlySummary.netProfit);
        netProfitEl.className = `text-2xl font-bold ${financials.monthlySummary.netProfit >= 0 ? 'text-primary' : 'text-danger'}`;
    }

    // Renderiza a tabela para o mês atual
    renderExpensesTable();
}
