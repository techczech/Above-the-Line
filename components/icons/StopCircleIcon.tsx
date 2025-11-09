import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const StopCircleIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    stop_circle
  </span>
);

export default StopCircleIcon;