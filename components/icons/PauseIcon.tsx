import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const PauseIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    pause
  </span>
);

export default PauseIcon;