import React, { useState } from 'react';
import { citeText, type CitePage } from './kit/citation';
import { copyText } from './kit/copy';
import { citationPage } from './page';

export function CiteThisPage({ page = citationPage }: { page?: CitePage }) {
  const [status, setStatus] = useState('');
  const text = citeText(page);
  return <section aria-label="Cite this page" style={{ margin: '1.5rem auto', maxWidth: '65ch', padding: '0 1rem', fontSize: '0.875rem', overflowWrap: 'anywhere' }}>
    <h2 style={{ fontSize: '1rem', fontWeight: 600 }}>Cite this page</h2>
    <p style={{ margin: '0.5rem 0' }}>{text}</p>
    <button type="button" style={{ border: '1px solid currentColor', borderRadius: '0.25rem', padding: '0.25rem 0.5rem' }} onClick={async () => setStatus(await copyText(text) ? 'Citation copied.' : 'Copy failed. Select the citation text and copy it manually.')}>Copy citation</button>
    <p role="status" aria-live="polite">{status}</p>
  </section>;
}
