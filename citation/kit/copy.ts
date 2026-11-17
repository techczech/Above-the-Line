// web-design-elements kit: copy.ts v1
// Copy buttons: <button type="button" data-copy="text"> copies the text; data-copy="#id" copies that element's text.
// Clipboard API first, then the execCommand fallback that still works in file:// and sandboxed viewers.
// The button shows the outcome, including failure, and the failure is also announced through the toast region.
import { toast } from "./toast";

export type CopyOptions = { copied?: string; failed?: string; icon?: (state: "ok" | "failed") => Node | null };

function legacyCopy(text: string): boolean {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.setAttribute("readonly", "");
  ta.style.position = "fixed";
  ta.style.opacity = "0";
  document.body.appendChild(ta);
  ta.select();
  let ok = false;
  try { ok = document.execCommand("copy"); } catch { /* no clipboard available */ }
  ta.remove();
  return ok;
}

export async function copyText(text: string): Promise<boolean> {
  try { await navigator.clipboard.writeText(text); return true; } catch { return legacyCopy(text); }
}

export function initCopy(opts: CopyOptions = {}): void {
  const copied = opts.copied ?? "Copied";
  const failed = opts.failed ?? "Copy failed";
  document.addEventListener("click", async (e) => {
    const b = (e.target as Element).closest<HTMLElement>("[data-copy]");
    if (!b || b.dataset.copyState) return;
    const ref = b.dataset.copy ?? "";
    const text = ref.startsWith("#") ? document.querySelector(ref)?.textContent?.trim() ?? "" : ref;
    const ok = text !== "" && (await copyText(text));
    const kept = Array.from(b.childNodes);
    const mark = opts.icon?.(ok ? "ok" : "failed");
    b.replaceChildren(...(mark ? [mark, " "] : []), ok ? copied : failed);
    b.dataset.copyState = ok ? "copied" : "failed";
    b.classList.add(ok ? "copied" : "copy-failed");
    if (!ok) toast(`${failed}: select the text and copy it by hand.`, { error: true });
    window.setTimeout(() => {
      b.replaceChildren(...kept);
      b.classList.remove("copied", "copy-failed");
      delete b.dataset.copyState;
    }, ok ? 1600 : 3000);
  });
}
