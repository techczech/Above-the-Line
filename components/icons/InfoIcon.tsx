import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const InfoIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    info
  </span>
);

export default InfoIcon;