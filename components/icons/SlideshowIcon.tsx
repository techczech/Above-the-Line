import React from 'react';

const SlideshowIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <path d="M8 12h8" />
    <path d="M12 8v8" />
  </svg>
);

export default SlideshowIcon;