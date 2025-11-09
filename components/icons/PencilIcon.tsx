import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const PencilIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    edit
  </span>
);

export default PencilIcon;