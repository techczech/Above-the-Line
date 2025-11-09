import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const FilmIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    movie
  </span>
);

export default FilmIcon;