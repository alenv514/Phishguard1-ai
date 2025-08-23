// 1. Cargar las librerías necesarias
require('dotenv').config(); // Carga las variables de entorno desde .env
const express = require('express');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const bodyParser = require('body-parser');
const rateLimit = require('express-rate-limit');

const app = express(); // <--- MOVIDO AQUÍ
app.set('trust proxy', 1); // Confía en el primer proxy (necesario para Render)

// --- Configurar el limitador de peticiones ---
const apiLimiter = rateLimit({
	windowMs: 24 * 60 * 60 * 1000, // 24 horas
	max: 5, // Límite de 5 peticiones por IP durante la ventana de tiempo
	message: 'Has excedido el límite de 5 peticiones por día. Por favor, intenta de nuevo mañana.',
    standardHeaders: true, // Devuelve la información del límite en los headers `RateLimit-*`
	legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
});

// --- Sirviendo el Frontend ---
// Esto le dice a Express que sirva los archivos estáticos (html, css, js) desde el directorio actual
app.use(express.static(__dirname)); 

// 2. Inicializar la aplicación Express y la IA de Gemini
const port = process.env.PORT || 3000; // Render usará una variable de entorno PORT

// Cargar la API Key de forma segura desde el archivo .env
const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
    console.error("Error: La variable de entorno GEMINI_API_KEY no está definida.");
    process.exit(1);
}
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

// 3. Configurar Middlewares
app.use(cors()); // Permite peticiones desde nuestro frontend
app.use(bodyParser.json()); // Permite al servidor entender el JSON que envía el frontend

// 4. Definir el Endpoint de Análisis
app.post('/analyze', apiLimiter, async (req, res) => {
    try {
        const { emailText } = req.body; // Obtener el texto del correo desde la petición

        if (!emailText) {
            return res.status(400).json({ error: 'No se proporcionó texto para analizar.' });
        }

        // El "Prompt": La instrucción que le damos a la IA. Es la parte más importante.
        const prompt = `
            Actúa como un experto en ciberseguridad de clase mundial especializado en la detección de phishing.
            Analiza el siguiente contenido de un correo electrónico en cualquier idioma.
            Tu tarea es determinar el nivel de riesgo y explicar por qué.
            Proporciona tu respuesta en formato JSON con la siguiente estructura:
            {
              "verdict": "SEGURO" | "PRECAUCIÓN" | "ALTO RIESGO",
              "score": <un número del 0 (seguro) al 10 (muy peligroso)>,
              "details": [
                { "point": "Razón específica 1", "type": "positive" | "negative" },
                { "point": "Razón específica 2", "type": "positive" | "negative" }
              ]
            }

            Aquí está el contenido del correo:
            ---
            ${emailText}
            ---
        `;

        // 5. Llamar a la IA de Gemini
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const textResponse = response.text();
        
        // Limpiar y parsear la respuesta JSON de la IA
        const jsonString = textResponse.match(/```json\n([\s\S]*?)\n```/)[1];
        const jsonResponse = JSON.parse(jsonString);

        res.json(jsonResponse);

    } catch (error) {
        console.error('Error en el endpoint /analyze:', error);
        res.status(500).json({ error: 'Ocurrió un error al contactar el servicio de IA.' });
    }
});

// 6. Iniciar el servidor
app.listen(port, () => {
    console.log(`PhishGuard AI Backend escuchando en http://localhost:${port}`);
    console.log("Asegúrate de haber añadido tu API Key en el archivo .env");
});
