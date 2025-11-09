import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const VideoOffIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    videocam_off
  </span>
);

export default VideoOffIcon;