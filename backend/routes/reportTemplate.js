function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderTags(primary) {
  const tags = [];
  tags.push(`<span class="tag">Product Standard</span>`);
  if (primary) {
    tags.push(`<span class="tag tag--current">&#9679; Current</span>`);
  }
  return tags.join("\n");
}

function renderRelatedRows(related) {
  if (!related || related.length === 0) {
    return `<div class="ledger-empty">No related standards available.</div>`;
  }

  return related
    .map((std, i) => {
      const pct = Math.max(0, Math.min(100, Number(std.match) || 0));
      return `
        <div class="ledger-row">
          <span class="ledger-index">${String(i + 1).padStart(2, "0")}</span>
          <span class="ledger-code">${escapeHtml(std.number || "Unknown")}</span>
          <span class="ledger-type">${escapeHtml(std.title || "\u2014")}</span>
          <span class="ledger-relevance">
            <span class="relevance-bar"><span class="relevance-fill" style="width:${pct}%"></span></span>
            <span class="relevance-value">${std.match ? `${std.match}%` : "\u2014"}</span>
          </span>
        </div>`;
    })
    .join("\n");
}

function renderPrimaryStandard(primary) {
  const code = primary?.number || "Standard not available";
  const title = primary?.title || "No title available";
  const seal = primary?.match
    ? `<div class="seal">
         <div class="seal-ring">
           <span class="seal-eyebrow">Verified</span>
           <span class="seal-number">${primary.match}%</span>
           <span class="seal-eyebrow">Match</span>
         </div>
       </div>`
    : "";

  return `
    <div class="standard-card">
      ${seal}
      <div class="standard-code">${escapeHtml(code)}</div>
      <h2 class="standard-title">${escapeHtml(title)}</h2>
      <div class="standard-tags">${renderTags(primary)}</div>
    </div>`;
}

function renderCompliance(certification) {
  if (!certification) {
    return `
      <div class="compliance-banner compliance-banner--muted">
        <span class="compliance-icon">&#9675;</span>
        <div class="compliance-text">
          <strong>Certification requirements</strong>
          <p>Certification information not available.</p>
        </div>
      </div>`;
  }

  return `
    <div class="compliance-banner">
      <span class="compliance-icon">&#10003;</span>
      <div class="compliance-text">
        <strong>${escapeHtml(certification.name || "BIS Product Certification")}</strong>
        <p>${escapeHtml(certification.status || "Applicable to this procurement item")}</p>
      </div>
      <span class="compliance-badge">Required</span>
    </div>`;
}

function renderAiNote(hasData) {
  const summary = hasData
    ? "Based on semantic analysis of the procurement requirement, the primary standard and related standards listed above are recommended for consideration while preparing the technical specification."
    : "Insufficient data was available to generate standard-specific recommendations for this requirement.";

  return `
    <div class="ai-note">
      <p class="ai-note-text">${summary}</p>
      <p class="ai-note-caveat">&#10022; AI-generated &mdash; verify against the latest BIS notification before finalising the tender.</p>
    </div>`;
}

