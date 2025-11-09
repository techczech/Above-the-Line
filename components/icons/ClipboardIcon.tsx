import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ClipboardIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    content_copy
  </span>
);

export default ClipboardIcon;