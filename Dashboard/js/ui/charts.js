/**
 * @file Módulo responsável pela criação e gerenciamento de gráficos com Chart.js.
 * Encapsula a lógica para renderizar diferentes tipos de gráficos,
 * garantindo que a configuração e a estilização sejam consistentes.
 */

// Um objeto para manter as instâncias dos gráficos, evitando poluir o escopo global (window).
const chartInstances = {};

/**
 * Cria ou atualiza um gráfico em um elemento <canvas>.
 * Destrói qualquer instância de gráfico anterior no mesmo canvas para evitar vazamentos de memória.
 * @param {string} canvasId - O ID do elemento <canvas> onde o gráfico será renderizado.
 * @param {string} type - O tipo de gráfico (ex: 'bar', 'doughnut').
 * @param {object} chartData - Os dados para o gráfico, geralmente com as propriedades { labels: [], data: [] }.
 * @param {object | null} [scales=null] - A configuração dos eixos (scales) para o Chart.js.
 * @param {Array | null} [customDatasets=null] - Permite passar uma estrutura de datasets mais complexa.
 */
export function createChart(canvasId, type, chartData, scales = null, customDatasets = null) {
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) {
        console.error(`Canvas com ID "${canvasId}" não encontrado.`);
        return;
    }

    // Se já existe um gráfico nesse canvas, destrói a instância anterior.
    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    const style = getComputedStyle(document.documentElement);

    let datasets;
    if (customDatasets) {
        // Mapeia os datasets customizados para resolver as variáveis CSS de cor.
        datasets = customDatasets.map(ds => ({
            ...ds,
            backgroundColor: ds.backgroundColor.startsWith('var(')
                ? style.getPropertyValue(ds.backgroundColor.slice(4, -1)).trim()
                : ds.backgroundColor
        }));
    } else {
        // Configuração padrão para datasets simples.
        const colors = [
            style.getPropertyValue('--chart-color-1').trim(),
            style.getPropertyValue('--chart-color-2').trim(),
            style.getPropertyValue('--chart-color-3').trim(),
            style.getPropertyValue('--chart-color-4').trim(),
            style.getPropertyValue('--chart-color-5').trim()
        ];
        const barColor = style.getPropertyValue('--chart-color-4').trim();
        datasets = [{
            data: chartData.data,
            backgroundColor: type === 'bar' ? barColor : colors,
            borderRadius: 4,
            borderWidth: 0
        }];
    }

    const data = {
        labels: chartData.labels,
        datasets: datasets
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: type !== 'bar' || (customDatasets && customDatasets.length > 1),
                position: 'bottom',
                labels: {
                    color: style.getPropertyValue('--color-text-muted').trim(),
                    padding: 20,
                    usePointStyle: true
                }
            }
        },
        scales: scales
    };

    // Cria a nova instância do gráfico e a armazena.
    chartInstances[canvasId] = new Chart(ctx, { type, data, options });
}

/**
 * Redesenha todos os gráficos existentes. Útil ao trocar de tema,
 * pois as cores dos gráficos precisam ser atualizadas.
 */
export function redrawAllCharts() {
    // Esta função precisará ser implementada no main.js, pois ela depende
    // dos dados do estado global para recriar os gráficos.
    // Por enquanto, esta é uma ideia de como o módulo de gráficos pode evoluir.
    console.log("Sinalizando para redesenhar todos os gráficos...");
}
