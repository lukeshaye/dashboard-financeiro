/**
 * @file Renderiza o conteúdo da aba "Funcionários".
 * Gerencia a lista de profissionais e seus respectivos horários de trabalho e exceções.
 */

import { createCustomInput } from '../components/customInputs.js';

// --- Funções Auxiliares de Renderização ---

function addEmployeeRow(container, name) {
    const div = document.createElement('div');
    div.className = 'flex items-center gap-2 bg-interactive p-2 rounded';
    div.innerHTML = `<span class="employee-name flex-grow">${name}</span><button type="button" class="remove-row-button text-red-500 hover:text-red-400 font-bold p-1 rounded-full flex items-center justify-center w-6 h-6 transition-all">X</button>`;
    container.appendChild(div);
    div.querySelector('.remove-row-button').addEventListener('click', () => div.remove());
}

/**
 * Adiciona uma linha de exceção de horário na UI.
 * @param {HTMLElement} tbody - O corpo da tabela de exceções.
 * @param {object} [ex={}] - O objeto de exceção com start_date, end_date, start, end, desc.
 */
function addEmployeeExceptionRow(tbody, ex = {}) {
    const row = document.createElement('div');
    row.className = 'grid grid-cols-1 sm:grid-cols-5 gap-2 items-center';
    row.innerHTML = `
        <div class="sm:col-span-2" data-type="daterange"></div>
        <div data-type="time" data-time-type="start"></div>
        <div data-type="time" data-time-type="end"></div>
        <div class="flex items-center gap-2">
            <input type="text" value="${ex.desc || ''}" placeholder="Ex: Férias" class="desc-input bg-interactive border border-main rounded-md p-2 w-full text-white">
            <button type="button" class="remove-row-button text-red-500 hover:text-red-400 p-1 rounded-full flex items-center justify-center w-8 h-8 transition-all">&times;</button>
        </div>`;
    tbody.appendChild(row);

    // Usa o novo tipo 'daterange'
    const dateValue = { start: ex.start_date, end: ex.end_date };
    createCustomInput('daterange', row.querySelector('[data-type="daterange"]'), null, dateValue);
    
    createCustomInput('time', row.querySelector('[data-time-type="start"]'), null, ex.start || 'FECHADO');
    createCustomInput('time', row.querySelector('[data-time-type="end"]'), null, ex.end || 'FECHADO');

    row.querySelector('.remove-row-button').addEventListener('click', () => row.remove());
}

function displayEmployeeSchedule(professionalName, professionalSchedules) {
    const managerDiv = document.getElementById('employee-schedule-manager');
    const saveButton = document.getElementById('save-employee-schedule-button');
    if (!professionalName) {
        managerDiv.classList.add('hidden');
        saveButton.disabled = true;
        return;
    }
    managerDiv.classList.remove('hidden');
    saveButton.disabled = false;
    const schedule = professionalSchedules[professionalName] || { standard: [], exceptions: [] };
    const weekDays = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
    const weekBody = document.getElementById('employee-week-schedule-body');
    const lunchBody = document.getElementById('employee-lunch-schedule-body');
    weekBody.innerHTML = '';
    lunchBody.innerHTML = '';
    weekDays.forEach(day => {
        const daySchedule = schedule.standard.find(d => d.day === day) || {};
        const dayId = day.toLowerCase().replace('-feira', '');
        const workRow = document.createElement('div');
        workRow.className = 'grid grid-cols-3 gap-4 items-center';
        workRow.innerHTML = `<div class="font-semibold">${day}</div><div id="emp-start-${dayId}"></div><div id="emp-end-${dayId}"></div>`;
        weekBody.appendChild(workRow);
        createCustomInput('time', workRow.querySelector(`#emp-start-${dayId}`), null, daySchedule.start || '');
        createCustomInput('time', workRow.querySelector(`#emp-end-${dayId}`), null, daySchedule.end || '');
        const lunchRow = document.createElement('div');
        lunchRow.className = 'grid grid-cols-3 gap-4 items-center';
        lunchRow.innerHTML = `<div class="font-semibold">${day}</div><div id="emp-lunch-start-${dayId}"></div><div id="emp-lunch-end-${dayId}"></div>`;
        lunchBody.appendChild(lunchRow);
        createCustomInput('time', lunchRow.querySelector(`#emp-lunch-start-${dayId}`), null, daySchedule.lunchStart || '');
        createCustomInput('time', lunchRow.querySelector(`#emp-lunch-end-${dayId}`), null, daySchedule.lunchEnd || '');
    });
    const exceptionsBody = document.getElementById('employee-exceptions-body');
    exceptionsBody.innerHTML = '';
    (schedule.exceptions || []).forEach(ex => addEmployeeExceptionRow(exceptionsBody, ex));
}

