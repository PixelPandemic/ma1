// Конфигурация моделей OpenRouter
export const OPENROUTER_MODELS = {
  // Автоматический маршрутизатор
  auto: {
    id: 'openrouter/auto',
    name: 'Auto Router',
    description: 'Автоматически выбирает лучшую модель для вашего запроса',
    category: 'auto'
  },
  
  // Основные модели
  qwen3: {
    id: 'qwen/qwen3-235b-a22b:free',
    name: 'Qwen3 235B',
    description: 'Мощная модель от Alibaba Cloud',
    category: 'primary'
  },
  claude35: {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Новейшая модель от Anthropic',
    category: 'primary'
  },
  claude3opus: {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Самая мощная модель от Anthropic',
    category: 'primary'
  },
  gpt4: {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Мощная модель от OpenAI',
    category: 'primary'
  },
  
  // Резервные модели
  gpt35: {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Быстрая модель от OpenAI',
    category: 'backup'
  },
  llama3: {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Открытая модель от Meta',
    category: 'backup'
  },
  mistral: {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'Мощная модель от Mistral AI',
    category: 'backup'
  }
};

// Предустановленные комбинации моделей для маршрутизации
export const MODEL_PRESETS = {
  default: {
    name: 'По умолчанию',
    description: 'Qwen3 с резервными моделями',
    primary: OPENROUTER_MODELS.qwen3.id,
    fallbacks: [
      OPENROUTER_MODELS.claude35.id,
      OPENROUTER_MODELS.gpt35.id
    ]
  },
  performance: {
    name: 'Производительность',
    description: 'Самые мощные модели',
    primary: OPENROUTER_MODELS.claude3opus.id,
    fallbacks: [
      OPENROUTER_MODELS.gpt4.id,
      OPENROUTER_MODELS.claude35.id
    ]
  },
  balanced: {
    name: 'Сбалансированный',
    description: 'Баланс между скоростью и качеством',
    primary: OPENROUTER_MODELS.claude35.id,
    fallbacks: [
      OPENROUTER_MODELS.gpt35.id,
      OPENROUTER_MODELS.llama3.id
    ]
  },
  auto: {
    name: 'Авто',
    description: 'Автоматический выбор модели',
    primary: OPENROUTER_MODELS.auto.id,
    fallbacks: []
  }
};

// Получить список всех моделей по категориям
export const getModelsByCategory = (category) => {
  return Object.values(OPENROUTER_MODELS).filter(model => model.category === category);
};

// Получить все основные модели
export const getPrimaryModels = () => getModelsByCategory('primary');

// Получить все резервные модели
export const getBackupModels = () => getModelsByCategory('backup');

// Получить все модели
export const getAllModels = () => Object.values(OPENROUTER_MODELS);

// Получить модель по ID
export const getModelById = (id) => {
  return Object.values(OPENROUTER_MODELS).find(model => model.id === id);
};

// Получить все пресеты
export const getAllPresets = () => Object.values(MODEL_PRESETS);
