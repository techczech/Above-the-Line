import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const GraduationCapIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    school
  </span>
);

export default GraduationCapIcon;