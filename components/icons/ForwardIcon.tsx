import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const ForwardIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <span {...props} className={`material-symbols-outlined ${className || ''}`}>
        skip_next
    </span>
);

export default ForwardIcon;