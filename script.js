// Módulos
import { initializeApp } from './assets/js/storage.js';
import { setupCamera, takePhoto, setupPhotoUpload } from './assets/js/utils.js';
import { generateReport, setupPDFExport } from './assets/js/pdf.js';
import { checkHolidays, loadHolidays } from './assets/js/feriados.js';

// Inicialização do aplicativo
document.addEventListener('DOMContentLoaded', async () => {
    // Carrega feriados
    await loadHolidays();
    
    // Inicializa armazenamento
    initializeApp();
    
    // Configura a câmera
    setupCamera();
    
    // Configura upload de foto
    setupPhotoUpload();
    
    // Configura exportação de PDF
    setupPDFExport();
    
    // Atualiza data e hora
    updateDateTime();
    setInterval(updateDateTime, 1000);
    
    // Obtém localização do usuário
    getUserLocation();
    
    // Configura navegação por abas
    setupTabNavigation();
    
    // Configura botões "Agora"
    setupNowButtons();
    
    // Configura marcação de ponto
    setupPontoButtons();
    
    // Configura filtros de histórico
    setupHistoryFilters();
    
    // Configura geração de relatórios
    setupReportGeneration();
    
    // Configura backup de dados
    setupBackupButtons();
    
    // Configura salvamento de configurações
    setupSettingsSave();
    
    // Carrega dados iniciais
    loadInitialData();
});

// Funções principais
function updateDateTime() {
    const now = new Date();
    const dateElement = document.getElementById('current-date');
    const timeElement = document.getElementById('current-time');
    
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    dateElement.textContent = now.toLocaleDateString('pt-BR', options);
    timeElement.textContent = now.toLocaleTimeString('pt-BR');
}

async function getUserLocation() {
    const locationElement = document.getElementById('user-location');
    locationElement.textContent = "Obtendo localização...";
    
    try {
        if (navigator.geolocation) {
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });
            
            const { latitude, longitude } = position.coords;
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await response.json();
            
            const city = data.address.city || data.address.town || data.address.village;
            const state = data.address.state;
            
            if (city && state) {
                locationElement.textContent = `${city} - ${state}`;
                localStorage.setItem('userLocation', JSON.stringify({ city, state }));
            } else {
                throw new Error("Localização não encontrada");
            }
        } else {
            throw new Error("Geolocalização não suportada");
        }
    } catch (error) {
        console.error("Erro ao obter localização:", error);
        const savedLocation = JSON.parse(localStorage.getItem('userLocation') || 'null');
        
        if (savedLocation) {
            locationElement.textContent = `${savedLocation.city} - ${savedLocation.state}`;
        } else {
            locationElement.textContent = "Localização indisponível";
        }
    }
}

function setupTabNavigation() {
    const tabs = document.querySelectorAll('nav li');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove classe active de todas as tabs
            tabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            
            // Adiciona classe active à tab clicada
            tab.classList.add('active');
            const tabId = tab.getAttribute('data-tab');
            document.getElementById(tabId).classList.add('active');
            
            // Carrega dados específicos da tab se necessário
            if (tabId === 'historico') {
                loadHistoryData();
            } else if (tabId === 'relatorios') {
                setupYearDropdown();
            }
        });
    });
}

function setupNowButtons() {
    document.querySelectorAll('.btn-now').forEach(button => {
        button.addEventListener('click', () => {
            const target = button.getAttribute('data-target');
            const now = new Date();
            const hours = now.getHours().toString().padStart(2, '0');
            const minutes = now.getMinutes().toString().padStart(2, '0');
            document.getElementById(target).value = `${hours}:${minutes}`;
        });
    });
}

