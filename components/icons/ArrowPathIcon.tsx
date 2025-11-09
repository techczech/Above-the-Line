import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ArrowPathIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <span {...props} className={`material-symbols-outlined ${className || ''}`}>
        loop
    </span>
);

export default ArrowPathIcon;