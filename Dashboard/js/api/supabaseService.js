/**
 * @file Centraliza toda a comunicação com o Supabase.
 * Este módulo é responsável por inicializar o cliente Supabase e
 * exportar funções para realizar operações de CRUD (Create, Read, Update, Delete)
 * nas tabelas da aplicação, além de lidar com a autenticação.
 */

// --- CONFIGURAÇÃO DO SUPABASE ---
// A variável global 'supabase' é injetada pelo script no HTML.
const SUPABASE_URL = 'https://ynruynbfigrjcpvkxuff.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlucnV5bmJmaWdyamNwdmt4dWZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMzM2MzEsImV4cCI6MjA3MDYwOTYzMX0.8XpnJK3ukVBVfKJ7rquVP-NTcyiWaSZzKA-UD6XCMUE';
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Realiza o login do usuário.
 * @param {string} email - O email do usuário.
 * @param {string} password - A senha do usuário.
 * @returns {Promise<{success: boolean, error: object|null}>} - Retorna um objeto indicando o sucesso da operação.
 */
export async function signInUser(email, password) {
    const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
    return { success: !error, error };
}

/**
 * Busca todos os dados essenciais para o dashboard de uma só vez.
 * @returns {Promise<{settings: object, appointments: Array, financialEntries: Array}>} - Um objeto contendo os dados das tabelas.
 * @throws {Error} - Lança um erro se alguma das buscas falhar.
 */
export async function fetchAllDashboardData() {
    try {
        const [settingsResult, appointmentsResult, financialResult] = await Promise.all([
            supabaseClient.from('settings').select('*').single(),
            supabaseClient.from('appointments').select('*'),
            supabaseClient.from('financial_entries').select('*')
        ]);

        // O Supabase retorna um erro para .single() se não encontrar registros.
        // Verificamos se o erro é diferente de 'PGRST116' (zero rows) antes de lançá-lo.
        if (settingsResult.error && settingsResult.error.code !== 'PGRST116') throw settingsResult.error;
        if (appointmentsResult.error) throw appointmentsResult.error;
        if (financialResult.error) throw financialResult.error;

        return {
            settings: settingsResult.data || {}, // Retorna um objeto vazio se não houver configurações
            appointments: appointmentsResult.data || [],
            financialEntries: financialResult.data || []
        };
    } catch (error) {
        console.error("Erro ao buscar dados do Supabase:", error);
        throw error; // Propaga o erro para ser tratado pelo chamador (main.js)
    }
}

/**
 * Atualiza um agendamento existente.
 * @param {string} appointmentId - O ID do agendamento a ser atualizado.
 * @param {object} updatedData - Um objeto com os campos a serem atualizados.
 * @returns {Promise<{error: object|null}>} - O resultado da operação de update.
 */
export async function updateAppointment(appointmentId, updatedData) {
    const { error } = await supabaseClient
        .from('appointments')
        .update(updatedData)
        .eq('id', appointmentId);
    return { error };
}

/**
 * Adiciona uma nova despesa.
 * @param {object} expenseData - Os dados da nova despesa.
 * @returns {Promise<{error: object|null}>} - O resultado da operação de insert.
 */
export async function addExpense(expenseData) {
    const { error } = await supabaseClient
        .from('financial_entries')
        .insert(expenseData);
    return { error };
}

/**
 * Deleta um item de uma tabela específica.
 * @param {string} tableName - O nome da tabela.
 * @param {string} itemId - O ID do item a ser deletado.
 * @returns {Promise<{error: object|null}>} - O resultado da operação de delete.
 */
export async function deleteItem(tableName, itemId) {
    const { error } = await supabaseClient
        .from(tableName)
        .delete()
        .eq('id', itemId);
    return { error };
}

/**
 * Salva (insere ou atualiza) as configurações do usuário.
 * Utiliza 'upsert' para criar as configurações se não existirem, ou atualizá-las se já existirem.
 * @param {object} settingsData - O objeto de configurações a ser salvo.
 * @param {string} existingSettingsId - O ID da linha de configurações existente, se houver.
 * @returns {Promise<{error: object|null}>} - O resultado da operação de upsert.
 */
export async function saveSettings(settingsData, existingSettingsId) {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
        const error = new Error("Usuário não autenticado.");
        console.error(error);
        return { error };
    }

    const dataToUpsert = {
        ...settingsData,
        id: existingSettingsId, // Passa o ID para garantir o update
        user_id: user.id,
    };

    // A opção onConflict garante que o upsert funcione com a chave única 'user_id'
    const { error } = await supabaseClient
        .from('settings')
        .upsert(dataToUpsert, { onConflict: 'user_id' });

    return { error };
}