function setupPontoButtons() {
    document.querySelectorAll('.btn-marcar').forEach(button => {
        button.addEventListener('click', () => {
            const tipo = button.getAttribute('data-tipo');
            const timeInput = document.getElementById(`${tipo}-time`);
            
            if (!timeInput.value) {
                showToast('Por favor, informe o horário ou clique em "Agora"', 'error');
                return;
            }
            
            const photoPreview = document.getElementById('photo-preview');
            if (!photoPreview.src) {
                showToast('Por favor, tire ou envie uma foto', 'error');
                return;
            }
            
            // Obtém a data atual no formato YYYY-MM-DD
            const now = new Date();
            const dateStr = now.toISOString().split('T')[0];
            
            // Obtém os dados do usuário
            const userData = JSON.parse(localStorage.getItem('userSettings') || {});
            const location = JSON.parse(localStorage.getItem('userLocation') || '{}');
            
            // Cria o registro do ponto
            const registro = {
                tipo,
                data: dateStr,
                horario: timeInput.value,
                foto: photoPreview.src,
                localizacao: location,
                usuario: {
                    nome: userData.name || 'Não informado',
                    empresa: userData.company || 'Não informada',
                    funcao: userData.role || 'Não informada',
                    setor: userData.department || 'Não informado'
                }
            };
            
            // Salva o registro
            savePontoRecord(registro);
            
            // Atualiza a interface
            updateLastRegister(tipo, timeInput.value);
            updateDailySummary();
            
            // Limpa a foto
            photoPreview.src = '';
            photoPreview.style.display = 'none';
            
            showToast(`Ponto de ${tipo} registrado com sucesso!`);
        });
    });
}

function savePontoRecord(registro) {
    // Obtém os registros existentes ou cria um novo array
    const registros = JSON.parse(localStorage.getItem('pontoRecords') || []);
    
    // Verifica se já existe um registro do mesmo tipo no mesmo dia
    const existingIndex = registros.findIndex(r => 
        r.data === registro.data && r.tipo === registro.tipo
    );
    
    if (existingIndex >= 0) {
        // Atualiza o registro existente
        registros[existingIndex] = registro;
    } else {
        // Adiciona um novo registro
        registros.push(registro);
    }
    
    // Salva no localStorage
    localStorage.setItem('pontoRecords', JSON.stringify(registros));
    
    // Atualiza o backup automático
    backupData();
}

function updateLastRegister(tipo, horario) {
    const element = document.getElementById(`last-${tipo}`);
    const now = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    element.textContent = `Último registro: ${horario} (${now})`;
}

function updateDailySummary() {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const registros = JSON.parse(localStorage.getItem('pontoRecords') || '[]');
    const dailyRecords = registros.filter(r => r.data === dateStr);
    
    const entrada = dailyRecords.find(r => r.tipo === 'entrada');
    const intervalo = dailyRecords.find(r => r.tipo === 'intervalo');
    const retorno = dailyRecords.find(r => r.tipo === 'retorno');
    const saida = dailyRecords.find(r => r.tipo === 'saida');
    
    const summaryElement = document.getElementById('daily-summary');
    summaryElement.innerHTML = '';
    
    // Cria cards para cada tipo de registro
    if (entrada) {
        summaryElement.appendChild(createSummaryCard('Entrada', entrada.horario, 'var(--primary-color)'));
    }
    
    if (intervalo) {
        summaryElement.appendChild(createSummaryCard('Intervalo', intervalo.horario, 'var(--warning-color)'));
    }
    
    if (retorno) {
        summaryElement.appendChild(createSummaryCard('Retorno', retorno.horario, 'var(--success-color)'));
    }
    
    if (saida) {
        summaryElement.appendChild(createSummaryCard('Saída', saida.horario, 'var(--dark-color)'));
    }
    
    // Calcula horas trabalhadas se todos os registros estiverem presentes
    if (entrada && intervalo && retorno && saida) {
        const horasTrabalhadas = calculateWorkedHours(
            entrada.horario, 
            intervalo.horario, 
            retorno.horario, 
            saida.horario
        );
        
        summaryElement.appendChild(createSummaryCard('Horas Trabalhadas', horasTrabalhadas, 'var(--accent-color)'));
    }
}

