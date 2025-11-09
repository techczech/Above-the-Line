import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const BookOpenIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    auto_stories
  </span>
);

export default BookOpenIcon;