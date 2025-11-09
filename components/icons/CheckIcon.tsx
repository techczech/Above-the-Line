import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const CheckIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <span {...props} className={`material-symbols-outlined ${className || ''}`}>
        check
    </span>
);

export default CheckIcon;