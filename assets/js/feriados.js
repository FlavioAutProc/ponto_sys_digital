let feriados = [];

export async function loadHolidays() {
    try {
        // Tenta carregar feriados de Maragogi-AL de um JSON local
        const response = await fetch('feriados.json');
        if (!response.ok) throw new Error('Feriados locais não encontrados');
        
        feriados = await response.json();
        console.log('Feriados carregados:', feriados);
    } catch (error) {
        console.error('Erro ao carregar feriados:', error);
        
        // Fallback: feriados nacionais fixos
        feriados = [
            { date: '2023-01-01', name: 'Confraternização Universal' },
            { date: '2023-04-21', name: 'Tiradentes' },
            { date: '2023-05-01', name: 'Dia do Trabalho' },
            { date: '2023-09-07', name: 'Independência do Brasil' },
            { date: '2023-10-12', name: 'Nossa Senhora Aparecida' },
            { date: '2023-11-02', name: 'Finados' },
            { date: '2023-11-15', name: 'Proclamação da República' },
            { date: '2023-12-25', name: 'Natal' },
            
            // Feriados de Maragogi-AL (exemplos)
            { date: '2023-06-29', name: 'São Pedro - Padroeiro de Maragogi' },
            { date: '2023-09-16', name: 'Emancipação Política de Maragogi' }
        ];
    }
}

export function checkHolidays(dateStr) {
    const date = new Date(dateStr + 'T00:00:00'); // Força UTC
    const dateISO = date.toISOString().split('T')[0];
    
    const feriado = feriados.find(f => f.date === dateISO);
    
    if (feriado) {
        return feriado.name;
    }
    
    return null;
}