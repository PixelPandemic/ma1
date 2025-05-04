// OpenRouter Models Configuration
export const OPENROUTER_MODELS = {
  // Auto Router
  auto: {
    id: 'openrouter/auto',
    name: 'Auto Router',
    description: 'Automatically selects the best model for your query',
    category: 'auto'
  },

  // Primary Models - Top tier models
  claude3opus: {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    description: 'Most powerful model from Anthropic',
    category: 'primary'
  },
  claude35: {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Latest model from Anthropic',
    category: 'primary'
  },
  claude3sonnet: {
    id: 'anthropic/claude-3-sonnet',
    name: 'Claude 3 Sonnet',
    description: 'Balanced model from Anthropic',
    category: 'primary'
  },
  claude3haiku: {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    description: 'Fast model from Anthropic',
    category: 'primary'
  },
  gpt4o: {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Latest omni model from OpenAI',
    category: 'primary'
  },
  gpt4turbo: {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Powerful model from OpenAI',
    category: 'primary'
  },
  qwen3: {
    id: 'qwen/qwen3-235b-a22b:free',
    name: 'Qwen3 235B',
    description: 'Powerful model from Alibaba Cloud',
    category: 'primary'
  },
  mistralLarge: {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    description: 'Powerful model from Mistral AI',
    category: 'primary'
  },
  llama370b: {
    id: 'meta-llama/llama-3-70b-instruct',
    name: 'Llama 3 70B',
    description: 'Powerful open model from Meta',
    category: 'primary'
  },

  // Secondary Models - Good balance of performance and cost
  gpt35turbo: {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast model from OpenAI',
    category: 'secondary'
  },
  mistralMedium: {
    id: 'mistralai/mistral-medium',
    name: 'Mistral Medium',
    description: 'Balanced model from Mistral AI',
    category: 'secondary'
  },
  llama38b: {
    id: 'meta-llama/llama-3-8b-instruct',
    name: 'Llama 3 8B',
    description: 'Compact model from Meta',
    category: 'secondary'
  },
  claude2: {
    id: 'anthropic/claude-2',
    name: 'Claude 2',
    description: 'Previous generation model from Anthropic',
    category: 'secondary'
  },

  // Specialized Models
  gemini15pro: {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    description: 'Advanced model from Google',
    category: 'specialized'
  },
  gemini15flash: {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    description: 'Fast model from Google',
    category: 'specialized'
  },
  cohere: {
    id: 'cohere/command-r',
    name: 'Cohere Command-R',
    description: 'Specialized for reasoning tasks',
    category: 'specialized'
  },
  perplexityOnline: {
    id: 'perplexity/pplx-online',
    name: 'Perplexity Online',
    description: 'Model with internet access',
    category: 'specialized'
  },

  // Backup Models - Reliable fallbacks
  gpt35: {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and reliable model from OpenAI',
    category: 'backup'
  },
  mistralSmall: {
    id: 'mistralai/mistral-small',
    name: 'Mistral Small',
    description: 'Compact model from Mistral AI',
    category: 'backup'
  },
  llama3: {
    id: 'meta-llama/llama-3-8b-instruct',
    name: 'Llama 3 8B',
    description: 'Reliable open model from Meta',
    category: 'backup'
  }
};

// Predefined model routing combinations
export const MODEL_PRESETS = {
  auto: {
    name: 'Auto Router',
    description: 'Automatically selects the best model for your query',
    primary: OPENROUTER_MODELS.auto.id,
    fallbacks: []
  },
  performance: {
    name: 'Performance',
    description: 'Most powerful models for complex tasks',
    primary: OPENROUTER_MODELS.claude3opus.id,
    fallbacks: [
      OPENROUTER_MODELS.gpt4o.id,
      OPENROUTER_MODELS.claude35.id
    ]
  },
  balanced: {
    name: 'Balanced',
    description: 'Good balance between speed and quality',
    primary: OPENROUTER_MODELS.claude35.id,
    fallbacks: [
      OPENROUTER_MODELS.gpt35.id,
      OPENROUTER_MODELS.llama3.id
    ]
  },
  qwen: {
    name: 'Qwen',
    description: 'Qwen3 with fallback models',
    primary: OPENROUTER_MODELS.qwen3.id,
    fallbacks: [
      OPENROUTER_MODELS.claude35.id,
      OPENROUTER_MODELS.gpt35.id
    ]
  },
  anthropic: {
    name: 'Anthropic',
    description: 'Claude models from Anthropic',
    primary: OPENROUTER_MODELS.claude35.id,
    fallbacks: [
      OPENROUTER_MODELS.claude3sonnet.id,
      OPENROUTER_MODELS.claude3haiku.id
    ]
  },
  openai: {
    name: 'OpenAI',
    description: 'GPT models from OpenAI',
    primary: OPENROUTER_MODELS.gpt4o.id,
    fallbacks: [
      OPENROUTER_MODELS.gpt4turbo.id,
      OPENROUTER_MODELS.gpt35.id
    ]
  },
  meta: {
    name: 'Meta',
    description: 'Llama models from Meta',
    primary: OPENROUTER_MODELS.llama370b.id,
    fallbacks: [
      OPENROUTER_MODELS.llama38b.id
    ]
  },
  google: {
    name: 'Google',
    description: 'Gemini models from Google',
    primary: OPENROUTER_MODELS.gemini15pro.id,
    fallbacks: [
      OPENROUTER_MODELS.gemini15flash.id
    ]
  },
  specialized: {
    name: 'Specialized',
    description: 'Models with special capabilities',
    primary: OPENROUTER_MODELS.perplexityOnline.id,
    fallbacks: [
      OPENROUTER_MODELS.cohere.id
    ]
  }
};

// Get list of models by category
export const getModelsByCategory = (category) => {
  return Object.values(OPENROUTER_MODELS).filter(model => model.category === category);
};

// Get all primary models
export const getPrimaryModels = () => getModelsByCategory('primary');

// Get all secondary models
export const getSecondaryModels = () => getModelsByCategory('secondary');

// Get all specialized models
export const getSpecializedModels = () => getModelsByCategory('specialized');

// Get all backup models
export const getBackupModels = () => getModelsByCategory('backup');

// Get auto router model
export const getAutoRouter = () => getModelsByCategory('auto');

// Get all models
export const getAllModels = () => Object.values(OPENROUTER_MODELS);

// Get model by ID
export const getModelById = (id) => {
  return Object.values(OPENROUTER_MODELS).find(model => model.id === id);
};

// Get all presets
export const getAllPresets = () => Object.values(MODEL_PRESETS);

// Get preset by ID
export const getPresetById = (id) => {
  return MODEL_PRESETS[id];
};
