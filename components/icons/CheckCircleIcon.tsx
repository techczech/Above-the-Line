import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const CheckCircleIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    check_circle
  </span>
);

export default CheckCircleIcon;