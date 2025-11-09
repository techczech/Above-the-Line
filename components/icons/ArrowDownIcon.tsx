import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ArrowDownIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    arrow_downward
  </span>
);

export default ArrowDownIcon;