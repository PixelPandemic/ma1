const axios = require('axios');

// Логирование для отладки
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('IS_DEVELOPMENT (forced to false for testing):', false);

// Обработчик запросов к OpenRouter API
exports.handler = async function(event, context) {
  // Логируем информацию о запросе
  console.log('Netlify Function: openrouter.js handler called');
  console.log('Environment variables available:', Object.keys(process.env).filter(key => key.includes('OPENROUTER') || key.includes('URL')));
  console.log('HTTP Method:', event.httpMethod);
  console.log('Path:', event.path);
  console.log('Headers:', JSON.stringify(event.headers));
  // Проверяем, что запрос использует метод POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Allow': 'POST',
        'Content-Type': 'application/json'
      }
    };
  }

  try {
    // Парсим тело запроса
    const requestBody = JSON.parse(event.body);
    const { prompt, history } = requestBody;

    // Проверяем наличие необходимых параметров
    if (!prompt) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required parameter: prompt' }),
        headers: { 'Content-Type': 'application/json' }
      };
    }

    // Формируем сообщения для API
    const messages = Array.isArray(history) ? [...history] : [];
    messages.push({
      role: 'user',
      content: prompt
    });

    console.log('Sending request to OpenRouter API with messages:', JSON.stringify(messages));

    // Получаем API ключ из переменных окружения
    // Проверяем обе возможные переменные окружения (с префиксом REACT_APP_ и без)
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    // Если API ключ не найден, используем резервный ключ
    let effectiveApiKey = apiKey;
    if (!apiKey) {
      console.warn('OpenRouter API key not found in environment variables, using fallback key');
      // Используем резервный ключ (это временное решение, в продакшене лучше настроить переменные окружения)
      effectiveApiKey = "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";
      console.log('Using fallback API key');
    }

    console.log('API key found:', apiKey ? 'Yes (key is present)' : 'No');

    // Отправляем запрос к OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo', // Используем надежную модель
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${effectiveApiKey}`,
          'HTTP-Referer': process.env.URL || 'https://ma1.netlify.app', // Используем URL из переменных окружения или значение по умолчанию
          'X-Title': 'Meta ART NFT Marketplace'
        }
      }
    );

    // Возвращаем успешный ответ
    return {
      statusCode: 200,
      body: JSON.stringify(response.data),
      headers: { 'Content-Type': 'application/json' }
    };
  } catch (error) {
    console.error('Error calling OpenRouter API:', error);

    // Формируем информативное сообщение об ошибке
    let errorMessage = 'Failed to get response from OpenRouter API';
    let errorDetails = error.message;

    if (error.response) {
      errorMessage = `OpenRouter API error: ${error.response.status}`;
      errorDetails = error.response.data;
      console.error('OpenRouter API error details:', JSON.stringify(error.response.data));
    }

    // Создаем фоллбэк-ответ для пользователя
    try {
      const fallbackResponse = {
        id: 'fallback-response',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'fallback-model',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: `I apologize, but I couldn't connect to the AI service at the moment. Error: ${errorMessage}\n\nYou asked about "${prompt}". Please try again later when the connection is restored.\n\nThis appears to be a temporary server issue. Please try:\n1. Refreshing the page\n2. Asking a simpler question\n3. Trying again in a few minutes`
            },
            finish_reason: 'stop'
          }
        ],
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 }
      };

      return {
        statusCode: 200,
        body: JSON.stringify(fallbackResponse),
        headers: { 'Content-Type': 'application/json' }
      };
    } catch (fallbackError) {
      console.error('Error creating fallback response:', fallbackError);

      // Если даже создание фоллбэка не удалось, возвращаем ошибку
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: errorMessage,
          details: errorDetails
        }),
        headers: { 'Content-Type': 'application/json' }
      };
    }
  }
};
