import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SpinnerIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <span {...props} className={`material-symbols-outlined animate-spin ${className || ''}`}>
        progress_activity
    </span>
);

export default SpinnerIcon;