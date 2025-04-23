import React from 'react';
import { Button } from '@chakra-ui/react';
import './ShimmerButton.css';

const ShimmerButton = ({ children, colorScheme, onClick, isLoading, loadingText, width, className, ...props }) => {
  // Определяем класс в зависимости от colorScheme
  let buttonClass = 'shimmer-button';
  
  if (colorScheme === 'green') {
    buttonClass += ' stake-button';
  } else if (colorScheme === 'orange') {
    buttonClass += ' auction-button';
  }
  
  if (className) {
    buttonClass += ` ${className}`;
  }

  return (
    <Button
      className={buttonClass}
      onClick={onClick}
      isLoading={isLoading}
      loadingText={loadingText}
      width={width}
      {...props}
    >
      {children}
    </Button>
  );
};

export default ShimmerButton;
