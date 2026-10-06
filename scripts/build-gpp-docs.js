/**
 * One-off: convert content/growth-partners/*.md into docs/growth-partner-*.html
 * Preserves source wording; does not modify Markdown files.
 */
const fs = require('fs');

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineFormat(text) {
  let s = escapeHtml(text);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return s;
}

function convertMarkdown(md) {
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let i = 0;
  let inUl = false;
  let inOl = false;
  let inBq = false;
  let tableRows = [];

  function closeLists() {
    if (inUl) { out.push('</ul>'); inUl = false; }
    if (inOl) { out.push('</ol>'); inOl = false; }
  }
  function closeBq() {
    if (inBq) { out.push('</blockquote>'); inBq = false; }
  }
  function flushTable() {
    if (!tableRows.length) return;
    const rows = tableRows.slice();
    tableRows = [];
    const parsed = rows.map(row =>
      row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => c.trim())
    );
    const isSep = (cells) => cells.every(c => /^:?-{3,}:?$/.test(c));
    let html = '<table class="gpp-table">';
    let headerDone = false;
    let bodyOpen = false;
    for (const cells of parsed) {
      if (isSep(cells)) continue;
      if (!headerDone) {
        html += '<thead><tr>' + cells.map(c => '<th>' + inlineFormat(c) + '</th>').join('') + '</tr></thead><tbody>';
        headerDone = true;
        bodyOpen = true;
      } else {
        html += '<tr>' + cells.map(c => '<td>' + inlineFormat(c) + '</td>').join('') + '</tr>';
      }
    }
    if (bodyOpen) html += '</tbody>';
    html += '</table>';
    out.push(html);
  }

  while (i < lines.length) {
    const line = lines[i];

    if (/^\|/.test(line)) {
      closeLists();
      closeBq();
      while (i < lines.length && /^\|/.test(lines[i])) {
        tableRows.push(lines[i]);
        i++;
      }
      flushTable();
      continue;
    }

    if (/^\s*$/.test(line)) {
      closeLists();
      closeBq();
      i++;
      continue;
    }

    if (/^---\s*$/.test(line)) {
      closeLists();
      closeBq();
      out.push('<hr />');
      i++;
      continue;
    }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      closeLists();
      closeBq();
      const level = h[1].length;
      let tag = 'h4';
      if (level === 1) tag = 'h2';
      else if (level === 2) tag = 'h3';
      else if (level === 3) tag = 'h4';
      out.push('<' + tag + '>' + inlineFormat(h[2].trim()) + '</' + tag + '>');
      i++;
      continue;
    }

    if (/^>\s?/.test(line)) {
      closeLists();
      if (!inBq) {
        out.push('<blockquote class="highlight-box">');
        inBq = true;
      }
      const content = line.replace(/^>\s?/, '');
      if (content.trim()) out.push('<p>' + inlineFormat(content) + '</p>');
      i++;
      continue;
    }
    closeBq();

    if (/^[-*]\s+/.test(line)) {
      if (inOl) { out.push('</ol>'); inOl = false; }
      if (!inUl) { out.push('<ul>'); inUl = true; }
      out.push('<li>' + inlineFormat(line.replace(/^[-*]\s+/, '')) + '</li>');
      i++;
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      if (inUl) { out.push('</ul>'); inUl = false; }
      if (!inOl) { out.push('<ol>'); inOl = true; }
      out.push('<li>' + inlineFormat(line.replace(/^\d+\.\s+/, '')) + '</li>');
      i++;
      continue;
    }

    closeLists();

    const paraLines = [line];
    i++;
    while (i < lines.length) {
      const n = lines[i];
      if (/^\s*$/.test(n)) break;
      if (/^#{1,6}\s/.test(n) || /^---\s*$/.test(n) || /^\|/.test(n) || /^>\s?/.test(n) || /^[-*]\s+/.test(n) || /^\d+\.\s+/.test(n)) break;
      paraLines.push(n);
      i++;
    }
    out.push('<p>' + paraLines.map(inlineFormat).join('<br />') + '</p>');
  }

  closeLists();
  closeBq();
  flushTable();
  return out.join('\n');
}

