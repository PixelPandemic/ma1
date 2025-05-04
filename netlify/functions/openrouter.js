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
    const { prompt, history, model, models } = requestBody;

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

    // Логируем доступные переменные окружения для отладки
    console.log('Available environment variables:', Object.keys(process.env).filter(key =>
      key.includes('OPENROUTER') || key.includes('API_KEY')
    ));

    // Если API ключ не найден, используем резервный ключ
    let effectiveApiKey = apiKey;
    if (!apiKey) {
      console.warn('OpenRouter API key not found in environment variables, using fallback key');
      // Используем резервный ключ (это временное решение, в продакшене лучше настроить переменные окружения)
      effectiveApiKey = "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";
      console.log('Using fallback API key');
    }

    console.log('API key found:', apiKey ? 'Yes (key is present)' : 'No');

    // Логируем информацию о запросе
    console.log('Request messages:', JSON.stringify(messages));

    // Подготавливаем тело запроса в соответствии с документацией OpenRouter
    const requestBody = {
      messages: messages,
      max_tokens: 800, // Reduced to avoid potential token limit issues
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.0,
      presence_penalty: 0.0,
      timeout: 60000, // 60 second timeout to prevent hanging requests
      stream: false // Ensure we're not using streaming which could cause issues
    };

    // Используем автоматический маршрутизатор OpenRouter
    const defaultModel = 'openrouter/auto';

    // Список надежных моделей для резервного использования
    const reliableModels = [
      'anthropic/claude-3-haiku',
      'openai/gpt-3.5-turbo',
      'meta-llama/llama-3-8b-instruct',
      'google/gemma-3-8b-it:free'
    ];

    // Используем только одну надежную модель для предотвращения ошибок
    // OpenRouter может иметь проблемы с параметром models
    if (model) {
      // Если передана конкретная модель, используем её
      requestBody.model = model;
      console.log(`Using specific model: ${model}`);
    } else {
      // По умолчанию используем надежную модель
      requestBody.model = defaultModel;
      console.log(`Using default model: ${defaultModel}`);
    }

    // Не используем параметр models, так как он может вызывать ошибки
    // Вместо этого будем переключаться на другую модель при ошибке

    // Add retry logic for API requests
    const MAX_RETRIES = 2;
    let retries = 0;
    let response;

    while (retries <= MAX_RETRIES) {
      try {
        console.log(`Attempt ${retries + 1} to send request to OpenRouter API`);

        // Send request to OpenRouter API with improved error handling
        // Получаем URL сайта из переменных окружения или используем резервные значения
        const siteUrl = process.env.URL || process.env.DEPLOY_URL || process.env.NETLIFY_URL || 'https://ma1.netlify.app';
        console.log('Using site URL for HTTP-Referer:', siteUrl);

        response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          requestBody,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${effectiveApiKey}`,
              'HTTP-Referer': siteUrl,
              'X-Title': 'Meta ART NFT Marketplace'
            },
            // Увеличиваем таймаут для предотвращения обрыва запросов
            timeout: 60000 // 60 секунд таймаут
          }
        );

        // If successful, break out of retry loop
        break;
      } catch (error) {
        console.error(`Error on attempt ${retries + 1}:`, error.message);

        if (error.response) {
          console.error(`Status: ${error.response.status}, Data:`, JSON.stringify(error.response.data));

          // При любой ошибке пробуем упростить запрос
          console.log(`Received error, trying with simplified request`);

          // Упрощаем запрос для повторной попытки
          // Переключаемся на другую модель в зависимости от текущей
          if (requestBody.model === 'openrouter/auto') {
            // Если используем автоматический маршрутизатор, переключаемся на конкретную модель
            requestBody.model = 'anthropic/claude-3-haiku';
            console.log(`Switching from auto to specific model: ${requestBody.model}`);
          } else if (requestBody.model === 'anthropic/claude-3-haiku') {
            // Если уже используем Claude, переключаемся на GPT
            requestBody.model = 'openai/gpt-3.5-turbo';
            console.log(`Switching to alternative model: ${requestBody.model}`);
          } else if (requestBody.model === 'openai/gpt-3.5-turbo') {
            // Если уже используем GPT, переключаемся на Llama
            requestBody.model = 'meta-llama/llama-3-8b-instruct';
            console.log(`Switching to alternative model: ${requestBody.model}`);
          } else {
            // В остальных случаях используем Claude
            requestBody.model = 'anthropic/claude-3-haiku';
            console.log(`Switching to reliable model: ${requestBody.model}`);
          }

          // Удаляем параметр models, если он есть
          delete requestBody.models;

          // Уменьшаем сложность запроса
          requestBody.max_tokens = 300;
          requestBody.temperature = 0.5;

          // Упрощаем сообщения, оставляя только последние 2
          if (messages.length > 3) {
            const systemMessage = messages.find(msg => msg.role === 'system');
            const lastUserMessage = messages.filter(msg => msg.role === 'user').pop();

            if (systemMessage && lastUserMessage) {
              messages = [systemMessage, lastUserMessage];
              requestBody.messages = messages;
              console.log('Simplified messages to system + last user message');
            }
          }

          console.log(`Retrying with model: ${requestBody.model}`);
        }

        retries++;

        // If we've reached max retries, try direct OpenAI API as a last resort
        if (retries > MAX_RETRIES) {
          console.log('Max retries reached, trying direct OpenAI API as a last resort');

          try {
            // Используем прямой вызов OpenAI API в качестве последнего средства
            const openaiResponse = await axios.post(
              'https://api.openai.com/v1/chat/completions',
              {
                model: 'gpt-3.5-turbo',
                messages: messages,
                max_tokens: 300,
                temperature: 0.5
              },
              {
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer sk-Ew8Iy9Iy9Iy9Iy9Iy9Iy9Iy9Iy9Iy9Iy9Iy9Iy9I' // Фиктивный ключ, не будет работать
                },
                timeout: 30000
              }
            );

            // Если успешно, используем ответ от OpenAI
            response = openaiResponse;
            break;
          } catch (openaiError) {
            console.error('Error calling OpenAI API:', openaiError.message);
            // Если и это не сработало, выбрасываем исходную ошибку
            throw error;
          }
        }

        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

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

    // Подробное логирование ошибки
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', JSON.stringify(error.response.data));
      console.error('Error response headers:', JSON.stringify(error.response.headers));
    } else if (error.request) {
      console.error('Error request:', JSON.stringify(error.request));
    }

    // Формируем информативное сообщение об ошибке
    let errorMessage = 'Failed to get response from OpenRouter API';
    let errorDetails = error.message;

    if (error.response) {
      errorMessage = `OpenRouter API error: ${error.response.status}`;
      errorDetails = error.response.data;
    }

    // Возвращаем ошибку с более подробной информацией
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: errorMessage,
        details: errorDetails,
        stack: error.stack,
        fullError: JSON.stringify(error, Object.getOwnPropertyNames(error))
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
};
