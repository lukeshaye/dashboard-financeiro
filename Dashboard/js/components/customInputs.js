/**
 * @file Módulo para criação de componentes de formulário customizados (Select, Datepicker, Timepicker).
 * Este módulo encapsula a lógica complexa para criar inputs interativos e estilizados
 * que não são facilmente customizáveis com CSS padrão.
 */

import { formatDateToBrazilian } from '../utils/formatters.js';

// O contêiner global onde todos os pop-ups serão renderizados.
const popupContainer = document.getElementById('popup-container');

/**
 * Fecha qualquer pop-up aberto com uma animação de fade-out.
 */
function closePopup() {
    const backdrop = popupContainer.querySelector('.popup-backdrop');
    if (backdrop) {
        backdrop.classList.remove('open');
        // Aguarda a animação de 300ms terminar antes de limpar o HTML.
        setTimeout(() => { popupContainer.innerHTML = ''; }, 300);
    }
}

/**
 * Abre um novo pop-up, inserindo o conteúdo fornecido em um backdrop.
 * @param {HTMLElement} contentElement - O elemento de conteúdo a ser exibido no pop-up.
 */
function openPopup(contentElement) {
    popupContainer.innerHTML = ''; // Limpa pop-ups anteriores.
    const backdrop = document.createElement('div');
    backdrop.className = 'popup-backdrop';
    
    // --- INÍCIO DA CORREÇÃO ---
    // Adiciona um z-index maior para garantir que este pop-up apareça sobre outros modais.
    backdrop.style.zIndex = '60';
    // --- FIM DA CORREÇÃO ---

    backdrop.appendChild(contentElement);
    popupContainer.appendChild(backdrop);

    // Força o navegador a aplicar a classe inicial antes de adicionar a classe 'open' para garantir a animação.
    backdrop.getBoundingClientRect();
    backdrop.classList.add('open');

    // Permite fechar o pop-up clicando no fundo escuro (backdrop).
    backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closePopup();
    });
}

/**
 * Cria o conteúdo de um pop-up de seleção (select).
 * @param {Array<Object>} options - As opções a serem exibidas.
 * @param {any} selectedValue - O valor atualmente selecionado.
 * @param {Function} onSelect - Callback a ser chamado quando uma opção é selecionada.
 * @returns {HTMLElement} O elemento de conteúdo do pop-up.
 */
function createSelectPopup(options, selectedValue, onSelect) {
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    const optionsContainer = document.createElement('div');
    optionsContainer.className = 'custom-select-options scrollable-list';

    options.forEach(opt => {
        const optionEl = document.createElement('div');
        optionEl.className = 'custom-select-option';
        optionEl.textContent = opt.label;
        optionEl.dataset.value = opt.value;
        if (opt.value === selectedValue) optionEl.classList.add('selected');
        if (opt.disabled) optionEl.classList.add('disabled');

        if (!opt.disabled) {
            optionEl.addEventListener('click', () => onSelect(opt.value, opt.label));
        }
        optionsContainer.appendChild(optionEl);
    });

    popupContent.appendChild(optionsContainer);
    return popupContent;
}

/**
 * CRIAÇÃO E CORREÇÃO DO CALENDÁRIO (DATE PICKER)
 * Esta função foi significativamente refatorada para corrigir o bug de seleção de período.
 *
 * @param {boolean} isRange - Define se o calendário é para selecionar um período (true) ou uma data única (false).
 * @param {string} initialStartDate - A data de início inicial no formato 'AAAA-MM-DD'.
 * @param {string} initialEndDate - A data de fim inicial no formato 'AAAA-MM-DD' (usado apenas se isRange for true).
 * @param {Function} onSelect - Callback chamado com as datas selecionadas após a confirmação.
 * @returns {HTMLElement} O elemento completo do pop-up de calendário.
 */
