/**
 * @file Renderiza o conteúdo da aba "Configurações Gerais".
 * Gerencia o horário de funcionamento padrão do estabelecimento e as exceções.
 */

import { createCustomInput } from '../components/customInputs.js';

/**
 * Adiciona uma linha de exceção de horário na UI para as configurações gerais.
 * @param {HTMLElement} tbody - O container para a lista de exceções.
 * @param {object} [ex={}] - O objeto de exceção com data, start, end, desc.
 */
function addGeneralExceptionRow(tbody, ex = {}) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-5 gap-2 items-center';
    row.innerHTML = `
        <div class="sm:col-span-2" data-type="daterange"></div>
        <div data-type="time" data-time-type="start"></div>
        <div data-type="time" data-time-type="end"></div>
        <div class="flex items-center gap-2">
            <input type="text" value="${ex.desc || ''}" placeholder="Ex: Feriado" class="desc-input bg-interactive border border-main rounded-md p-2 w-full text-white">
            <button type="button" class="remove-row-button text-red-500 hover:text-red-400 p-1 rounded-full flex items-center justify-center w-8 h-8 transition-all">&times;</button>
        </div>`;
    tbody.appendChild(row);

    // Cria os inputs customizados para a nova linha.
    // Lida com o formato de dados antigo ('date') e o novo ('start_date', 'end_date') para compatibilidade.
    const dateValue = { 
        start: ex.start_date || ex.date, 
        end: ex.end_date || ex.date 
    };
    createCustomInput('daterange', row.querySelector('[data-type="daterange"]'), null, dateValue);
    createCustomInput('time', row.querySelector('[data-time-type="start"]'), null, ex.start || 'FECHADO');
    createCustomInput('time', row.querySelector('[data-time-type="end"]'), null, ex.end || 'FECHADO');

    // Adiciona o evento para remover a linha.
    row.querySelector('.remove-row-button').addEventListener('click', () => row.remove());
}

/**
 * Popula a aba "Configurações" e configura seus eventos.
 * @param {object} generalSettings - Objeto com os horários gerais (schedule, exceptions).
 * @param {Function} onSave - Callback para salvar as configurações gerais.
 */
export function populateGeneralSettingsTab(generalSettings = {}, onSave) {
    const container = document.getElementById('settings-tab');
    if (!container) return;

    container.innerHTML = `
        <div class="bg-card p-4 sm:p-6 rounded-lg shadow-lg">
            <div class="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4">
                <h2 class="text-2xl font-semibold">Configurações Gerais</h2>
                <button id="save-general-settings-button" class="bg-success hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto transition-all">Salvar Alterações</button>
            </div>
            <form id="general-settings-form" class="space-y-8">
                <div>
                    <h3 class="text-xl font-semibold mb-3 text-primary">Horário Padrão de Funcionamento</h3>
                    <div class="space-y-2" id="general-week-schedule-body"></div>
                </div>
                <div>
                    <h3 class="text-xl font-semibold mb-3 text-primary">Exceções e Feriados</h3>
                    <div class="space-y-2" id="general-exceptions-body"></div>
                    <button type="button" id="add-general-exception-button" class="mt-4 bg-info hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all">Adicionar Exceção</button>
                </div>
            </form>
        </div>`;

    const weekBody = container.querySelector('#general-week-schedule-body');
    const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const schedule = generalSettings.schedule || [];

    // Renderiza o editor de horário semanal.
    weekDays.forEach(day => {
        const daySchedule = schedule.find(d => d.day === day) || {};
        const dayId = day.toLowerCase().replace('-feira', '');
        const rowDiv = document.createElement('div');
        rowDiv.className = 'grid grid-cols-3 gap-4 items-center';
        rowDiv.innerHTML = `<div class="font-semibold">${day}</div><div id="general-start-${dayId}"></div><div id="general-end-${dayId}"></div>`;
        weekBody.appendChild(rowDiv);
        createCustomInput('time', rowDiv.querySelector(`#general-start-${dayId}`), null, daySchedule.start || '');
        createCustomInput('time', rowDiv.querySelector(`#general-end-${dayId}`), null, daySchedule.end || '');
    });

    const exceptionsBody = container.querySelector('#general-exceptions-body');
    const exceptions = generalSettings.exceptions || [];
    exceptions.forEach(ex => addGeneralExceptionRow(exceptionsBody, ex));

    // --- Event Listeners ---
    container.querySelector('#add-general-exception-button').addEventListener('click', () => {
        addGeneralExceptionRow(exceptionsBody);
    });

    container.querySelector('#save-general-settings-button').addEventListener('click', (e) => {
        e.preventDefault();
        const updatedSchedule = Array.from(document.querySelectorAll('#general-week-schedule-body > div')).map(div => ({
            day: div.firstElementChild.textContent,
            start: JSON.parse(div.children[1].dataset.selectedValue || '""'),
            end: JSON.parse(div.children[2].dataset.selectedValue || '""')
        }));
        const updatedExceptions = Array.from(document.querySelectorAll('#general-exceptions-body > div')).map(div => {
            const dateRange = JSON.parse(div.querySelector('[data-type="daterange"]').dataset.selectedValue || '{}');
            return {
                start_date: dateRange.start,
                end_date: dateRange.end,
                start: JSON.parse(div.children[1].dataset.selectedValue || '""'),
                end: JSON.parse(div.children[2].dataset.selectedValue || '""'),
                desc: div.querySelector('.desc-input').value
            };
        }).filter(ex => ex.start_date); // Garante que apenas exceções com data sejam salvas

        onSave({ schedule: updatedSchedule, exceptions: updatedExceptions }, e.currentTarget);
    });
}
