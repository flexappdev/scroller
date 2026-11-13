// Turn a Wikipedia plaintext extract (action=query&prop=extracts&explaintext)
// into display blocks. The extract marks headings as "== Title ==" lines, often
// inside a paragraph, so headings are found per line rather than per paragraph.

export type WikiBlock =
  | { type: "heading"; level: number; text: string }
  | { type: "para"; text: string };

// Reference-style tail sections are not worth reading on a phone.
const STOP_SECTIONS = /^(see also|references|notes|external links|further reading|bibliography|sources|citations|footnotes|works cited|notes and references)$/i;
const HEADING = /^(={2,6})\s*(.+?)\s*\1$/;

export function wikiBlocks(text: string, maxBlocks = 60): WikiBlock[] {
  const blocks: WikiBlock[] = [];
  let para: string[] = [];
  const flush = () => {
    const joined = para.join("\n").trim();
    if (joined) blocks.push({ type: "para", text: joined });
    para = [];
  };

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    const heading = line.match(HEADING);
    if (heading) {
      flush();
      if (STOP_SECTIONS.test(heading[2])) break;
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      continue;
    }
    if (!line) {
      flush();
      continue;
    }
    para.push(line);
  }
  flush();

  // Drop headings with nothing under them (sections that were only tables or
  // galleries) — a heading must be followed by a deeper heading or text.
  const kept = blocks.filter((block, i) => {
    if (block.type !== "heading") return true;
    const next = blocks[i + 1];
    return Boolean(next && (next.type === "para" || next.level > block.level));
  });
  // Second pass catches parents whose only children were removed.
  const cleaned = kept.filter((block, i) => block.type !== "heading" || Boolean(kept[i + 1] && (kept[i + 1].type === "para" || (kept[i + 1] as { level: number }).level > block.level)));
  return cleaned.slice(0, maxBlocks);
}

export function wordCount(text: string): number {
  return text.replace(/^=+.*=+$/gm, " ").split(/\s+/).filter(Boolean).length;
}
