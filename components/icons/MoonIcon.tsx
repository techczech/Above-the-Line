import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const MoonIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    dark_mode
  </span>
);

export default MoonIcon;