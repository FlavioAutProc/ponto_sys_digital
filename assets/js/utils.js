export function setupCamera() {
    const video = document.getElementById('camera-preview');
    const startButton = document.getElementById('start-camera');
    const takePhotoButton = document.getElementById('take-photo');
    const canvas = document.getElementById('photo-canvas');
    const photoPreview = document.getElementById('photo-preview');
    
    startButton.addEventListener('click', async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user' 
                } 
            });
            
            video.srcObject = stream;
            takePhotoButton.disabled = false;
            startButton.disabled = true;
            
            // Configura o canvas com as mesmas dimensões do vídeo
            video.addEventListener('loadedmetadata', () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
            });
        } catch (error) {
            console.error('Erro ao acessar a câmera:', error);
            alert('Não foi possível acessar a câmera. Por favor, verifique as permissões.');
        }
    });
    
    takePhotoButton.addEventListener('click', () => {
        // Desenha o frame atual do vídeo no canvas
        const context = canvas.getContext('2d');
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Converte para data URL e exibe na pré-visualização
        const photoDataUrl = canvas.toDataURL('image/jpeg', 0.8);
        photoPreview.src = photoDataUrl;
        photoPreview.style.display = 'block';
        
        // Para a stream da câmera
        const stream = video.srcObject;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        
        video.srcObject = null;
        takePhotoButton.disabled = true;
        startButton.disabled = false;
    });
}

export function takePhoto() {
    const takePhotoButton = document.getElementById('take-photo');
    takePhotoButton.click();
}

export function setupPhotoUpload() {
    const uploadInput = document.getElementById('photo-upload');
    const photoPreview = document.getElementById('photo-preview');
    
    uploadInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.type.match('image.*')) {
            alert('Por favor, selecione um arquivo de imagem.');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            photoPreview.src = event.target.result;
            photoPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    });
}

// Adicione esta função no utils.js
export function createLocalDate(dateStr) {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
}