function createSummaryCard(title, value, color) {
    const card = document.createElement('div');
    card.className = 'summary-item';
    card.style.borderTop = `4px solid ${color}`;
    
    const titleElement = document.createElement('h4');
    titleElement.textContent = title;
    
    const valueElement = document.createElement('p');
    valueElement.textContent = value;
    valueElement.style.fontWeight = 'bold';
    valueElement.style.fontSize = '1.1rem';
    
    card.appendChild(titleElement);
    card.appendChild(valueElement);
    
    return card;
}

function calculateWorkedHours(entrada, intervalo, retorno, saida) {
    // Converte os horários para minutos desde meia-noite
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    const entradaMin = timeToMinutes(entrada);
    const intervaloMin = timeToMinutes(intervalo);
    const retornoMin = timeToMinutes(retorno);
    const saidaMin = timeToMinutes(saida);
    
    // Calcula o tempo antes do intervalo e depois do intervalo
    const manhaMin = intervaloMin - entradaMin;
    const tardeMin = saidaMin - retornoMin;
    
    // Total de minutos trabalhados (descontando 1h de intervalo)
    const totalMin = manhaMin + tardeMin;
    
    // Converte de volta para formato HH:MM
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function loadHistoryData() {
    const period = document.getElementById('history-period').value;
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
        case 'day':
            startDate = new Date(now);
            endDate = new Date(now);
            break;
        case 'week':
            startDate = new Date(now);
            startDate.setDate(now.getDate() - now.getDay()); // Domingo da semana atual
            endDate = new Date(now);
            endDate.setDate(now.getDate() + (6 - now.getDay())); // Sábado da semana atual
            break;
        case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            break;
        case 'custom':
            const startInput = document.getElementById('start-date').value;
            const endInput = document.getElementById('end-date').value;
            
            if (!startInput || !endInput) {
                showToast('Por favor, selecione um intervalo de datas', 'error');
                return;
            }
            
            startDate = new Date(startInput);
            endDate = new Date(endInput);
            break;
    }
    
    // Formata as datas para YYYY-MM-DD
    const startStr = startDate.toISOString().split('T')[0];
    const endStr = endDate.toISOString().split('T')[0];
    
    // Obtém todos os registros
    const allRecords = JSON.parse(localStorage.getItem('pontoRecords') || []);
    
    // Filtra registros pelo período selecionado
    const filteredRecords = allRecords.filter(record => {
        const recordDate = record.data;
        return recordDate >= startStr && recordDate <= endStr;
    });
    
    // Agrupa registros por dia
    const recordsByDay = {};
    filteredRecords.forEach(record => {
        if (!recordsByDay[record.data]) {
            recordsByDay[record.data] = {};
        }
        recordsByDay[record.data][record.tipo] = record;
    });
    
    // Ordena os dias
    const sortedDays = Object.keys(recordsByDay).sort();
    
    // Preenche a tabela
    const tableBody = document.getElementById('history-body');
    tableBody.innerHTML = '';
    
    sortedDays.forEach(day => {
        const dayRecords = recordsByDay[day];
        const row = document.createElement('tr');
        
        // Verifica se é feriado
        const isHoliday = checkHolidays(day);
        if (isHoliday) {
            row.classList.add('holiday');
        }
        
        // Formata a data para exibição
        const [year, month, date] = day.split('-');
        const formattedDate = `${date}/${month}/${year}`;
        
        // Célula da data
        const dateCell = document.createElement('td');
        dateCell.textContent = formattedDate;
        if (isHoliday) {
            dateCell.classList.add('holiday-cell');
            dateCell.textContent += ' (Feriado)';
        }
        row.appendChild(dateCell);
        
        // Células para cada tipo de registro
        ['entrada', 'intervalo', 'retorno', 'saida'].forEach(tipo => {
            const cell = document.createElement('td');
            if (dayRecords[tipo]) {
                cell.textContent = dayRecords[tipo].horario;
            } else {
                cell.textContent = '-';
                cell.style.color = 'var(--gray-color)';
            }
            row.appendChild(cell);
        });
        
        // Célula do total de horas
        const totalCell = document.createElement('td');
        if (dayRecords.entrada && dayRecords.intervalo && dayRecords.retorno && dayRecords.saida) {
            const total = calculateWorkedHours(
                dayRecords.entrada.horario,
                dayRecords.intervalo.horario,
                dayRecords.retorno.horario,
                dayRecords.saida.horario
            );
            totalCell.textContent = total;
        } else {
            totalCell.textContent = '-';
            totalCell.style.color = 'var(--gray-color)';
        }
        row.appendChild(totalCell);
        
        // Célula da foto (mostra apenas se há pelo menos um registro)
        const photoCell = document.createElement('td');
        const hasAnyRecord = Object.keys(dayRecords).length > 0;
        
        if (hasAnyRecord) {
            // Usa a foto do primeiro registro encontrado
            const firstRecord = dayRecords[Object.keys(dayRecords)[0]];
            photoCell.textContent = 'Visualizar';
            photoCell.classList.add('photo-cell');
            photoCell.addEventListener('click', () => showPhotoModal(firstRecord.foto));
        } else {
            photoCell.textContent = '-';
            photoCell.style.color = 'var(--gray-color)';
        }
        row.appendChild(photoCell);
        
        tableBody.appendChild(row);
    });
    
    if (sortedDays.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 7;
        cell.textContent = 'Nenhum registro encontrado para o período selecionado';
        cell.style.textAlign = 'center';
        cell.style.color = 'var(--gray-color)';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

function setupHistoryFilters() {
    const periodSelect = document.getElementById('history-period');
    const customRange = document.getElementById('custom-date-range');
    
    periodSelect.addEventListener('change', () => {
        if (periodSelect.value === 'custom') {
            customRange.style.display = 'flex';
            
            // Define datas padrão (últimos 7 dias)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            
            document.getElementById('start-date').valueAsDate = startDate;
            document.getElementById('end-date').valueAsDate = endDate;
        } else {
            customRange.style.display = 'none';
        }
    });
    
    document.getElementById('apply-filter').addEventListener('click', loadHistoryData);
}

function setupReportGeneration() {
    // Preenche dropdown de anos
    setupYearDropdown();
    
    // Mostra/oculta seletor de mês conforme o tipo de relatório
    document.getElementById('report-period').addEventListener('change', function() {
        document.getElementById('month-selector').style.display = 
            this.value === 'month' ? 'block' : 'none';
    });
    
    // Configura botão de gerar relatório
    document.getElementById('generate-report').addEventListener('click', function() {
        const period = document.getElementById('report-period').value;
        const month = document.getElementById('report-month').value;
        const year = document.getElementById('report-year').value;
        
        generateReport(period, month, year);
    });
}

function setupYearDropdown() {
    const yearSelect = document.getElementById('report-year');
    yearSelect.innerHTML = '';
    
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= currentYear - 5; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    }
}

function setupBackupButtons() {
    // Exportar dados
    document.getElementById('export-data').addEventListener('click', exportData);
    
    // Importar dados
    document.getElementById('import-data').addEventListener('click', () => {
        document.getElementById('backup-file').click();
    });
    
    document.getElementById('backup-file').addEventListener('change', importData);
}

function exportData() {
    // Obtém todos os dados do localStorage
    const data = {
        pontoRecords: JSON.parse(localStorage.getItem('pontoRecords') || '[]'),
        userSettings: JSON.parse(localStorage.getItem('userSettings') || {}),
        userLocation: JSON.parse(localStorage.getItem('userLocation') || {}),
        lastBackup: new Date().toISOString()
    };
    
    // Cria um blob com os dados
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Cria um link para download
    const a = document.createElement('a');
    a.href = url;
    a.download = `ponto_eletronico_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showToast('Backup exportado com sucesso!');
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Valida os dados
            if (!data.pontoRecords || !Array.isArray(data.pontoRecords)) {
                throw new Error('Formato de arquivo inválido');
            }
            
            // Confirmação do usuário
            if (confirm('Isso substituirá todos os seus dados atuais. Deseja continuar?')) {
                // Restaura os dados
                localStorage.setItem('pontoRecords', JSON.stringify(data.pontoRecords));
                
                if (data.userSettings) {
                    localStorage.setItem('userSettings', JSON.stringify(data.userSettings));
                }
                
                if (data.userLocation) {
                    localStorage.setItem('userLocation', JSON.stringify(data.userLocation));
                    document.getElementById('user-location').textContent = 
                        `${data.userLocation.city} - ${data.userLocation.state}`;
                }
                
                // Atualiza a interface
                updateDailySummary();
                if (document.getElementById('historico').classList.contains('active')) {
                    loadHistoryData();
                }
                
                // Carrega configurações do usuário
                loadUserSettings();
                
                showToast('Dados importados com sucesso!');
            }
        } catch (error) {
            console.error('Erro ao importar dados:', error);
            showToast('Erro ao importar dados. O arquivo pode estar corrompido.', 'error');
        }
    };
    reader.readAsText(file);
    
    // Limpa o input para permitir nova seleção do mesmo arquivo
    event.target.value = '';
}

function backupData() {
    // Cria um backup automático a cada 24 horas
    const lastBackup = localStorage.getItem('lastBackup');
    const now = new Date().getTime();
    
    if (!lastBackup || (now - parseInt(lastBackup)) > 24 * 60 * 60 * 1000) {
        exportData();
        localStorage.setItem('lastBackup', now.toString());
    }
}

function setupSettingsSave() {
    document.getElementById('save-settings').addEventListener('click', saveUserSettings);
    
    // Mostra/oculta campo de jornada personalizada
    document.getElementById('work-schedule').addEventListener('change', function() {
        document.getElementById('custom-schedule').style.display = 
            this.value === 'custom' ? 'block' : 'none';
    });
}

function saveUserSettings() {
    const settings = {
        name: document.getElementById('user-name').value,
        company: document.getElementById('user-company').value,
        role: document.getElementById('user-role').value,
        department: document.getElementById('user-department').value,
        admission: document.getElementById('user-admission').value,
        schedule: document.getElementById('work-schedule').value,
        customHours: document.getElementById('custom-hours').value
    };
    
    localStorage.setItem('userSettings', JSON.stringify(settings));
    showToast('Configurações salvas com sucesso!');
}

function loadUserSettings() {
    const settings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    
    if (settings) {
        document.getElementById('user-name').value = settings.name || '';
        document.getElementById('user-company').value = settings.company || '';
        document.getElementById('user-role').value = settings.role || '';
        document.getElementById('user-department').value = settings.department || '';
        document.getElementById('user-admission').value = settings.admission || '';
        document.getElementById('work-schedule').value = settings.schedule || '8';
        
        if (settings.schedule === 'custom' && settings.customHours) {
            document.getElementById('custom-schedule').style.display = 'block';
            document.getElementById('custom-hours').value = settings.customHours;
        }
    }
}

function loadInitialData() {
    // Carrega configurações do usuário
    loadUserSettings();
    
    // Carrega último registro de cada tipo
    const registros = JSON.parse(localStorage.getItem('pontoRecords') || []);
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    const todayRegistros = registros.filter(r => r.data === today);
    
    ['entrada', 'intervalo', 'retorno', 'saida'].forEach(tipo => {
        const registro = todayRegistros.find(r => r.tipo === tipo);
        if (registro) {
            updateLastRegister(tipo, registro.horario);
            document.getElementById(`${tipo}-time`).value = registro.horario;
        }
    });
    
    // Atualiza resumo do dia
    updateDailySummary();
}

function showPhotoModal(photoSrc) {
    const modal = document.getElementById('photo-modal');
    const modalImg = document.getElementById('modal-photo');
    
    modal.style.display = 'block';
    modalImg.src = photoSrc;
    
    // Fecha o modal quando clicar no X
    document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
    };
    
    // Fecha o modal quando clicar fora da imagem
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    // Mostra o toast
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    // Remove o toast após 3 segundos
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}