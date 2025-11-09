import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const PlayIcon: React.FC<IconProps> = ({ className, ...props }) => (
    <span {...props} className={`material-symbols-outlined ${className || ''}`}>
        play_arrow
    </span>
);

export default PlayIcon;