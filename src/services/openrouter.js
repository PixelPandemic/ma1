import axios from 'axios';

// URL для Netlify Function
const API_URL = '/api/openrouter';  // URL для продакшена

// Флаг для определения режима разработки
// В режиме разработки всегда используем имитацию ответов
// В продакшене используем реальный API
// Принудительно устанавливаем режим продакшена для тестирования реального API
const IS_DEVELOPMENT = false; // process.env.NODE_ENV === 'development';

// Для отладки
console.log('Current NODE_ENV:', process.env.NODE_ENV);
console.log('IS_DEVELOPMENT (forced to false for testing):', IS_DEVELOPMENT);

/**
 * Отправляет запрос к OpenRouter API через Netlify Function или имитирует ответ
 * @param {string} prompt - Текст запроса пользователя
 * @param {Array} history - История сообщений для контекста
 * @returns {Promise<string>} - Ответ от API или имитация ответа
 */
export const generateResponse = async (prompt, history = []) => {
  // Логируем информацию о запросе
  console.log('generateResponse called with prompt:', prompt);
  console.log('generateResponse called with history:', JSON.stringify(history));

  // ВСЕГДА используем реальный API, независимо от режима
  console.log('Always using real API for all requests');

  // Отправляем запрос к Netlify Function
  try {
    console.log('Generating response via Netlify Function for prompt:', prompt);

    // Отправляем запрос к Netlify Function
    const response = await axios.post(API_URL, {
      prompt,
      history
    });

    console.log('Received response from Netlify Function:', response.data);

    if (response.data && response.data.choices && response.data.choices[0] && response.data.choices[0].message) {
      // Возвращаем текст ответа
      const content = response.data.choices[0].message.content;
      console.log('Returning API response content:', content);
      return content;
    } else {
      console.error('Invalid response format from API:', response.data);
      throw new Error('Invalid response format from API');
    }
  } catch (error) {
    console.error('Error calling OpenRouter API via Netlify Function:', error);

    // Если произошла ошибка, возвращаем сообщение об ошибке вместо демо-ответа
    return `[Super Power]

I apologize, but I couldn't connect to the AI service at the moment. Error: ${error.message}

You asked about "${prompt}". Please try again later when the connection is restored.`;
  }
};

// Функция generateDemoResponse удалена, так как больше не используется
// Все запросы теперь отправляются напрямую к API OpenRouter
