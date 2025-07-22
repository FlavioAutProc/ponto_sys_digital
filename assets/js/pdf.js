// pdf.js - Complete corrected module

import { checkHolidays } from './feriados.js';

let jsPDFLoaded = false;

export function generateReport(period, month, year) {
    const allRecords = JSON.parse(localStorage.getItem('pontoRecords') || '[]');
    const userSettings = JSON.parse(localStorage.getItem('userSettings') || {});
    
    let filteredRecords = [];
    let reportTitle = '';
    
    if (period === 'month') {
        const monthStr = month.toString().padStart(2, '0');
        const startDate = `${year}-${monthStr}-01`;
        const endDate = `${year}-${monthStr}-${new Date(year, month, 0).getDate()}`;
        
        filteredRecords = allRecords.filter(record => 
            record.data >= startDate && record.data <= endDate
        );
        
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                         'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        reportTitle = `Relatório Mensal - ${monthNames[month - 1]} de ${year}`;
    } else {
        const startDate = `${year}-01-01`;
        const endDate = `${year}-12-31`;
        
        filteredRecords = allRecords.filter(record => 
            record.data >= startDate && record.data <= endDate
        );
        
        reportTitle = `Relatório Anual - ${year}`;
    }
    
    const recordsByDay = {};
    filteredRecords.forEach(record => {
        if (!recordsByDay[record.data]) {
            recordsByDay[record.data] = {};
        }
        recordsByDay[record.data][record.tipo] = record;
    });
    
    const sortedDays = Object.keys(recordsByDay).sort();
    const preview = document.getElementById('report-preview');
    preview.innerHTML = '';
    
    const title = document.createElement('h3');
    title.textContent = reportTitle;
    preview.appendChild(title);
    
    if (userSettings.name || userSettings.company) {
        const userInfo = document.createElement('div');
        userInfo.className = 'user-info-preview';
        userInfo.style.marginBottom = '20px';
        
        if (userSettings.name) {
            const name = document.createElement('p');
            name.innerHTML = `<strong>Nome:</strong> ${userSettings.name}`;
            userInfo.appendChild(name);
        }
        
        if (userSettings.company) {
            const company = document.createElement('p');
            company.innerHTML = `<strong>Empresa:</strong> ${userSettings.company}`;
            userInfo.appendChild(company);
        }
        
        if (userSettings.role) {
            const role = document.createElement('p');
            role.innerHTML = `<strong>Função:</strong> ${userSettings.role}`;
            userInfo.appendChild(role);
        }
        
        if (userSettings.department) {
            const dept = document.createElement('p');
            dept.innerHTML = `<strong>Setor:</strong> ${userSettings.department}`;
            userInfo.appendChild(dept);
        }
        
        preview.appendChild(userInfo);
    }
    
    const table = document.createElement('table');
    table.className = 'report-table';
    table.style.width = '100%';
    table.style.borderCollapse = 'collapse';
    table.style.marginBottom = '20px';
    
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headerRow.style.backgroundColor = '#3498db';
    headerRow.style.color = 'white';
    
    ['Data', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Total'].forEach(text => {
        const th = document.createElement('th');
        th.textContent = text;
        th.style.padding = '10px';
        th.style.textAlign = 'left';
        headerRow.appendChild(th);
    });
    
    thead.appendChild(headerRow);
    table.appendChild(thead);
    
    const tbody = document.createElement('tbody');
    let totalMonthlyHours = 0;
    
    sortedDays.forEach(day => {
        const dayRecords = recordsByDay[day];
        const row = document.createElement('tr');
        
        const isHoliday = checkHolidays(day);
        if (isHoliday) {
            row.style.backgroundColor = '#fff3cd';
        }
        
        const [year, month, date] = day.split('-');
        const formattedDate = `${date}/${month}/${year}`;
        
        const dateCell = document.createElement('td');
        dateCell.textContent = formattedDate;
        dateCell.style.padding = '8px';
        dateCell.style.borderBottom = '1px solid #ddd';
        if (isHoliday) {
            dateCell.style.fontWeight = 'bold';
            dateCell.style.color = '#e74c3c';
            dateCell.textContent += ' (Feriado)';
        }
        row.appendChild(dateCell);
        
        ['entrada', 'intervalo', 'retorno', 'saida'].forEach(tipo => {
            const cell = document.createElement('td');
            cell.style.padding = '8px';
            cell.style.borderBottom = '1px solid #ddd';
            
            if (dayRecords[tipo]) {
                cell.textContent = dayRecords[tipo].horario;
            } else {
                cell.textContent = '-';
                cell.style.color = '#95a5a6';
            }
            row.appendChild(cell);
        });
        
        const totalCell = document.createElement('td');
        totalCell.style.padding = '8px';
        totalCell.style.borderBottom = '1px solid #ddd';
        
        if (dayRecords.entrada && dayRecords.intervalo && dayRecords.retorno && dayRecords.saida) {
            const total = calculateWorkedHours(
                dayRecords.entrada.horario,
                dayRecords.intervalo.horario,
                dayRecords.retorno.horario,
                dayRecords.saida.horario
            );
            totalCell.textContent = total;
            
            const [hours, minutes] = total.split(':').map(Number);
            totalMonthlyHours += hours + (minutes / 60);
        } else {
            totalCell.textContent = '-';
            totalCell.style.color = '#95a5a6';
        }
        row.appendChild(totalCell);
        
        tbody.appendChild(row);
    });
    
    table.appendChild(tbody);
    preview.appendChild(table);
    
    if (sortedDays.length > 0) {
        const totalHours = Math.floor(totalMonthlyHours);
        const totalMinutes = Math.round((totalMonthlyHours - totalHours) * 60);
        const formattedTotal = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;
        
        const totalElement = document.createElement('div');
        totalElement.style.textAlign = 'right';
        totalElement.style.fontWeight = 'bold';
        totalElement.style.marginTop = '10px';
        totalElement.textContent = `Total de horas no período: ${formattedTotal}`;
        
        preview.appendChild(totalElement);
    } else {
        const noData = document.createElement('p');
        noData.textContent = 'Nenhum registro encontrado para o período selecionado.';
        noData.style.color = '#95a5a6';
        noData.style.textAlign = 'center';
        preview.appendChild(noData);
    }
}