function buildReportHtml({ requirement, analysis, refNumber, generatedOn }) {
  const hasPrimary = !!analysis?.primaryStandard;

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>
${REPORT_CSS}
</style>
</head>
<body>
  <div class="report-page">
    <div class="report-header">
      <div class="report-title">
        <div class="report-crest">IS</div>
        <div class="report-title-text">
          <span class="eyebrow">IS-ASSIST &middot; AI standards engine</span>
          <h1>Standards recommendation report</h1>
        </div>
      </div>
      <span class="report-status-chip">Draft for review</span>
    </div>

    <div class="report-meta-rule"></div>

    <div class="report-meta-row">
      <span class="report-meta-item">Ref. <strong>${escapeHtml(refNumber)}</strong></span>
      <span class="report-meta-dot">&middot;</span>
      <span class="report-meta-item">Generated ${escapeHtml(generatedOn)}</span>
    </div>

    <section class="report-clause">
      <span class="clause-label">Clause I &mdash; Procurement requirement</span>
      <blockquote class="report-requirement">${escapeHtml(requirement)}</blockquote>
    </section>

    <section class="report-clause">
      <span class="clause-label">Clause II &mdash; Primary standard</span>
      ${renderPrimaryStandard(analysis?.primaryStandard)}
    </section>

    <section class="report-clause">
      <span class="clause-label">Clause III &mdash; Allied and normative standards</span>
      <div class="ledger">
        <div class="ledger-row ledger-row--header">
          <span>No.</span><span>Standard</span><span>Type</span><span>Relevance</span>
        </div>
        ${renderRelatedRows(analysis?.relatedStandards)}
      </div>
    </section>

    <section class="report-clause">
      <span class="clause-label">Clause IV &mdash; Certification requirements</span>
      ${renderCompliance(analysis?.certification)}
    </section>

    <section class="report-clause">
      <span class="clause-label">Clause V &mdash; Recommendation summary</span>
      ${renderAiNote(hasPrimary)}
    </section>

    <div class="report-footer">
      <div class="report-footer-status"><span>&#10003;</span><span>Report ready for procurement review</span></div>
      <div class="report-footer-meta"><span>${escapeHtml(refNumber)}</span><span class="report-footer-wordmark">IS-ASSIST</span></div>
    </div>
  </div>
</body>
</html>`;
}

const REPORT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; font-family: "IBM Plex Sans", Arial, sans-serif; }

  .report-page {
    --paper: #f3f0e6;
    --card: #fffdf8;
    --ink: #1c2a3f;
    --ink-soft: #5f6b7a;
    --seal: #b8862f;
    --seal-deep: #7a5a22;
    --verified: #2e6b4e;
    --verified-bg: #e9f2ec;
    --rule: #ddd6c4;
    padding: 36px 42px 44px;
    background: var(--paper);
    color: var(--ink);
  }

  .report-page h1, .report-page h2 {
    font-family: Georgia, "Times New Roman", serif;
    font-weight: 700;
    color: var(--ink);
    margin: 0;
  }

  .report-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .report-title { display: flex; align-items: center; gap: 12px; }
  .report-crest {
    width: 42px; height: 42px; flex-shrink: 0;
    border: 1.5px solid var(--ink); border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-family: Georgia, serif; font-weight: 700; font-size: 13px; color: var(--ink);
  }
  .eyebrow {
    display: block; font-size: 10.5px; letter-spacing: 0.09em; text-transform: uppercase;
    color: var(--seal-deep); font-weight: 600; margin-bottom: 3px;
  }
  .report-title-text h1 { font-size: 21px; line-height: 1.2; }

  .report-status-chip {
    font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase;
    color: var(--seal-deep); background: #f6ecd8; border: 1px solid #e6d3a8;
    border-radius: 3px; padding: 5px 10px; align-self: flex-start;
  }

  .report-meta-rule {
    height: 3px; margin: 18px 0 14px;
    background: linear-gradient(to right, var(--ink) 0%, var(--ink) 70%, var(--seal) 70%, var(--seal) 100%);
  }

  .report-meta-row {
    display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--ink-soft);
    font-family: "Courier New", monospace; margin-bottom: 28px;
  }
  .report-meta-item strong { color: var(--ink); }
  .report-meta-dot { opacity: 0.5; }

  .report-clause { margin-bottom: 24px; page-break-inside: avoid; }
  .clause-label {
    display: block; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase;
    color: var(--ink-soft); font-weight: 600; margin-bottom: 9px;
  }

  .report-requirement {
    margin: 0; padding: 14px 17px; background: var(--card);
    border-left: 3px solid var(--seal);
    font-family: Georgia, serif; font-style: italic; font-size: 15px; line-height: 1.55;
    color: #2b3548;
  }

  .standard-card {
    position: relative; background: var(--card); border: 1px solid var(--rule);
    border-radius: 6px; padding: 22px 24px;
  }
  .seal { position: absolute; top: -12px; right: 22px; }
  .seal-ring {
    width: 88px; height: 88px; border-radius: 50%;
    border: 2px dashed var(--seal); outline: 1px solid var(--seal); outline-offset: 4px;
    background: #fdf8ec; display: flex; flex-direction: column; align-items: center; justify-content: center;
    transform: rotate(-7deg); color: var(--seal-deep);
  }
  .seal-eyebrow { font-size: 8px; letter-spacing: 0.1em; text-transform: uppercase; font-weight: 600; }
  .seal-number { font-family: "Courier New", monospace; font-size: 18px; font-weight: 700; line-height: 1.1; }

  .standard-code { font-family: "Courier New", monospace; font-size: 13px; font-weight: 700; color: var(--seal-deep); margin-bottom: 6px; padding-right: 90px; }
  .standard-title { font-size: 18px; padding-right: 90px; margin-bottom: 14px; }

  .standard-tags { display: flex; gap: 8px; flex-wrap: wrap; }
  .tag { font-size: 11px; font-weight: 500; color: var(--ink-soft); border: 1px solid var(--rule); border-radius: 3px; padding: 4px 10px; }
  .tag--current { color: var(--verified); border-color: #bcdccb; background: var(--verified-bg); }

  .ledger { background: var(--card); border: 1px solid var(--rule); border-radius: 6px; overflow: hidden; }
  .ledger-row { display: flex; align-items: center; gap: 14px; padding: 12px 16px; border-bottom: 1px solid var(--rule); }
  .ledger-row > span:nth-child(1) { width: 26px; flex-shrink: 0; }
  .ledger-row > span:nth-child(2) { width: 130px; flex-shrink: 0; }
  .ledger-row > span:nth-child(3) { width: 110px; flex-shrink: 0; }
  .ledger-row > span:nth-child(4) { flex: 1; }
  .ledger-row:last-child { border-bottom: none; }
  .ledger-row--header {
    font-size: 10.5px; letter-spacing: 0.07em; text-transform: uppercase;
    color: var(--ink-soft); font-weight: 600; background: #ede8d9;
  }
  .ledger-index { font-family: "Courier New", monospace; color: var(--ink-soft); font-size: 12px; }
  .ledger-code { font-family: "Courier New", monospace; font-size: 13px; font-weight: 700; color: var(--ink); }
  .ledger-type { font-size: 12.5px; color: var(--ink-soft); }
  .ledger-relevance { display: flex; align-items: center; gap: 8px; }
  .relevance-bar { flex: 1; height: 4px; background: var(--rule); border-radius: 2px; overflow: hidden; }
  .relevance-fill { display: block; height: 100%; background: var(--seal); }
  .relevance-value { font-family: "Courier New", monospace; font-size: 12px; font-weight: 700; color: var(--ink); min-width: 32px; text-align: right; }
  .ledger-empty { padding: 14px 16px; font-size: 12.5px; color: var(--ink-soft); }

  .compliance-banner {
    display: flex; align-items: center; gap: 12px; background: var(--verified-bg);
    border: 1px solid #bcdccb; border-radius: 6px; padding: 14px 18px; color: var(--verified);
  }
  .compliance-banner--muted { background: var(--card); border-color: var(--rule); color: var(--ink-soft); }
  .compliance-icon { font-size: 16px; }
  .compliance-text { flex: 1; }
  .compliance-text strong { display: block; color: #1e4331; font-size: 14px; margin-bottom: 2px; }
  .compliance-banner--muted .compliance-text strong { color: var(--ink); }
  .compliance-text p { margin: 0; font-size: 12.5px; color: #3d6b53; }
  .compliance-banner--muted .compliance-text p { color: var(--ink-soft); }
  .compliance-badge {
    font-size: 11px; font-weight: 600; letter-spacing: 0.03em; text-transform: uppercase;
    background: var(--verified); color: #fff; border-radius: 3px; padding: 5px 11px;
  }

  .ai-note { background: var(--card); border: 1px solid var(--rule); border-radius: 6px; padding: 16px 19px; }
  .ai-note-text { margin: 0 0 10px; font-family: Georgia, serif; font-style: italic; font-size: 14px; line-height: 1.6; color: #2b3548; }
  .ai-note-caveat { display: flex; align-items: center; gap: 6px; margin: 0; font-size: 11.5px; color: var(--seal-deep); border-top: 1px dashed var(--rule); padding-top: 9px; }

  .report-footer {
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 8px; padding-top: 16px; border-top: 3px double var(--ink);
  }
  .report-footer-status { display: flex; align-items: center; gap: 7px; font-size: 12.5px; color: var(--verified); font-weight: 500; }
  .report-footer-meta { display: flex; align-items: center; gap: 10px; font-family: "Courier New", monospace; font-size: 11px; color: var(--ink-soft); }
  .report-footer-wordmark { font-family: Georgia, serif; font-weight: 700; color: var(--ink); letter-spacing: 0.02em; }
`;

module.exports = { buildReportHtml };