function chrome(meta, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
<script>(function(){try{if(localStorage.getItem("voxe-theme")==="light")document.documentElement.setAttribute("data-theme","light");}catch(e){}})();</script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${escapeHtml(meta.pageTitle)}</title>
  <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <link rel="stylesheet" href="../assets/css/style.css"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <link rel="icon" type="image/png" sizes="192x192" href="../assets/images/icon-192.png">
  <link rel="apple-touch-icon" sizes="192x192" href="../assets/images/icon-192.png">
  <meta name="theme-color" content="#0b0f0e">
  <style>
    .document-content { max-width: 800px; margin: 0 auto; padding: 40px 20px; }
    .document-content h1 { font-size: 2.5rem; margin-bottom: 0.75rem; color: var(--text-primary); }
    .document-content h2 { font-size: 1.6rem; margin: 2.5rem 0 1rem; color: var(--text-primary); font-family: var(--sans); font-weight: 700; border-bottom: 1px solid rgba(120,252,214,0.18); padding-bottom: 0.5rem; }
    .document-content h3 { font-size: 1.2rem; margin: 1.5rem 0 0.75rem; color: var(--accent-color); font-family: var(--sans); font-weight: 700; }
    .document-content h4 { font-size: 1.05rem; margin: 1.25rem 0 0.5rem; color: var(--text-primary); font-family: var(--sans); font-weight: 700; }
    .document-content p { margin-bottom: 1.1rem; line-height: 1.8; }
    .document-content ul, .document-content ol { margin: 1rem 0 1.5rem; padding-left: 2rem; }
    .document-content li { margin-bottom: 0.5rem; line-height: 1.65; }
    .document-content hr { border: none; border-top: 1px solid var(--border-color); margin: 2rem 0; }
    .document-content blockquote.highlight-box,
    .document-content .highlight-box { background: rgba(120,252,214,0.04); border-left: 3px solid var(--accent-color); padding: 1.25rem 1.5rem; margin: 1.5rem 0; border-radius: 0 10px 10px 0; }
    .document-content blockquote p { margin-bottom: 0.5rem; }
    .document-content blockquote p:last-child { margin-bottom: 0; }
    .back-link { display: inline-flex; align-items: center; gap: 0.5rem; color: var(--accent-color); text-decoration: none; margin-bottom: 2rem; font-family: var(--mono); font-size: 0.8rem; letter-spacing: 1px; }
    .back-link:hover { opacity: 0.8; }
    .doc-eyebrow { display: block; margin-bottom: 0.5rem; }
    .doc-meta { color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 0.5rem; line-height: 1.6; }
    .doc-meta strong { color: var(--text-primary); }
    .gpp-doc-nav { display: flex; flex-wrap: wrap; gap: 0.75rem 1.25rem; margin: 2rem 0; padding: 1.25rem 1.5rem; background: linear-gradient(145deg, rgba(var(--card-rgb-1),0.9), rgba(var(--card-rgb-2),0.95)); border: 1px solid var(--border-color); border-radius: 10px; font-size: 0.92rem; }
    .gpp-doc-nav a { color: var(--accent-color); text-decoration: none; }
    .gpp-doc-nav a:hover { text-decoration: underline; }
    table.gpp-table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; font-size: 0.9rem; }
    table.gpp-table th, table.gpp-table td { padding: 0.85rem 1rem; border: 1px solid var(--border-color); text-align: left; }
    table.gpp-table th { background: rgba(120,252,214,0.06); color: var(--brand-bright); font-family: var(--mono); font-size: 0.72rem; letter-spacing: 1px; text-transform: uppercase; font-weight: 500; }
    table.gpp-table td { background: rgba(var(--card-rgb-2),0.4); color: var(--white-dim); }
  </style>
</head>
<body>
  <header>
    <nav class="container">
      <a href="../index.html" class="logo">
        <img src="../assets/images/icon-192.png" alt="Voxe Logo">
        <span>VOXE</span>
      </a>
      <button type="button" class="theme-toggle" id="themeToggle" aria-label="Switch to light theme" title="Switch to light theme"><i class="fas fa-sun"></i></button>
    </nav>
  </header>

  <main>
    <div class="document-content">
      <a href="../growth-partners.html" class="back-link">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M10 4L6 8L10 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Back to Growth Partner Program
      </a>

      <span class="eyebrow doc-eyebrow">${escapeHtml(meta.eyebrow)}</span>
      <h1>${escapeHtml(meta.title)}</h1>
