# Настройка Netlify для автоматического деплоя

Этот документ содержит инструкции по настройке Netlify для автоматического деплоя вашего проекта Meta ART.

## 1. Настройка сайта на Netlify

### Через интерфейс Netlify

1. Войдите в свой аккаунт Netlify (https://app.netlify.com/)
2. Нажмите "Add new site" → "Import an existing project"
3. Выберите GitHub в качестве Git провайдера
4. Авторизуйтесь в GitHub и предоставьте Netlify доступ к вашим репозиториям
5. Выберите репозиторий `PixelPandemic/mart1`
6. Настройте параметры сборки:
   - Branch to deploy: `main` (или `master`)
   - Build command: `npm install @rainbow-me/rainbowkit@2 wagmi@2 viem@2.x @tanstack/react-query --legacy-peer-deps && npm run build`
   - Publish directory: `build`
   - Functions directory: `netlify/functions`
7. Нажмите "Deploy site"

### Через Netlify CLI

Если вы предпочитаете использовать командную строку:

```bash
# Авторизация в Netlify
npx netlify login

# Инициализация сайта
npx netlify init

# Следуйте инструкциям в интерактивном режиме
# Выберите "Create & configure a new site"
# Выберите команду для сборки и директорию публикации
```

## 2. Настройка переменных окружения

Добавьте необходимые переменные окружения в настройках сайта:

1. Перейдите на страницу вашего сайта в Netlify
2. Перейдите в "Site settings" → "Environment variables"
3. Нажмите "Add variable" и добавьте следующие переменные:
   - `REACT_APP_STAKING_CONTRACT_ADDRESS`
   - `REACT_APP_NFT_CONTRACT_ADDRESS`
   - `REACT_APP_ART_TOKEN_ADDRESS`
   - `REACT_APP_MARKETPLACE_ADDRESS`
   - `REACT_APP_AUCTION_ADDRESS`
   - `REACT_APP_FEE_COLLECTOR`
   - `REACT_APP_BASE_URI`
   - `REACT_APP_POLYGON_AMOY_RPC`
   - `REACT_APP_OPENROUTER_API_KEY`

## 3. Настройка домена

Если вы хотите использовать домен `meart.netlify.app`:

1. Перейдите в "Site settings" → "Domain management"
2. В разделе "Custom domains" нажмите "Add custom domain"
3. Введите `meart.netlify.app` и нажмите "Verify"
4. Следуйте инструкциям для подтверждения домена

## 4. Настройка уведомлений

Настройте уведомления о деплое:

1. Перейдите в "Site settings" → "Notifications"
2. Нажмите "Add notification"
3. Выберите тип уведомления (Email, Slack и т.д.) и настройте его

## 5. Настройка сборки и деплоя

Дополнительные настройки сборки и деплоя:

1. Перейдите в "Site settings" → "Build & deploy"
2. В разделе "Continuous Deployment" настройте:
   - Deploy contexts: Выберите ветки для автоматического деплоя
   - Build hooks: Создайте webhook для запуска сборки из внешних систем
   - Deploy notifications: Настройте уведомления о деплое

## 6. Проверка автоматического деплоя

После настройки интеграции, каждый пуш в ветку `main` или `master` будет автоматически запускать процесс сборки и деплоя на Netlify.

Для проверки:
1. Внесите небольшое изменение в код
2. Закоммитьте и отправьте изменения в репозиторий:
   ```
   git add .
   git commit -m "Test automatic deployment"
   git push origin main
   ```
3. Перейдите на страницу "Deploys" вашего сайта на Netlify и убедитесь, что начался процесс сборки и деплоя

## 7. Управление деплоями

### Блокировка деплоя

Если вам нужно временно заблокировать автоматический деплой:
1. На странице "Deploys" нажмите "Lock deploys"
2. Введите причину блокировки и нажмите "Lock"

Для разблокировки нажмите "Unlock deploys"

### Откат к предыдущей версии

Если новый деплой содержит ошибки:
1. На странице "Deploys" найдите предыдущую стабильную версию
2. Нажмите на три точки справа от этого деплоя
3. Выберите "Publish deploy"

## 8. Мониторинг и логи

Для мониторинга работы сайта и просмотра логов:
1. Перейдите на страницу "Monitoring" вашего сайта
2. Для просмотра логов сборки перейдите на страницу конкретного деплоя и нажмите "View summary"
