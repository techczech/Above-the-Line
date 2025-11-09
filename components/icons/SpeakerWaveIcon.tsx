import React from 'react';

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {}

const SpeakerWaveIcon: React.FC<IconProps> = ({ className, ...props }) => (
  <span {...props} className={`material-symbols-outlined ${className || ''}`}>
    volume_up
  </span>
);

export default SpeakerWaveIcon;