# Настройка автоматического деплоя для Meta ART NFT Marketplace

Этот документ содержит инструкции по настройке автоматического деплоя проекта Meta ART NFT Marketplace на Netlify с использованием GitHub Actions.

## Шаги по настройке GitHub Actions

### 1. Настройка секретов в GitHub

1. Перейдите в репозиторий на GitHub
2. Нажмите на вкладку "Settings"
3. В боковом меню выберите "Secrets and variables" -> "Actions"
4. Добавьте следующие секреты:

   - `REACT_APP_STAKING_CONTRACT_ADDRESS`: Адрес контракта стейкинга
   - `REACT_APP_NFT_CONTRACT_ADDRESS`: Адрес контракта NFT
   - `REACT_APP_ART_TOKEN_ADDRESS`: Адрес токена ART
   - `REACT_APP_MARKETPLACE_ADDRESS`: Адрес маркетплейса
   - `REACT_APP_AUCTION_ADDRESS`: Адрес аукциона
   - `REACT_APP_FEE_COLLECTOR`: Адрес для сбора комиссий
   - `REACT_APP_BASE_URI`: Базовый URI для NFT
   - `REACT_APP_POLYGON_AMOY_RPC`: URL RPC для Polygon Amoy
   - `REACT_APP_OPENROUTER_API_KEY`: API ключ OpenRouter
   - `NETLIFY_AUTH_TOKEN`: Токен авторизации Netlify
   - `NETLIFY_SITE_ID`: ID сайта на Netlify

### 2. Получение токена Netlify

1. Войдите в свой аккаунт Netlify
2. Перейдите в "User settings" -> "Applications"
3. В разделе "Personal access tokens" нажмите "New access token"
4. Введите название токена и нажмите "Generate token"
5. Скопируйте сгенерированный токен и сохраните его как секрет `NETLIFY_AUTH_TOKEN` в GitHub

### 3. Получение ID сайта Netlify

1. Войдите в свой аккаунт Netlify
2. Выберите ваш сайт
3. Перейдите в "Site settings" -> "General"
4. Скопируйте "Site ID" и сохраните его как секрет `NETLIFY_SITE_ID` в GitHub

## Настройка Netlify

### 1. Настройка переменных окружения в Netlify

1. Войдите в свой аккаунт Netlify
2. Выберите ваш сайт
3. Перейдите в "Site settings" -> "Build & deploy" -> "Environment"
4. Добавьте те же переменные окружения, что и в GitHub Actions:
   - `REACT_APP_STAKING_CONTRACT_ADDRESS`
   - `REACT_APP_NFT_CONTRACT_ADDRESS`
   - `REACT_APP_ART_TOKEN_ADDRESS`
   - `REACT_APP_MARKETPLACE_ADDRESS`
   - `REACT_APP_AUCTION_ADDRESS`
   - `REACT_APP_FEE_COLLECTOR`
   - `REACT_APP_BASE_URI`
   - `REACT_APP_POLYGON_AMOY_RPC`
   - `REACT_APP_OPENROUTER_API_KEY`

### 2. Настройка деплоя

1. В настройках сайта Netlify перейдите в "Build & deploy" -> "Continuous Deployment"
2. В разделе "Build settings" убедитесь, что:
   - Build command: `npm run build`
   - Publish directory: `build`
3. В разделе "Deploy contexts" выберите:
   - Production branch: `main` или `master` (в зависимости от вашего репозитория)
   - Branch deploys: `Deploy only the production branch`

## Использование автоматического деплоя

После настройки автоматический деплой будет работать следующим образом:

1. При пуше в ветку `main` или `master` GitHub Actions запустит процесс сборки
2. После успешной сборки GitHub Actions автоматически задеплоит сайт на Netlify
3. Вы получите комментарий в вашем коммите с ссылкой на деплой

## Локальное тестирование перед деплоем

Для локального тестирования перед пушем в репозиторий:

1. Запустите проверку линтера:
   ```
   npm run lint
   ```

2. Запустите сборку проекта:
   ```
   npm run build
   ```

3. Протестируйте локальный деплой на Netlify:
   ```
   npx netlify deploy
   ```

4. Если все работает корректно, выполните полный деплой:
   ```
   npm run deploy
   ```

## Устранение неполадок

Если возникают проблемы с автоматическим деплоем:

1. Проверьте логи GitHub Actions во вкладке "Actions" вашего репозитория
2. Проверьте логи деплоя в Netlify в разделе "Deploys"
3. Убедитесь, что все секреты и переменные окружения настроены правильно
4. Проверьте, что ветка, в которую вы пушите, соответствует настройкам деплоя
