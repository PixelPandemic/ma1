// Функция для блокировки аналитических запросов WalletConnect
export const blockWalletConnectAnalytics = () => {
  if (typeof window === 'undefined') return;

  // Сохраняем оригинальный fetch
  const originalFetch = window.fetch;

  // Переопределяем fetch для блокировки нежелательных запросов
  window.fetch = function(url, options) {
    // Проверяем URL на наличие аналитических эндпоинтов
    if (typeof url === 'string' && (
      url.includes('pulse.walletconnect.org') ||
      url.includes('api.web3modal.org/getAnalyticsConfig') ||
      url.includes('api.web3modal.org/getWallets')
    )) {
      // Возвращаем пустой ответ вместо выполнения запроса
      console.log('Blocked analytics request to:', url);
      return Promise.resolve(new Response(JSON.stringify({}), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }));
    }
    
    // Для всех остальных запросов используем оригинальный fetch
    return originalFetch.apply(this, arguments);
  };

  // Блокируем XMLHttpRequest для аналитических доменов
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    if (typeof url === 'string' && (
      url.includes('pulse.walletconnect.org') ||
      url.includes('api.web3modal.org/getAnalyticsConfig') ||
      url.includes('api.web3modal.org/getWallets')
    )) {
      console.log('Blocked XHR analytics request to:', url);
      // Переопределяем URL на локальный, чтобы запрос не выполнялся
      url = 'about:blank';
    }
    return originalXHROpen.call(this, method, url, ...rest);
  };
};
