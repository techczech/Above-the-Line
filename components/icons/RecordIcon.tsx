import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const RecordIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <span {...props} className={`material-symbols-outlined ${className || ''}`}>
        fiber_manual_record
    </span>
);

export default RecordIcon;