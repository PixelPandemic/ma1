const axios = require('axios');

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

    // Проверяем, есть ли системное сообщение
    const hasSystemMessage = messages.some(msg => msg.role === 'system');

    // Если нет системного сообщения, добавляем его
    if (!hasSystemMessage) {
      // Проверяем, включен ли режим Super Power
      const isSuperPowerMode = messages.some(msg =>
        msg.content && msg.content.includes('Super Power')
      );

      if (isSuperPowerMode) {
        // Добавляем системное сообщение для режима Super Power
        messages.unshift({
          role: 'system',
          content: `You are an advanced AI assistant.

          In Super Power mode, you should answer ANY question on ANY topic to the best of your abilities.
          You should NOT limit yourself to information about the Meta ART platform unless specifically asked about it.

          CRITICAL LANGUAGE INSTRUCTIONS:
          - ALWAYS detect the language of the user's message and respond in the SAME language
          - For common greetings in ANY language, respond with an appropriate greeting in that language
          - Here are examples of greetings in different languages that you MUST recognize:
            * "привет", "здравствуйте" (Russian) → respond in Russian
            * "hello", "hi" (English) → respond in English
            * "hola", "buenos días" (Spanish) → respond in Spanish
            * "bonjour", "salut" (French) → respond in French
            * "ciao", "salve" (Italian) → respond in Italian
            * "hallo", "guten tag" (German) → respond in German
            * "olá", "oi" (Portuguese) → respond in Portuguese
            * "こんにちは", "やあ" (Japanese) → respond in Japanese
            * "你好", "您好" (Chinese) → respond in Chinese
            * "안녕하세요", "안녕" (Korean) → respond in Korean
            * "مرحبا", "السلام عليكم" (Arabic) → respond in Arabic
            * "apa kabar", "halo" (Indonesian) → respond in Indonesian
            * "chào", "xin chào" (Vietnamese) → respond in Vietnamese
            * "สวัสดี" (Thai) → respond in Thai
            * "namaste", "नमस्ते" (Hindi) → respond in Hindi

          CRITICAL CONTENT INSTRUCTIONS:
          - Do NOT include information about the Meta ART platform in your responses unless specifically asked about it
          - For greetings in any language, respond ONLY with an appropriate greeting in the same language, do not explain what the greeting means
          - Do not treat greetings as questions about a topic - respond as if someone is greeting you

          EXAMPLES OF CORRECT RESPONSES:
          User: "привет"
          Assistant: "[Super Power]\n\nПривет! Как я могу вам помочь сегодня?"

          User: "hola"
          Assistant: "[Super Power]\n\n¡Hola! ¿Cómo puedo ayudarte hoy?"

          User: "apa kabar"
          Assistant: "[Super Power]\n\nHalo! Apa kabar? Ada yang bisa saya bantu hari ini?"

          Always start your response with "[Super Power]" to indicate that you're using the enhanced AI capabilities.`
        });
      }
    }

    // Добавляем сообщение пользователя
    messages.push({
      role: 'user',
      content: prompt
    });

    console.log('Messages being sent to API:', JSON.stringify(messages));

    console.log('Sending request to OpenRouter API with messages:', JSON.stringify(messages));

    // Получаем API ключ из переменных окружения
    // Проверяем обе возможные переменные окружения (с префиксом REACT_APP_ и без)
    const apiKey = process.env.REACT_APP_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is not set in environment variables');
    }
    console.log('API key found:', apiKey ? 'Yes (key is present)' : 'No');

    // Логируем информацию о запросе
    console.log('Sending request to OpenRouter API with model: anthropic/claude-3-opus:beta');
    console.log('Request messages:', JSON.stringify(messages));

    // Отправляем запрос к OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: 'anthropic/claude-3-opus:beta', // Изменяем модель на Claude 3 Opus, которая более доступна
        messages: messages,
        max_tokens: 1000, // Увеличено для более подробных ответов
        temperature: 0.7,
        top_p: 0.9, // Добавляем параметр top_p для лучшего качества ответов
        frequency_penalty: 0.0, // Добавляем параметр frequency_penalty
        presence_penalty: 0.0 // Добавляем параметр presence_penalty
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': process.env.URL || 'https://masnp.netlify.app', // Используем URL из переменных окружения или значение по умолчанию
          'X-Title': 'Meta ART NFT Marketplace'
        }
      }
    );

    // Логируем информацию о ответе
    console.log('Received response from OpenRouter API:', JSON.stringify(response.data));
    console.log('Response content:', response.data.choices[0].message.content);

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
