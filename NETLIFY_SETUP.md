# Настройка Netlify для Meta ART NFT Marketplace

Этот документ содержит инструкции по настройке проекта Meta ART NFT Marketplace на Netlify с поддержкой Netlify Functions для интеграции с OpenRouter API.

## Шаги по настройке

### 1. Создание нового проекта в Netlify

1. Зарегистрируйтесь или войдите в [Netlify](https://app.netlify.com/)
2. Нажмите "New site from Git"
3. Выберите ваш Git-провайдер (GitHub, GitLab, Bitbucket)
4. Выберите репозиторий с проектом Meta ART
5. Настройте параметры сборки:
   - Build command: `npm run build`
   - Publish directory: `build`

### 2. Настройка переменных окружения

В настройках проекта в Netlify (Site settings > Build & deploy > Environment):

1. Добавьте переменную окружения `OPENROUTER_API_KEY` с вашим API ключом OpenRouter:
   - Ключ: `OPENROUTER_API_KEY`
   - Значение: `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`

2. Добавьте переменную окружения `URL` с URL вашего сайта:
   - Ключ: `URL`
   - Значение: `https://your-site-name.netlify.app` (замените на ваш URL)

### 3. Настройка Netlify Functions

Netlify автоматически обнаружит и развернет функции из директории `netlify/functions`. Убедитесь, что файл `netlify.toml` находится в корне проекта и содержит правильные настройки:

```toml
[build]
  command = "npm run build"
  publish = "build"
  functions = "netlify/functions"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

### 4. Локальное тестирование

Для локального тестирования Netlify Functions:

1. Установите Netlify CLI:
   ```
   npm install netlify-cli --save-dev
   ```

2. Запустите локальный сервер Netlify:
   ```
   npx netlify dev
   ```

3. Откройте http://localhost:8888 в браузере

### 5. Деплой

После настройки просто запушьте изменения в ваш репозиторий, и Netlify автоматически развернет ваш сайт с функциями.

## Проверка работоспособности

Чтобы проверить, что Netlify Function для OpenRouter API работает корректно:

1. Включите режим Super Power в AI Assistant
2. Задайте вопрос
3. Проверьте консоль разработчика на наличие ошибок
4. Проверьте логи функции в Netlify (Functions > openrouter > Logs)

## Устранение неполадок

Если возникают проблемы:

1. Проверьте, что API ключ OpenRouter правильно установлен в переменных окружения
2. Проверьте логи функции в Netlify
3. Убедитесь, что редиректы настроены правильно
4. Проверьте, что CORS настроен правильно в функции

## Дополнительные ресурсы

- [Документация Netlify Functions](https://docs.netlify.com/functions/overview/)
- [Документация OpenRouter API](https://openrouter.ai/docs)
