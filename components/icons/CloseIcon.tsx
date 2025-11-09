import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const CloseIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    close
  </span>
);

export default CloseIcon;