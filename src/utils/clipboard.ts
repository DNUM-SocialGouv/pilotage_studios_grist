/** Helpers presse-papiers (texte / HTML riche pour Outlook). */

export async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  const ok = document.execCommand("copy");
  textarea.remove();
  if (!ok) {
    throw new Error("Copie dans le presse-papiers impossible");
  }
}

/** Copie HTML riche + repli texte (Markdown) pour clients mail. */
export async function copyHtmlToClipboard(
  html: string,
  plainFallback: string,
): Promise<void> {
  if (typeof ClipboardItem !== "undefined" && navigator.clipboard?.write) {
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/html": new Blob([html], { type: "text/html" }),
          "text/plain": new Blob([plainFallback], { type: "text/plain" }),
        }),
      ]);
      return;
    } catch {
      // Fallback below (permissions / navigateur).
    }
  }
  await copyTextToClipboard(plainFallback);
}