export function setupPDFExport() {
    document.getElementById('export-pdf').addEventListener('click', async () => {
        try {
            if (!jsPDFLoaded) {
                await loadJsPDFLibrary();
                jsPDFLoaded = true;
            }
            await exportToPDF();
        } catch (error) {
            console.error('Erro ao exportar PDF:', error);
            showToast('Erro ao exportar PDF: ' + error.message, 'error');
        }
    });
}

async function loadJsPDFLibrary() {
    return new Promise((resolve, reject) => {
        if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
            return resolve();
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        script.onload = () => {
            setTimeout(() => {
                const autoTableScript = document.createElement('script');
                autoTableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
                autoTableScript.onload = () => {
                    if (typeof window.jspdf !== 'undefined' && window.jspdf.jsPDF) {
                        resolve();
                    } else {
                        reject(new Error('Biblioteca jsPDF não carregada corretamente'));
                    }
                };
                autoTableScript.onerror = () => {
                    reject(new Error('Falha ao carregar jspdf-autotable'));
                };
                document.head.appendChild(autoTableScript);
            }, 100);
        };
        script.onerror = () => {
            reject(new Error('Falha ao carregar jsPDF'));
        };
        document.head.appendChild(script);
    });
}

// pdf.js - Modificação apenas da função exportToPDF