// --- Função Principal Exportada ---
export function populateEmployeesTab(professionals = [], professionalSchedules = {}, onSaveList, onSaveSchedule) {
    const container = document.getElementById('employees-tab');
    if (!container) return;
    container.innerHTML = `<div class="bg-card p-4 sm:p-6 rounded-lg shadow-lg"><div class="grid grid-cols-1 lg:grid-cols-3 gap-x-12 gap-y-8"><div class="lg:col-span-1"><h2 class="text-2xl font-semibold mb-2">Profissionais</h2><p class="text-sm text-muted mb-4">Adicione e remova os profissionais da sua equipe.</p><div id="employees-list" class="space-y-2 mb-4 scrollable-list max-h-96"></div><div class="flex flex-col sm:flex-row gap-2 mb-4"><input type="text" id="new-employee-name" placeholder="Nome do profissional" class="bg-interactive border border-main rounded-md p-2 w-full text-white flex-grow"><button type="button" id="add-employee-button" class="bg-info hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all">Adicionar</button></div><button id="save-employees-button" class="bg-success hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg w-full transition-all">Salvar Lista de Profissionais</button></div><div class="lg:col-span-2"><div class="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-4"><div><h2 class="text-2xl font-semibold">Horários do Profissional</h2><p class="text-sm text-muted">Selecione um profissional para editar seus horários.</p></div><button id="save-employee-schedule-button" class="bg-success hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto transition-all" disabled>Salvar Horários</button></div><div class="mb-4"><div id="employee-selector-wrapper"></div></div><div id="employee-schedule-manager" class="hidden space-y-8"><div><h3 class="text-xl font-semibold mb-3 text-primary">Horário Padrão</h3><div class="space-y-2" id="employee-week-schedule-body"></div></div><div class="mt-8"><h3 class="text-xl font-semibold mb-3 text-primary">Horário de Almoço</h3><div class="space-y-2" id="employee-lunch-schedule-body"></div></div><div><h3 class="text-xl font-semibold mb-3 text-primary">Exceções e Férias</h3><div class="space-y-2" id="employee-exceptions-body"></div><button type="button" id="add-employee-exception-button" class="mt-4 bg-info hover:opacity-90 text-white font-bold py-2 px-4 rounded-lg transition-all">Adicionar Exceção</button></div></div></div></div></div>`;
    const employeesListContainer = container.querySelector('#employees-list');
    professionals.forEach(name => addEmployeeRow(employeesListContainer, name));
    const employeeOptions = [{ value: '', label: '-- Selecione --', disabled: true }, ...professionals.map(name => ({ value: name, label: name }))];
    createCustomInput('select', container.querySelector('#employee-selector-wrapper'), employeeOptions, '', (selectedValue) => {
        displayEmployeeSchedule(selectedValue, professionalSchedules);
    });
    container.querySelector('#add-employee-button').addEventListener('click', () => {
        const input = document.getElementById('new-employee-name');
        if (input.value.trim()) {
            addEmployeeRow(employeesListContainer, input.value.trim());
            input.value = '';
        }
    });
    container.querySelector('#add-employee-exception-button').addEventListener('click', () => {
        addEmployeeExceptionRow(document.getElementById('employee-exceptions-body'));
    });
    container.querySelector('#save-employees-button').addEventListener('click', (e) => {
        const updatedProfessionals = Array.from(document.querySelectorAll('#employees-list .employee-name')).map(span => span.textContent);
        onSaveList(updatedProfessionals, e.currentTarget);
    });
    container.querySelector('#save-employee-schedule-button').addEventListener('click', (e) => {
        const professionalName = JSON.parse(document.getElementById('employee-selector-wrapper').dataset.selectedValue);
        if (!professionalName) return;
        
        const standard = Array.from(document.querySelectorAll('#employee-week-schedule-body > div')).map(div => ({
            day: div.firstElementChild.textContent,
            start: JSON.parse(div.children[1].dataset.selectedValue),
            end: JSON.parse(div.children[2].dataset.selectedValue),
        }));
        const lunch = Array.from(document.querySelectorAll('#employee-lunch-schedule-body > div')).map(div => ({
            day: div.firstElementChild.textContent,
            lunchStart: JSON.parse(div.children[1].dataset.selectedValue),
            lunchEnd: JSON.parse(div.children[2].dataset.selectedValue),
        }));
        const combinedStandard = standard.map(s => ({ ...s, ...lunch.find(l => l.day === s.day) }));
        
        // *** INÍCIO DA CORREÇÃO ***
        // O problema principal estava aqui. Se uma nova linha de exceção fosse adicionada,
        // o valor em 'dataset.selectedValue' estaria vazio, causando um erro ao tentar
        // usar JSON.parse(). Isso quebrava toda a função de salvar.
        // A correção adiciona uma verificação para garantir que os valores existam
        // antes de tentar processá-los, tornando o código mais seguro e funcional.
        const exceptions = Array.from(document.querySelectorAll('#employee-exceptions-body > div')).map(div => {
            const dateRangeJSON = div.querySelector('[data-type="daterange"]').dataset.selectedValue;
            const dateRange = dateRangeJSON ? JSON.parse(dateRangeJSON) : {};

            const startTimeJSON = div.children[1].dataset.selectedValue;
            const startTime = startTimeJSON ? JSON.parse(startTimeJSON) : "";
            
            const endTimeJSON = div.children[2].dataset.selectedValue;
            const endTime = endTimeJSON ? JSON.parse(endTimeJSON) : "";

            return {
                start_date: dateRange.start || null,
                end_date: dateRange.end || null,
                start: startTime,
                end: endTime,
                desc: div.querySelector('.desc-input').value
            };
        }).filter(ex => ex.start_date); // Garante que apenas exceções com data sejam salvas.
        // *** FIM DA CORREÇÃO ***

        onSaveSchedule(professionalName, { standard: combinedStandard, exceptions }, e.currentTarget);
    });
}
