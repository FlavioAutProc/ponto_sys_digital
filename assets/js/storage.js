export function initializeApp() {
    // Inicializa dados no localStorage se não existirem
    if (!localStorage.getItem('pontoRecords')) {
        localStorage.setItem('pontoRecords', JSON.stringify([]));
    }
    
    if (!localStorage.getItem('userSettings')) {
        localStorage.setItem('userSettings', JSON.stringify({}));
    }
    
    if (!localStorage.getItem('userLocation')) {
        localStorage.setItem('userLocation', JSON.stringify({}));
    }
    
    if (!localStorage.getItem('lastBackup')) {
        localStorage.setItem('lastBackup', '0');
    }
    
    console.log('Aplicação inicializada com sucesso');
}