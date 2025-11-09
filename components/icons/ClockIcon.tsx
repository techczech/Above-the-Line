import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ClockIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    schedule
  </span>
);

export default ClockIcon;