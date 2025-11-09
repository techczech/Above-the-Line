import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SlideshowIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    slideshow
  </span>
);

export default SlideshowIcon;