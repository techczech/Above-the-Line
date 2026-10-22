/// <reference types="vite/client" />
declare module 'https://cdn.jsdelivr.net/npm/file-saver@2.0.5/+esm' {
  const saveAs: (blob: Blob, filename: string) => void;
  export default saveAs;
}