function createDatePickerPopup(isRange, initialStartDate, initialEndDate, onSelect) {
    const container = document.createElement('div');
    container.className = 'popup-content custom-datepicker-container';

    // Helper para converter strings 'AAAA-MM-DD' em objetos Date em UTC.
    // Usar UTC é crucial para evitar o "off-by-one-day error" causado por fusos horários.
    const parseDateUTC = (dateStr) => {
        if (!dateStr || typeof dateStr !== 'string') return null;
        const [year, month, day] = dateStr.split('-').map(Number);
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        return new Date(Date.UTC(year, month - 1, day));
    };

    // --- ESTADO DO COMPONENTE ---
    // As variáveis de estado que controlam o calendário.
    let startDate = parseDateUTC(initialStartDate);
    let endDate = isRange ? parseDateUTC(initialEndDate) : null;
    let viewDate = new Date(Date.UTC(
        (startDate || new Date()).getUTCFullYear(),
        (startDate || new Date()).getUTCMonth(),
        1
    ));
    const todayUTC = parseDateUTC(new Date().toISOString().split('T')[0]);

    /**
     * A função principal que renderiza (ou re-renderiza) todo o HTML do calendário.
     * Ela é chamada sempre que o estado (mês de visualização, datas selecionadas) muda.
     */
    const renderCalendar = () => {
        const year = viewDate.getUTCFullYear();
        const month = viewDate.getUTCMonth();
        const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

        let daysHtml = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => `<span>${d}</span>`).join('');
        
        const firstDayOfMonth = new Date(Date.UTC(year, month, 1)).getUTCDay();
        const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

        // Preenche os dias em branco do início do mês.
        for (let i = 0; i < firstDayOfMonth; i++) {
            daysHtml += `<div class="datepicker-day other-month"></div>`;
        }

        // Gera o HTML para cada dia do mês.
        for (let i = 1; i <= daysInMonth; i++) {
            const dayDate = new Date(Date.UTC(year, month, i));
            const dayDateStr = dayDate.toISOString().split('T')[0];
            const dayTime = dayDate.getTime();
            
            let classes = "datepicker-day";

            if (todayUTC && dayTime === todayUTC.getTime()) classes += " today";
            
            if (isRange) {
                const startTime = startDate ? startDate.getTime() : null;
                const endTime = endDate ? endDate.getTime() : null;

                if (startTime && endTime) {
                    if (dayTime === startTime) classes += " range-start";
                    if (dayTime === endTime) classes += " range-end";
                    if (dayTime > startTime && dayTime < endTime) classes += " in-range";
                    if (startTime === endTime && dayTime === startTime) classes += " range-single";
                } else if (startTime) {
                    if (dayTime === startTime) classes += " range-start range-single";
                }
            } else {
                if (startDate && dayTime === startDate.getTime()) classes += " selected";
            }
            
            daysHtml += `<div class="${classes}" data-date="${dayDateStr}">${i}</div>`;
        }

        // Monta o HTML final do componente.
        container.innerHTML = `
            <div class="datepicker-header">
                <button id="prev-month-btn"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg></button>
                <div class="datepicker-month-year">${monthNames[month]} ${year}</div>
                <button id="next-month-btn"><svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg></button>
            </div>
            <div class="datepicker-grid">${daysHtml}</div>
            ${isRange ? `
                <div class="datepicker-actions">
                    <button id="datepicker-cancel" type="button">Cancelar</button>
                    <button id="datepicker-apply" type="button" class="primary" ${!(startDate && endDate) ? 'disabled' : ''}>Aplicar</button>
                </div>
            ` : ''}
        `;

        // --- ADIÇÃO DOS EVENT LISTENERS ---
        // É importante adicionar os listeners *depois* de renderizar o HTML.

        // Botões de navegação de mês.
        container.querySelector('#prev-month-btn').addEventListener('click', () => {
            viewDate.setUTCMonth(viewDate.getUTCMonth() - 1);
            renderCalendar();
        });
        container.querySelector('#next-month-btn').addEventListener('click', () => {
            viewDate.setUTCMonth(viewDate.getUTCMonth() + 1);
            renderCalendar();
        });

        if (isRange) {
            // Botões de ação (Aplicar/Cancelar).
            container.querySelector('#datepicker-cancel').addEventListener('click', closePopup);
            container.querySelector('#datepicker-apply').addEventListener('click', () => {
                if (startDate && endDate) {
                    onSelect(startDate, endDate);
                }
            });
        }

        // Listener de clique para cada dia do calendário.
        container.querySelectorAll('.datepicker-day:not(.other-month)').forEach(dayEl => {
            dayEl.addEventListener('click', () => handleDayClick(dayEl));
        });
    };

    /**
     * LÓGICA DE CORREÇÃO DO BUG
     * Esta função centraliza a lógica de clique em um dia. Foi reescrita para ser mais explícita e evitar o bug.
     * @param {HTMLElement} dayEl - O elemento do dia que foi clicado.
     */
    const handleDayClick = (dayEl) => {
        const clickedDate = parseDateUTC(dayEl.dataset.date);
        if (!clickedDate) return;

        if (isRange) {
            // Caso 1: Nenhuma data selecionada, ou um período já está completo.
            // A ação é iniciar uma NOVA seleção de período.
            if (!startDate || (startDate && endDate)) {
                startDate = clickedDate;
                endDate = null; // Reseta a data de fim.
            }
            // Caso 2: Já existe uma data de início, mas não uma de fim.
            // A ação é COMPLETAR a seleção do período.
            else {
                // Se a data clicada for anterior à data de início, inverte as duas.
                if (clickedDate.getTime() < startDate.getTime()) {
                    endDate = startDate;
                    startDate = clickedDate;
                } else {
                    endDate = clickedDate; // Define a data de fim.
                }
            }
        } else {
            // Lógica para seleção de data única.
            startDate = clickedDate;
            onSelect(startDate, null); // Chama o callback imediatamente.
        }

        // Após qualquer mudança no estado, a UI é re-renderizada completamente.
        renderCalendar();
    };

    renderCalendar(); // Renderização inicial do componente.
    return container;
}


