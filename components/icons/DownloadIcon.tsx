import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const DownloadIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    download
  </span>
);

export default DownloadIcon;