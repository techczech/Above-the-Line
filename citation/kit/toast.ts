// web-design-elements kit: toast.ts v1
// Short status messages in the page's one polite live region:
//   <div class="toast" id="toast" role="status" aria-live="polite"></div>
// The region is in the HTML from the start (screen readers ignore regions added later). Text only, via textContent.

let timer: number | undefined;

export function toast(message: string, opts: { error?: boolean; ms?: number; id?: string } = {}): void {
  const region = document.getElementById(opts.id ?? "toast");
  if (!region) return;
  region.textContent = message;
  region.classList.toggle("error", !!opts.error);
  region.classList.add("show");
  window.clearTimeout(timer);
  timer = window.setTimeout(() => region.classList.remove("show"), opts.ms ?? (opts.error ? 4000 : 1800));
}