${meta.metaHtml}
      <nav class="gpp-doc-nav" aria-label="Growth Partner documents">
        <a href="growth-partner-framework.html">Framework &amp; Terms</a>
        <a href="growth-partner-definitions.html">Definitions &amp; Attribution</a>
        <a href="growth-partner-milestone-schedule.html">Milestone &amp; Equity Schedule</a>
        <a href="growth-partner-faq.html">FAQ</a>
        <a href="../growth-partners.html">Program Overview</a>
      </nav>

${bodyHtml}

      <nav class="gpp-doc-nav" aria-label="Growth Partner documents">
        <a href="growth-partner-framework.html">Framework &amp; Terms</a>
        <a href="growth-partner-definitions.html">Definitions &amp; Attribution</a>
        <a href="growth-partner-milestone-schedule.html">Milestone &amp; Equity Schedule</a>
        <a href="growth-partner-faq.html">FAQ</a>
        <a href="../growth-partners.html">Program Overview</a>
      </nav>
    </div>
  </main>

  <footer>
    <div class="container">
      <div class="footer-content">
        <div class="footer-logo">
          <img src="../assets/images/icon-192.png" alt="Voxe Logo">
          <span>VOXE</span>
        </div>
        <div class="footer-links">
          <a href="https://voxedesk.com" target="_blank" class="social-link"><i class="fas fa-globe"></i></a>
          <a href="mailto:support@voxedesk.com" class="social-link"><i class="fas fa-envelope"></i></a>
        </div>
      </div>
      <div class="footer-bottom">
        <p>&copy; 2026 Voxe by MCP4. All rights reserved.</p>
      </div>
    </div>
  </footer>

  <script src="../assets/js/theme.js"></script>
</body>
</html>
`;
}

const docs = [
  {
    md: 'content/growth-partners/01-program-framework.md',
    out: 'docs/growth-partner-framework.html',
    title: 'Growth Partner Program Framework & Terms',
    eyebrow: 'Growth Partner Program',
    pageTitle: 'Growth Partner Program Framework & Terms — Voxe'
  },
  {
    md: 'content/growth-partners/02-definitions-attribution-rules.md',
    out: 'docs/growth-partner-definitions.html',
    title: 'Definitions & Attribution Rules',
    eyebrow: 'Growth Partner Program',
    pageTitle: 'Definitions & Attribution Rules — Voxe'
  },
  {
    md: 'content/growth-partners/03-milestone-equity-schedule.md',
    out: 'docs/growth-partner-milestone-schedule.html',
    title: 'Milestone & Equity Schedule',
    eyebrow: 'Growth Partner Program',
    pageTitle: 'Milestone & Equity Schedule — Voxe'
  },
  {
    md: 'content/growth-partners/04-growth-partner-faq.md',
    out: 'docs/growth-partner-faq.html',
    title: 'Growth Partner FAQ',
    eyebrow: 'Growth Partner Program',
    pageTitle: 'Growth Partner FAQ — Voxe'
  }
];

for (const doc of docs) {
  const md = fs.readFileSync(doc.md, 'utf8');
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  let idx = 0;
  if (/^#\s/.test(lines[idx])) idx++;
  if (/^##\s/.test(lines[idx])) idx++;
  while (idx < lines.length && /^\s*$/.test(lines[idx])) idx++;
  const metaLines = [];
  while (idx < lines.length && !/^---\s*$/.test(lines[idx]) && !/^#{1,6}\s/.test(lines[idx])) {
    if (!/^\s*$/.test(lines[idx])) metaLines.push(lines[idx].replace(/\s+$/, ''));
    idx++;
  }
  if (/^---\s*$/.test(lines[idx])) idx++;
  while (idx < lines.length && /^\s*$/.test(lines[idx])) idx++;
  const bodyMd = lines.slice(idx).join('\n');
  const bodyHtml = convertMarkdown(bodyMd);
  const metaHtml = metaLines.map(l => '      <p class="doc-meta">' + inlineFormat(l) + '</p>').join('\n');
  fs.writeFileSync(doc.out, chrome({ ...doc, metaHtml }, bodyHtml), 'utf8');
  console.log('Wrote', doc.out);
}
