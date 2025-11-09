import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const GenerateIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
      auto_awesome
  </span>
);

export default GenerateIcon;