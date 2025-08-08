document.addEventListener('DOMContentLoaded', () => {
    const analyzeButton = document.getElementById('analyze-button');
    const emailContent = document.getElementById('email-content');
    const resultContainer = document.getElementById('result-container');
    const resultVerdict = document.getElementById('result-verdict');
    const resultDetails = document.getElementById('result-details');
    const proPlanButton = document.getElementById('pro-plan-button');

    const API_ENDPOINT = '/analyze'; // URL relativa que funcionará en cualquier lugar

    analyzeButton.addEventListener('click', async () => {
        const text = emailContent.value;
        if (text.trim() === '') {
            alert('Por favor, pegue el contenido del correo para analizar.');
            return;
        }

        // --- Lógica de comunicación con el Backend ---
        
        // 1. Mostrar estado de carga
        resultContainer.classList.remove('result-hidden');
        resultVerdict.className = 'verdict';
        resultVerdict.textContent = 'Analizando con IA...';
        resultDetails.innerHTML = '<li>Por favor, espere un momento.</li>';
        analyzeButton.disabled = true;
        analyzeButton.textContent = 'PROCESANDO...';

        try {
            // 2. Enviar el texto al backend
            const response = await fetch(API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emailText: text }),
            });

            if (!response.ok) {
                throw new Error(`Error del servidor: ${response.statusText}`);
            }

            const data = await response.json();

            // 3. Mostrar los resultados de la IA
            updateVerdict(data.verdict);
            updateDetails(data.details);

        } catch (error) {
            console.error('Error al analizar:', error);
            updateVerdict('ERROR');
            resultDetails.innerHTML = `<li>Ocurrió un error de comunicación con el servidor de análisis. Asegúrese de que el servidor local esté corriendo.</li>`;
        } finally {
            // 4. Restaurar el botón
            analyzeButton.disabled = false;
            analyzeButton.textContent = 'Analizar Correo';
        }
    });

    function updateVerdict(verdict) {
        resultVerdict.textContent = verdict.replace('_', ' ');
        resultVerdict.className = 'verdict'; // Reset
        switch (verdict) {
            case 'ALTO_RIESGO':
                resultVerdict.classList.add('verdict-danger');
                break;
            case 'PRECAUCIÓN':
                resultVerdict.classList.add('verdict-caution');
                break;
            case 'SEGURO':
                resultVerdict.classList.add('verdict-safe');
                break;
            default:
                resultVerdict.classList.add('verdict-caution');
        }
    }

    function updateDetails(details) {
        resultDetails.innerHTML = '';
        if (details && details.length > 0) {
            details.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item.point;
                // Opcional: añadir clase para colorear puntos positivos/negativos
                li.style.borderLeftColor = item.type === 'negative' ? '#dc3545' : '#28a745';
                resultDetails.appendChild(li);
            });
        } else {
            resultDetails.innerHTML = '<li>No se recibieron detalles del análisis.</li>';
        }
    }

    proPlanButton.addEventListener('click', () => {
        alert('¡Gracias por su interés! PhishGuard AI Pro se lanzará pronto.');
    });
});


async function analyzeWithGemini(emailText) {
    const response = await fetch('http://localhost:3000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: emailText })
    });
    const data = await response.json();
    return data.verdict;
}
