import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SunIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    light_mode
  </span>
);

export default SunIcon;