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

async function exportToPDF() {
    const preview = document.getElementById('report-preview');
    if (!preview || preview.textContent.trim() === '') {
        showToast('Gere um relatório antes de exportar para PDF.', 'error');
        return;
    }
    
    try {
        if (typeof window.jspdf === 'undefined' || !window.jspdf.jsPDF) {
            throw new Error('Biblioteca jsPDF não disponível');
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const title = document.querySelector('#report-preview h3')?.textContent || 'Relatório de Ponto';
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(18);
        doc.text(title, 14, 20);
        
        const userInfo = document.querySelector('.user-info-preview');
        if (userInfo) {
            let yPosition = 30;
            doc.setFontSize(12);
            
            Array.from(userInfo.children).forEach(p => {
                doc.text(p.textContent, 14, yPosition);
                yPosition += 7;
            });
        }
        
        const table = document.querySelector('.report-table');
        if (table) {
            const headers = [];
            const rows = [];
            
            Array.from(table.querySelectorAll('thead th')).forEach(th => {
                headers.push(th.textContent);
            });
            
            Array.from(table.querySelectorAll('tbody tr')).forEach(tr => {
                const row = [];
                Array.from(tr.children).forEach(td => {
                    row.push(td.textContent);
                });
                rows.push(row);
            });
            
            doc.autoTable({
                head: [headers],
                body: rows,
                startY: userInfo ? 60 : 30,
                styles: {
                    font: 'helvetica',
                    fontStyle: 'normal',
                    fontSize: 10,
                    cellPadding: 4,
                    textColor: [0, 0, 0]
                },
                headStyles: {
                    fillColor: [52, 152, 219],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                didParseCell: function(data) {
                    if (data.cell.text[0]?.includes('Feriado')) {
                        data.cell.styles.fillColor = [255, 243, 205];
                        data.cell.styles.textColor = [133, 100, 4];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            });
        }
        
        const totalElement = document.querySelector('#report-preview div:last-child');
        if (totalElement?.textContent.includes('Total de horas')) {
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(totalElement.textContent, 14, doc.lastAutoTable.finalY + 15);
        }
        
        const now = new Date();
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(150, 150, 150);
        doc.text(`Gerado em: ${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR')}`, 
                14, doc.internal.pageSize.height - 10);
        
        doc.save(`relatorio_ponto_${new Date().getTime()}.pdf`);
    } catch (error) {
        console.error('Erro na geração do PDF:', error);
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