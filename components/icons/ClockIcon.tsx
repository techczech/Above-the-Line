import React from 'react';

// FIX: Add `title` to the component's props to resolve a TypeScript error. The `title` attribute provides tooltip text.
const ClockIcon: React.FC<React.SVGProps<SVGSVGElement> & { title?: string }> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

export default ClockIcon;
