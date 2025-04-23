const axios = require('axios');

// Обработчик запросов к OpenRouter API
exports.handler = async function(event, context) {
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
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not set in environment variables');
    }

    // Отправляем запрос к OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'openai/gpt-3.5-turbo', // Можно использовать другие модели
        messages: messages,
        max_tokens: 500,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.URL || 'https://meta-art-nft.com', // Используем URL из переменных окружения или значение по умолчанию
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
    }

    // Возвращаем ошибку
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
