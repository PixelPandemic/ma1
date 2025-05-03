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
  // В режиме разработки всегда используем имитацию ответов
  if (IS_DEVELOPMENT) {
    return generateDemoResponse(prompt, history);
  }

  // В продакшене пытаемся использовать Netlify Function
  try {
    console.log('Generating response via Netlify Function for prompt:', prompt);

    // Отправляем запрос к Netlify Function
    const response = await axios.post(API_URL, {
      prompt,
      history
    });

    console.log('Received response from Netlify Function:', response.data);

    // Возвращаем текст ответа
    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error calling OpenRouter API via Netlify Function:', error);

    // Если произошла ошибка, используем фоллбэк с имитацией ответа
    return generateDemoResponse(prompt, history);
  }
};

/**
 * Имитирует ответ от OpenRouter API
 * @param {string} prompt - Текст запроса пользователя
 * @param {Array} history - История сообщений для контекста
 * @returns {Promise<string>} - Имитированный ответ от API
 */
async function generateDemoResponse(prompt, history = []) {
  console.log('Generating demo response for prompt:', prompt);
  console.log('Using message history:', history);

  // Имитируем задержку для реалистичности
  await new Promise(resolve => setTimeout(resolve, 1500));

  // Проверяем, включен ли режим Super Power
  const isSuperPowerMode = history.some(msg =>
    msg.role === 'system' && (
      msg.content.includes('Super Power mode') ||
      msg.content.includes('Super Power') ||
      msg.content.includes('answer ANY question')
    )
  );

  console.log('Super Power mode detected:', isSuperPowerMode);

  // Если включен режим Super Power, даем универсальные ответы
  if (isSuperPowerMode) {
    // Проверяем язык запроса
    const isRussian = /[а-яА-ЯёЁ]/.test(prompt);

    if (isRussian) {
      // Проверяем, является ли сообщение приветствием
      const isGreeting = /привет|здравствуй|добрый день|доброе утро|добрый вечер|хай/i.test(prompt);

      if (isGreeting) {
        return `[Super Power]

Привет! Рад вас видеть. Чем я могу вам помочь сегодня?`;
      }

      return `[Super Power]

Спасибо за ваш вопрос о "${prompt}".

В режиме Super Power я могу отвечать на вопросы по любым темам и на разных языках. Я не ограничен только информацией о платформе Meta ART.

Чем еще я могу вам помочь?`;
    }

    // Проверяем, является ли сообщение приветствием на английском
    const isEnglishGreeting = /^(hi|hello|hey|greetings|good morning|good afternoon|good evening)$/i.test(prompt.trim());

    if (isEnglishGreeting) {
      return `[Super Power]

Hello! Nice to meet you. How can I help you today?`;
    }

    // Для запросов о программировании
    if (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('programming')) {
      return `[Super Power]

Here's a simple example related to your question about "${prompt}":

\`\`\`javascript
function greetUser(name) {
  return \`Hello, \${name}! Welcome to the world of programming.\`;
}

// Example usage
console.log(greetUser('Developer'));
\`\`\`

This is just a basic example. I can help with more complex programming tasks or explain any programming concept in detail. What specific aspect would you like to explore further?`;
    }

    // Общий ответ для других запросов в режиме Super Power
    return `[Super Power]

Thank you for your question about "${prompt}".

In Super Power mode, I can provide information on virtually any topic, not just about the Meta ART platform. I can help with general knowledge questions, coding problems, creative writing, and much more.

What else would you like to know about this topic?`;
  }

  // Если не включен режим Super Power, используем стандартные ответы о платформе
  const lowercasePrompt = prompt.toLowerCase();
  let response = '';

  // Проверяем ключевые слова в запросе
  if (lowercasePrompt.includes('nft') || lowercasePrompt.includes('token')) {
    response = `Thank you for your question about NFTs and tokens on the Meta ART platform.

Meta ART is an NFT marketplace built on the Polygon Amoy testnet that allows users to create, buy, sell, and stake NFTs. The platform uses its native ART token for rewards and transactions.

Key features of our NFT ecosystem:

1. **NFT Creation**: Artists and creators can mint their digital assets as NFTs with customizable properties.

2. **NFT Auctions**: Sellers can set up auctions with optional "Buy Now" prices, giving buyers flexibility.

3. **NFT Staking**: NFT holders can stake their assets to earn ART tokens as rewards (10 tokens per hour, increasing by 10 each hour).

4. **ART Token**: Our utility token with a total supply of 100,000,000,000,000 tokens, used for rewards, governance, and transactions.

Would you like more specific information about any of these aspects of our NFT ecosystem?`;
  }
  else if (lowercasePrompt.includes('auction') || lowercasePrompt.includes('sell') || lowercasePrompt.includes('buy')) {
    response = `The Meta ART auction system provides a flexible way to sell your NFTs:

1. **Setting Up an Auction**:
   - Go to "My NFTs" section
   - Select the NFT you want to auction
   - Click "Auction"
   - Set a starting price and auction duration
   - Confirm the transaction in your wallet

2. **Auction Features**:
   - Minimum bid increments ensure competitive bidding
   - "Buy Now" option for immediate purchase
   - Real-time countdown timers
   - Automatic transfer to highest bidder when auction ends

3. **Commission Structure**:
   - 5% platform fee on successful auctions
   - 10% fee for "Buy Now" purchases

The auction system is built on smart contracts, ensuring transparency and security for both sellers and buyers. Would you like more details about a specific aspect of the auction process?`;
  }
  else if (lowercasePrompt.includes('stake') || lowercasePrompt.includes('reward')) {
    response = `The Meta ART staking system allows NFT holders to earn passive income through ART token rewards:

**Staking Process**:
1. Navigate to "My NFTs" section
2. Select the NFT you want to stake
3. Click the "Stake" button
4. Confirm the transaction in your wallet

**Reward Structure**:
- Base reward: 10 ART tokens per hour
- Progressive rewards: +10 tokens for each subsequent hour
  - Hour 1: 10 tokens
  - Hour 2: 20 tokens
  - Hour 3: 30 tokens
  - And so on...

**Unstaking**:
- You can unstake your NFT at any time
- All accumulated rewards are transferred to your wallet upon unstaking
- A 5% platform fee is applied to the rewards

Staking is a great way to generate passive income while holding your NFTs. The progressive reward structure incentivizes longer staking periods.

Would you like to know more about how to maximize your staking rewards?`;
  }
  else if (lowercasePrompt.includes('blockchain') || lowercasePrompt.includes('polygon') || lowercasePrompt.includes('network')) {
    response = `Meta ART is built on the Polygon Amoy testnet, which offers several advantages for NFT operations:

**Polygon Amoy Details**:
- Network Name: Polygon Amoy
- RPC URL: https://polygon-amoy.blockpi.network/v1/rpc/public
- Chain ID: 80002
- Currency Symbol: MATIC
- Block Explorer: https://www.oklink.com/amoy

**Benefits of Polygon for NFTs**:
1. **Low Transaction Costs**: Significantly lower gas fees compared to Ethereum mainnet
2. **Fast Transactions**: Quick confirmation times for minting, buying, and selling
3. **Scalability**: Handles high transaction volumes without congestion
4. **Eco-Friendly**: Lower energy consumption compared to proof-of-work blockchains
5. **Ethereum Compatibility**: Uses the same development tools and wallets as Ethereum

The Amoy testnet provides a sandbox environment for testing without using real funds, making it perfect for our platform's development and testing phase.

Would you like more information about connecting to the Polygon Amoy network or how our smart contracts interact with the blockchain?`;
  }
  else {
    // Общий ответ для других запросов
    response = `Thank you for your question about "${prompt}".

Meta ART is an NFT marketplace on the Polygon Amoy testnet that offers several key features:

1. **NFT Minting**: Create your own unique digital assets
2. **NFT Auctions**: Sell your NFTs to the highest bidder with "Buy Now" option
3. **NFT Staking**: Earn ART tokens by staking your NFTs
   - 10 tokens per hour, +10 for each subsequent hour
   - Total ART token supply: 100,000,000,000,000
4. **Commission Structure**:
   - 5% for transactions, minting, and staking
   - 10% for 'buy now' feature

The platform uses smart contracts deployed on the Polygon Amoy testnet, providing a fast and cost-effective environment for NFT transactions.

Is there something specific about the Meta ART platform you'd like to know more about?`;
  }

  console.log('Generated demo response:', response);
  return response;
}