async function exportToPDF() {
    const preview = document.getElementById('report-preview');
    if (!preview || preview.textContent.trim() === '') {
        showToast('Gere um relatório antes de exportar para PDF.', 'error');
        return;
    }
    
    try {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            await loadJsPDFLibrary();
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        
        // Configurações gerais
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        
        // Obter dados do usuário
        const userSettings = JSON.parse(localStorage.getItem('userSettings') || {});
        const records = JSON.parse(localStorage.getItem('pontoRecords') || []);
        const currentDate = new Date();
        const month = currentDate.getMonth() + 1;
        const year = currentDate.getFullYear();
        
        // Filtrar registros do mês atual
        const monthRecords = records.filter(record => {
            const recordDate = new Date(record.data);
            return recordDate.getMonth() + 1 === month && recordDate.getFullYear() === year;
        });
        
        // Agrupar registros por dia
        const recordsByDay = {};
        monthRecords.forEach(record => {
            if (!recordsByDay[record.data]) {
                recordsByDay[record.data] = {};
            }
            recordsByDay[record.data][record.tipo] = record.horario;
        });
        
        // Obter todos os dias do mês
        const daysInMonth = new Date(year, month, 0).getDate();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                          'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        // Título
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('ESPELHO DE PONTO', 40, 40);
        doc.setFontSize(12);
        doc.text('Relatório Mensal de Ponto', 40, 60);
        
        // Informações do funcionário (2 colunas)
        doc.setFontSize(10);
        let yPosition = 100;
        
        const employeeInfo = [
            { label: 'Funcionário', value: userSettings.name || 'Não informado' },
            { label: 'Setor', value: userSettings.department || 'Não informado' },
            { label: 'Função', value: userSettings.role || 'Não informado' },
            { label: 'Empresa', value: userSettings.company || 'Não informada' },
            { label: 'Data admissão', value: userSettings.admission || 'Não informada' },
            { label: 'Horas Semanais', value: userSettings.schedule === '8' ? '44' : userSettings.schedule === '6' ? '36' : '20' },
            { label: 'Horas Mensais', value: userSettings.schedule === '8' ? '220' : userSettings.schedule === '6' ? '180' : '100' },
            { label: 'Jornada Padrão', value: userSettings.schedule === '8' ? '08:00 - 17:00' : 
                                             userSettings.schedule === '6' ? '06:00 - 14:20' : '04:00 - 08:00' },
            { label: 'Mês', value: `${monthNames[month - 1]}` }
        ];
        
        // Divide em duas colunas
        employeeInfo.forEach((info, index) => {
            const column = index < 5 ? 0 : 1;
            const x = 40 + (column * 250);
            const y = yPosition + ((index % 5) * 20);
            
            doc.setFont('helvetica', 'bold');
            doc.text(`${info.label}:`, x, y);
            doc.setFont('helvetica', 'normal');
            doc.text(info.value, x + 60, y);
        });
        
        // Linha divisória
        doc.line(40, 200, 555, 200);
        
        // Cabeçalho da tabela
        const headers = ['Data', 'Dia', 'Entrada', 'Intervalo', 'Retorno', 'Saída', 'Total', 'Obs.'];
        const headerY = 220;
        const columnPositions = [40, 90, 140, 200, 260, 320, 380, 440];
        const columnWidths = [50, 50, 60, 60, 60, 60, 60, 40];
        
        doc.setFont('helvetica', 'bold');
        headers.forEach((header, i) => {
            doc.text(header, columnPositions[i], headerY, { maxWidth: columnWidths[i] });
        });
        
        // Linha divisória do cabeçalho
        doc.line(40, 230, 555, 230);
        
        // Preencher tabela com todos os dias do mês
        let dataY = 250;
        let totalWorkedHours = 0;
        let workedDays = 0;
        
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
            const date = new Date(year, month - 1, day); // Correção definitiva para criação de data
            
            // Dias da semana corretos (0=Dom, 1=Seg, ..., 6=Sáb)
            const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
            const dayOfWeek = daysOfWeek[date.getDay()];
            
            const formattedDate = `${day.toString().padStart(2, '0')}/${month.toString().padStart(2, '0')}`;
            
            // Verificar se é feriado (exceto sábados e domingos)
            let isHoliday = false;
            if (date.getDay() !== 0 && date.getDay() !== 6) {
                isHoliday = checkHolidays(dateStr) !== null;
            }
            
            const isSunday = date.getDay() === 0;
            const isThursday = date.getDay() === 4;
            
            // Obter registros do dia
            const dayRecords = recordsByDay[dateStr] || {};
            
            // Calcular total de horas trabalhadas
            let totalHours = '00:00';
            if (dayRecords.entrada && dayRecords.intervalo && dayRecords.retorno && dayRecords.saida) {
                totalHours = calculateWorkedHours(
                    dayRecords.entrada,
                    dayRecords.intervalo,
                    dayRecords.retorno,
                    dayRecords.saida
                );
                
                const [hours, minutes] = totalHours.split(':').map(Number);
                totalWorkedHours += hours + (minutes / 60);
                workedDays++;
            }
            
            // Linha da tabela
            const rowData = [
                formattedDate,
                dayOfWeek,
                dayRecords.entrada || '00:00',
                dayRecords.intervalo || '00:00',
                dayRecords.retorno || '00:00',
                dayRecords.saida || '00:00',
                totalHours,
                isThursday ? 'Folga' : ''
            ];
            
            // Desenhar linha com formatação condicional
            rowData.forEach((text, i) => {
                // Aplicar cores
                if (isSunday) {
                    doc.setTextColor(255, 0, 0); // Vermelho para domingos
                } else if (isHoliday) {
                    doc.setTextColor(255, 0, 0); // Vermelho para feriados
                } else if (isThursday) {
                    doc.setTextColor(0, 0, 255); // Azul para quintas-feiras
                } else {
                    doc.setTextColor(0, 0, 0); // Preto para dias normais
                }
                
                doc.text(text, columnPositions[i], dataY, { maxWidth: columnWidths[i] });
            });
            
            dataY += 20;
            
            // Quebra de página se necessário
            if (dataY > 750 && day < daysInMonth) {
                doc.addPage();
                dataY = 40;
                
                // Redesenha cabeçalho em nova página
                headers.forEach((header, i) => {
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(0, 0, 0);
                    doc.text(header, columnPositions[i], dataY, { maxWidth: columnWidths[i] });
                });
                
                dataY += 30;
                doc.line(40, dataY - 10, 555, dataY - 10);
                dataY += 20;
            }
        }
        
        // Resumo mensal
        const summaryY = dataY + 30;
        doc.setFont('helvetica', 'bold');
        doc.text('Resumo Mensal', 40, summaryY);
        
        const totalHours = Math.floor(totalWorkedHours);
        const totalMinutes = Math.round((totalWorkedHours - totalHours) * 60);
        const formattedTotal = `${totalHours.toString().padStart(2, '0')}:${totalMinutes.toString().padStart(2, '0')}`;
        
        const summaryData = [
            { label: 'Total do mês', value: formattedTotal },
            { label: 'Dias Trabalhados', value: workedDays.toString() },
            { label: 'Média diária', value: workedDays > 0 ? 
                `${Math.floor(totalWorkedHours / workedDays)}:${Math.round(((totalWorkedHours / workedDays) % 1) * 60).toString().padStart(2, '0')}` : '00:00' }
        ];
        
        summaryData.forEach((item, index) => {
            const y = summaryY + 20 + (index * 20);
            doc.setFont('helvetica', 'bold');
            doc.text(item.label, 100, y);
            doc.setFont('helvetica', 'normal');
            doc.text(item.value, 250, y);
        });
        
        // Data de geração no rodapé
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em: ${currentDate.toLocaleDateString('pt-BR')} às ${currentDate.toLocaleTimeString('pt-BR')}`, 
                40, doc.internal.pageSize.height - 20);
        
        doc.save(`espelho_ponto_${monthNames[month - 1].toLowerCase()}_${year}.pdf`);
    } catch (error) {
        console.error('Erro na geração do PDF:', error);
        showToast('Erro ao gerar PDF: ' + error.message, 'error');
        throw error;
    }
}


function calculateWorkedHours(entrada, intervalo, retorno, saida) {
    function timeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        return hours * 60 + minutes;
    }
    
    const entradaMin = timeToMinutes(entrada);
    const intervaloMin = timeToMinutes(intervalo);
    const retornoMin = timeToMinutes(retorno);
    const saidaMin = timeToMinutes(saida);
    
    const manhaMin = intervaloMin - entradaMin;
    const tardeMin = saidaMin - retornoMin;
    const totalMin = manhaMin + tardeMin;
    
    const hours = Math.floor(totalMin / 60);
    const minutes = totalMin % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.classList.add('show');
    }, 100);
    
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}