// Client-side EPUB text extraction via jszip + DOMParser
// EPUB is a ZIP of XHTML files listed in spine
export async function parseEpubFile(file: File): Promise<string> {
  const { default: JSZip } = await import("jszip");
  const buf = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(buf);

  // Find container.xml -> OPF path
  const containerXml = await zip.file("META-INF/container.xml")?.async("string");
  let opfPath = "content.opf";
  if (containerXml) {
    const m = containerXml.match(/full-path="([^"]+)"/);
    if (m) opfPath = m[1];
  }

  const opfContent = await zip.file(opfPath)?.async("string");
  if (!opfContent) throw new Error("Invalid EPUB: missing OPF");

  const parser = new DOMParser();
  const opfDoc = parser.parseFromString(opfContent, "application/xml");

  // manifest id -> href
  const manifest: Record<string, string> = {};
  opfDoc.querySelectorAll("manifest item").forEach((el) => {
    const id = el.getAttribute("id");
    const href = el.getAttribute("href");
    if (id && href) manifest[id] = href;
  });

  // spine order
  const spineIds: string[] = [];
  opfDoc.querySelectorAll("spine itemref").forEach((el) => {
    const idref = el.getAttribute("idref");
    if (idref) spineIds.push(idref);
  });

  const baseDir = opfPath.includes("/") ? opfPath.slice(0, opfPath.lastIndexOf("/") + 1) : "";

  let fullText = "";
  for (const id of spineIds) {
    const href = manifest[id];
    if (!href) continue;
    const fullPath = baseDir + href;
    const fileEntry = zip.file(fullPath);
    if (!fileEntry) continue;
    const html = await fileEntry.async("string");
    const doc = parser.parseFromString(html, "text/html");
    // remove scripts/styles
    doc.querySelectorAll("script, style").forEach((e) => e.remove());
    const text = doc.body?.textContent ?? "";
    // collapse whitespace but preserve paragraph breaks
    const cleaned = text
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .join("\n\n");
    if (cleaned) fullText += cleaned + "\n\n";
  }

  if (!fullText.trim()) throw new Error("Could not extract text from EPUB");
  return fullText.trim();
}
