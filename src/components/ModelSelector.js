import React, { useState } from 'react';
import {
  Box,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  MenuGroup,
  Text,
  Flex,
  Badge,
  Tooltip,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Radio,
  RadioGroup,
  Stack,
  Checkbox,
  VStack,
  HStack,
  Icon
} from '@chakra-ui/react';
import { ChevronDownIcon, InfoIcon, SettingsIcon } from '@chakra-ui/icons';
import { FaRobot, FaExchangeAlt } from 'react-icons/fa';
import { OPENROUTER_MODELS, MODEL_PRESETS, getAllModels, getPrimaryModels, getBackupModels } from '../config/openrouter-models';

const ModelSelector = ({ selectedModel, onModelChange, selectedPreset, onPresetChange, customFallbacks, onFallbacksChange, isMobile }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [tempSelectedPreset, setTempSelectedPreset] = useState(selectedPreset || 'default');
  const [tempCustomFallbacks, setTempCustomFallbacks] = useState(customFallbacks || []);
  const [customMode, setCustomMode] = useState(selectedPreset === 'custom');
  const [tempPrimaryModel, setTempPrimaryModel] = useState(selectedModel || OPENROUTER_MODELS.qwen3.id);

  // Получаем информацию о текущей модели
  const currentModel = Object.values(OPENROUTER_MODELS).find(model => model.id === selectedModel) || OPENROUTER_MODELS.qwen3;

  // Получаем информацию о текущем пресете
  const currentPreset = MODEL_PRESETS[selectedPreset] || MODEL_PRESETS.default;

  // Обработчик изменения пресета
  const handlePresetChange = (presetId) => {
    setTempSelectedPreset(presetId);

    if (presetId !== 'custom') {
      const preset = MODEL_PRESETS[presetId];
      setTempPrimaryModel(preset.primary);
      setTempCustomFallbacks(preset.fallbacks || []);
      setCustomMode(false);
    } else {
      setCustomMode(true);
    }
  };

  // Обработчик изменения основной модели в пользовательском режиме
  const handlePrimaryModelChange = (modelId) => {
    setTempPrimaryModel(modelId);
  };

  // Обработчик изменения резервных моделей
  const handleFallbackToggle = (modelId) => {
    if (tempCustomFallbacks.includes(modelId)) {
      setTempCustomFallbacks(tempCustomFallbacks.filter(id => id !== modelId));
    } else {
      setTempCustomFallbacks([...tempCustomFallbacks, modelId]);
    }
  };

  // Обработчик сохранения настроек
  const handleSaveSettings = () => {
    if (customMode) {
      onPresetChange('custom');
      onModelChange(tempPrimaryModel);
      onFallbacksChange(tempCustomFallbacks);
    } else {
      onPresetChange(tempSelectedPreset);
      const preset = MODEL_PRESETS[tempSelectedPreset];
      onModelChange(preset.primary);
      onFallbacksChange(preset.fallbacks || []);
    }
    onClose();
  };

  // Быстрый выбор модели без открытия модального окна
  const handleQuickModelSelect = (modelId) => {
    onModelChange(modelId);
    onPresetChange('custom');
    // Сохраняем текущие резервные модели
    onFallbacksChange(customFallbacks);
  };

  // Быстрый выбор пресета без открытия модального окна
  const handleQuickPresetSelect = (presetId) => {
    onPresetChange(presetId);
    const preset = MODEL_PRESETS[presetId];
    onModelChange(preset.primary);
    onFallbacksChange(preset.fallbacks || []);
  };

  return (
    <>
      <Menu closeOnSelect={false}>
        <Tooltip label="Select AI Model" placement="top">
          <MenuButton
            as={Button}
            rightIcon={<ChevronDownIcon />}
            leftIcon={<Icon as={FaRobot} />}
            colorScheme="teal"
            size={isMobile ? "sm" : "md"}
            variant="solid"
            _hover={{ bg: "teal.500" }}
          >
            {isMobile ? currentModel.name.split(' ')[0] : currentModel.name}
          </MenuButton>
        </Tooltip>
        <MenuList zIndex={1000}>
          <MenuGroup title="Quick Model Selection">
            {getPrimaryModels().map(model => (
              <MenuItem key={model.id} onClick={() => handleQuickModelSelect(model.id)}>
                <Flex alignItems="center" justifyContent="space-between" width="100%">
                  <Text>{model.name}</Text>
                  {model.id === selectedModel && (
                    <Badge colorScheme="green" ml={2}>Active</Badge>
                  )}
                </Flex>
              </MenuItem>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuGroup title="Routing Presets">
            {Object.entries(MODEL_PRESETS).map(([id, preset]) => (
              <MenuItem key={id} onClick={() => handleQuickPresetSelect(id)}>
                <Flex alignItems="center" justifyContent="space-between" width="100%">
                  <Text>{preset.name}</Text>
                  {id === selectedPreset && (
                    <Badge colorScheme="purple" ml={2}>Active</Badge>
                  )}
                </Flex>
              </MenuItem>
            ))}
          </MenuGroup>
          <MenuDivider />
          <MenuItem icon={<SettingsIcon />} onClick={onOpen}>
            Advanced Settings
          </MenuItem>
        </MenuList>
      </Menu>

      {/* Advanced settings modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Model Routing Settings</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Box>
                <Text fontWeight="bold" mb={2}>Select a preset:</Text>
                <RadioGroup onChange={handlePresetChange} value={tempSelectedPreset}>
                  <Stack direction="column" spacing={2}>
                    {Object.entries(MODEL_PRESETS).map(([id, preset]) => (
                      <Radio key={id} value={id}>
                        <Flex alignItems="center">
                          <Text fontWeight="medium">{preset.name}</Text>
                          <Tooltip label={preset.description}>
                            <InfoIcon ml={2} color="gray.500" />
                          </Tooltip>
                        </Flex>
                      </Radio>
                    ))}
                    <Radio value="custom">
                      <Flex alignItems="center">
                        <Text fontWeight="medium">Custom</Text>
                        <Tooltip label="Configure your own model combination">
                          <InfoIcon ml={2} color="gray.500" />
                        </Tooltip>
                      </Flex>
                    </Radio>
                  </Stack>
                </RadioGroup>
              </Box>

              {customMode && (
                <>
                  <Box>
                    <Text fontWeight="bold" mb={2}>Primary model:</Text>
                    <RadioGroup onChange={handlePrimaryModelChange} value={tempPrimaryModel}>
                      <Stack direction="column" spacing={2}>
                        {getAllModels().map(model => (
                          <Radio key={model.id} value={model.id}>
                            <Flex alignItems="center">
                              <Text>{model.name}</Text>
                              <Tooltip label={model.description}>
                                <InfoIcon ml={2} color="gray.500" />
                              </Tooltip>
                            </Flex>
                          </Radio>
                        ))}
                      </Stack>
                    </RadioGroup>
                  </Box>

                  <Box>
                    <HStack mb={2}>
                      <Text fontWeight="bold">Fallback models:</Text>
                      <Tooltip label="These models will be used if the primary model is unavailable or returns an error">
                        <InfoIcon color="gray.500" />
                      </Tooltip>
                    </HStack>
                    <VStack align="start" spacing={2}>
                      {getBackupModels().map(model => (
                        <Checkbox
                          key={model.id}
                          isChecked={tempCustomFallbacks.includes(model.id)}
                          onChange={() => handleFallbackToggle(model.id)}
                        >
                          <Flex alignItems="center">
                            <Text>{model.name}</Text>
                            <Tooltip label={model.description}>
                              <InfoIcon ml={2} color="gray.500" />
                            </Tooltip>
                          </Flex>
                        </Checkbox>
                      ))}
                    </VStack>
                  </Box>
                </>
              )}

              <Box p={3} bg="gray.50" borderRadius="md">
                <Flex alignItems="center" mb={2}>
                  <Icon as={FaExchangeAlt} color="purple.500" mr={2} />
                  <Text fontWeight="bold">Current configuration:</Text>
                </Flex>
                <Text>
                  {customMode
                    ? `Primary model: ${getAllModels().find(m => m.id === tempPrimaryModel)?.name || 'Not selected'}`
                    : `Preset: ${MODEL_PRESETS[tempSelectedPreset]?.name || 'Not selected'}`
                  }
                </Text>
                {(customMode && tempCustomFallbacks.length > 0) && (
                  <Text mt={1}>
                    Fallback models: {tempCustomFallbacks.map(id =>
                      getAllModels().find(m => m.id === id)?.name
                    ).join(', ')}
                  </Text>
                )}
                {(!customMode && MODEL_PRESETS[tempSelectedPreset]?.fallbacks?.length > 0) && (
                  <Text mt={1}>
                    Fallback models: {MODEL_PRESETS[tempSelectedPreset].fallbacks.map(id =>
                      getAllModels().find(m => m.id === id)?.name
                    ).join(', ')}
                  </Text>
                )}
              </Box>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" onClick={handleSaveSettings}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ModelSelector;
