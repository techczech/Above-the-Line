import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ChevronDownIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    expand_more
  </span>
);

export default ChevronDownIcon;