/**
 * Cria o conteúdo de um pop-up de seleção de tempo (time picker).
 * @param {string} initialTime - A hora inicial no formato 'HH:MM'.
 * @param {Function} onSelect - Callback chamado com a hora selecionada.
 * @returns {HTMLElement} O elemento de conteúdo do pop-up.
 */
function createTimePickerPopup(initialTime, onSelect) {
    const container = document.createElement('div');
    container.className = 'popup-content custom-timepicker-container';
    let [h, m] = initialTime && initialTime !== 'FECHADO' ? initialTime.split(':').map(Number) : [new Date().getHours(), new Date().getMinutes()];
    if (isNaN(h) || isNaN(m)) [h, m] = [new Date().getHours(), new Date().getMinutes()];
    let currentHour = h;
    let currentMinute = m;
    const hoursHtml = Array.from({ length: 24 }, (_, i) => `<div class="timepicker-item ${i === currentHour ? 'active' : ''}" data-value="${i}">${String(i).padStart(2, '0')}</div>`).join('');
    const minutesHtml = Array.from({ length: 60 }, (_, i) => `<div class="timepicker-item ${i === currentMinute ? 'active' : ''}" data-value="${i}">${String(i).padStart(2, '0')}</div>`).join('');
    container.innerHTML = `<div class="timepicker-header">Selecionar Horário</div><div class="timepicker-body-wrapper"><div class="timepicker-body"><div class="timepicker-selection-indicator"></div><div id="hours-scroller" class="timepicker-scroller"><div class="timepicker-scroller-content">${hoursHtml}</div></div><div class="timepicker-separator">:</div><div id="minutes-scroller" class="timepicker-scroller"><div class="timepicker-scroller-content">${minutesHtml}</div></div></div></div><div class="timepicker-actions"><button id="timepicker-cancel">Cancelar</button><button id="timepicker-ok" class="primary">OK</button><button id="timepicker-closed" class="danger">Fechado</button></div>`;
    const hoursScroller = container.querySelector('#hours-scroller');
    const minutesScroller = container.querySelector('#minutes-scroller');
    const itemHeight = 40;
    function setupScroller(scroller, initialValue, type) {
        setTimeout(() => { scroller.scrollTop = initialValue * itemHeight; }, 0);
        scroller.addEventListener('scroll', () => {
            const selectedIndex = Math.round(scroller.scrollTop / itemHeight);
            scroller.querySelectorAll('.timepicker-item').forEach((item, index) => {
                item.classList.toggle('active', index === selectedIndex);
            });
            if (type === 'hours') currentHour = selectedIndex;
            else currentMinute = selectedIndex;
        });
    }
    setupScroller(hoursScroller, currentHour, 'hours');
    setupScroller(minutesScroller, currentMinute, 'minutes');
    container.querySelector('#timepicker-ok').onclick = () => {
        onSelect(`${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`);
        closePopup();
    };
    container.querySelector('#timepicker-closed').onclick = () => {
        onSelect('FECHADO');
        closePopup();
    };
    container.querySelector('#timepicker-cancel').onclick = () => closePopup();
    return container;
}

