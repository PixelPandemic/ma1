# Настройка интеграции Netlify с GitHub

Для настройки автоматического деплоя из GitHub в Netlify, выполните следующие шаги:

## 1. Настройка секретов в GitHub

Перейдите в настройки вашего репозитория на GitHub:
1. Откройте репозиторий на GitHub
2. Перейдите в раздел "Settings" (Настройки)
3. В боковом меню выберите "Secrets and variables" → "Actions"
4. Нажмите кнопку "New repository secret"
5. Добавьте следующие секреты:

   - `NETLIFY_AUTH_TOKEN`: Ваш токен авторизации Netlify
   - `NETLIFY_SITE_ID`: ID вашего сайта на Netlify (1b8593b6-2212-499a-9c79-369949c7ac0a)
   - `REACT_APP_STAKING_CONTRACT_ADDRESS`: Адрес контракта стейкинга
   - `REACT_APP_NFT_CONTRACT_ADDRESS`: Адрес NFT контракта
   - `REACT_APP_ART_TOKEN_ADDRESS`: Адрес токена ART
   - `REACT_APP_MARKETPLACE_ADDRESS`: Адрес маркетплейса
   - `REACT_APP_AUCTION_ADDRESS`: Адрес аукциона
   - `REACT_APP_FEE_COLLECTOR`: Адрес сборщика комиссий
   - `REACT_APP_BASE_URI`: Базовый URI
   - `REACT_APP_POLYGON_AMOY_RPC`: RPC URL для Polygon Amoy
   - `REACT_APP_OPENROUTER_API_KEY`: API ключ для OpenRouter

## 2. Получение токена авторизации Netlify

Если у вас еще нет токена авторизации Netlify:
1. Войдите в свой аккаунт Netlify
2. Перейдите в настройки пользователя (User Settings)
3. Выберите "Applications"
4. В разделе "Personal access tokens" нажмите "New access token"
5. Введите описание токена и нажмите "Generate token"
6. Скопируйте сгенерированный токен и сохраните его в секретах GitHub как `NETLIFY_AUTH_TOKEN`

## 3. Настройка сайта на Netlify

1. Войдите в свой аккаунт Netlify
2. Перейдите на страницу вашего сайта
3. Перейдите в раздел "Site settings" (Настройки сайта)
4. В разделе "Build & deploy" выберите "Continuous Deployment"
5. Нажмите "Link to Git provider" и выберите GitHub
6. Авторизуйтесь в GitHub и выберите нужный репозиторий
7. Настройте параметры сборки:
   - Build command: `npm install @rainbow-me/rainbowkit@2 wagmi@2 viem@2.x @tanstack/react-query --legacy-peer-deps && npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`
8. Нажмите "Deploy site"

## 4. Проверка автоматического деплоя

После настройки интеграции, каждый пуш в ветки `main` или `master` будет автоматически запускать процесс сборки и деплоя на Netlify.

Для проверки:
1. Внесите небольшое изменение в код
2. Закоммитьте и отправьте изменения в репозиторий:
   ```
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Перейдите на страницу "Deploys" вашего сайта на Netlify и убедитесь, что начался процесс сборки и деплоя

## Дополнительные настройки

### Настройка уведомлений о деплое

1. В настройках сайта на Netlify перейдите в раздел "Notifications"
2. Нажмите "Add notification"
3. Выберите тип уведомления (Email, Slack и т.д.) и настройте его

### Блокировка деплоя

Если вам нужно временно заблокировать автоматический деплой:
1. На странице "Deploys" нажмите "Lock deploys"
2. Введите причину блокировки и нажмите "Lock"

Для разблокировки нажмите "Unlock deploys"
