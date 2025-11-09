import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ArrowUpIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    arrow_upward
  </span>
);

export default ArrowUpIcon;