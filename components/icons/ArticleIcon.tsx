import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ArticleIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    article
  </span>
);

export default ArticleIcon;