/**
 * Função principal exportada que cria e inicializa um input customizado.
 * @param {string} type - O tipo de input ('select', 'date', 'daterange', 'time').
 * @param {HTMLElement} wrapper - O elemento container onde o input será inserido.
 * @param {Array<Object>} options - As opções (para 'select').
 * @param {any} selectedValue - O valor inicial.
 * @param {Function} onChangeCallback - Callback chamado quando o valor muda.
 */
export function createCustomInput(type, wrapper, options, selectedValue, onChangeCallback = null) {
    const inputId = `${type}-${Math.random().toString(36).substr(2, 9)}`;
    const icon = type.startsWith('date')
        ? `<svg class="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>`
        : type === 'time'
        ? `<svg class="h-5 w-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`
        : `<svg class="arrow h-5 w-5 text-muted" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" /></svg>`;
    
    let displayValue;
    if (type === 'date') {
        displayValue = formatDateToBrazilian(selectedValue);
    } else if (type === 'daterange') {
        const start = selectedValue?.start ? formatDateToBrazilian(selectedValue.start) : '--';
        const end = selectedValue?.end ? formatDateToBrazilian(selectedValue.end) : '--';
        displayValue = `${start} a ${end}`;
    } else if (type === 'select' && options) {
        const selectedOption = options.find(opt => opt.value === selectedValue);
        displayValue = selectedOption ? selectedOption.label : (options.length > 0 ? options[0].label : '--');
    } else {
        displayValue = selectedValue;
    }

    wrapper.innerHTML = `<div class="custom-input" id="${inputId}"><span class="truncate">${displayValue || '--'}</span>${icon}</div>`;
    wrapper.dataset.selectedValue = JSON.stringify(selectedValue);

    const trigger = wrapper.querySelector(`#${inputId}`);
    trigger.addEventListener('click', () => {
        if (trigger.classList.contains('disabled')) return;
        let popupContent;

        if (type === 'select') {
            popupContent = createSelectPopup(options, JSON.parse(wrapper.dataset.selectedValue || '""'), (newValue, newLabel) => {
                wrapper.dataset.selectedValue = JSON.stringify(newValue);
                trigger.querySelector('span').textContent = newLabel;
                if (onChangeCallback) onChangeCallback(newValue);
                closePopup();
            });
        } else if (type === 'date') {
            const currentVal = JSON.parse(wrapper.dataset.selectedValue || 'null');
            popupContent = createDatePickerPopup(false, currentVal, null, (newDate, _) => {
                const newDateStr = newDate.toISOString().split('T')[0];
                wrapper.dataset.selectedValue = JSON.stringify(newDateStr);
                trigger.querySelector('span').textContent = formatDateToBrazilian(newDateStr);
                if (onChangeCallback) onChangeCallback(newDateStr);
                closePopup();
            });
        } else if (type === 'daterange') {
            const currentVal = JSON.parse(wrapper.dataset.selectedValue || '{}');
            popupContent = createDatePickerPopup(true, currentVal.start, currentVal.end, (newStartDate, newEndDate) => {
                const newStartStr = newStartDate.toISOString().split('T')[0];
                const newEndStr = newEndDate.toISOString().split('T')[0];
                const newValue = { start: newStartStr, end: newEndStr };
                wrapper.dataset.selectedValue = JSON.stringify(newValue);
                trigger.querySelector('span').textContent = `${formatDateToBrazilian(newStartStr)} a ${formatDateToBrazilian(newEndStr)}`;
                if (onChangeCallback) onChangeCallback(newValue);
                closePopup();
            });
        } else if (type === 'time') {
            popupContent = createTimePickerPopup(JSON.parse(wrapper.dataset.selectedValue || '""'), (newTime) => {
                wrapper.dataset.selectedValue = JSON.stringify(newTime);
                trigger.querySelector('span').textContent = newTime;
                if (onChangeCallback) onChangeCallback(newTime);
            });
        }

        if (popupContent) openPopup(popupContent);
    });
}