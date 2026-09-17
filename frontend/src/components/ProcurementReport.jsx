import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  ShieldCheck,
  Link2,
  Download,
  Sparkles,
} from "lucide-react";
import "./ProcurementReport.css";

function ProcurementReport({
  requirement = "Supply and installation of LED luminaires for road and street lighting across municipal ward corridors, including photometric compliance and 5-year performance warranty.",
  onBack,
  refNumber = "MC/2026/00147",
  generatedOn = "29 Aug 2026",
  primaryStandard = {
    code: "IS XXXXX:2024",
    title: "LED luminaires for road and street lighting",
    match: 95,
    tags: ["Product Standard", "Current"],
  },
  relatedStandards = [
    { code: "IS YYYYY:2023", type: "Safety", match: 89 },
    { code: "IS ZZZZZ:2022", type: "Testing", match: 84 },
    { code: "IS AAAAA:2023", type: "Installation", match: 81 },
  ],
}) {
  return (
    <div className="report-page">
      {/* Letterhead */}
      <div className="report-header">
        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={15} />
          Back to recommendations
        </button>

        <div className="report-title">
          <div className="report-crest">
            <FileText size={20} />
          </div>
          <div className="report-title-text">
            <span className="eyebrow">IS-ASSIST &middot; AI standards engine</span>
            <h1>Standards recommendation report</h1>
          </div>
        </div>

        <button className="download-button">
          <Download size={15} />
          Download report
        </button>
      </div>

      <div className="report-meta-rule" />

      <div className="report-meta-row">
        <span className="report-meta-item">
          Ref. <strong>{refNumber}</strong>
        </span>
        <span className="report-meta-dot">&middot;</span>
        <span className="report-meta-item">Generated {generatedOn}</span>
        <span className="report-status-chip">Draft for review</span>
      </div>

      {/* Requirement */}
      <section className="report-clause">
        <span className="clause-label">Clause I &mdash; Procurement requirement</span>
        <blockquote className="report-requirement">{requirement}</blockquote>
      </section>

      {/* Primary Standard */}
      <section className="report-clause">
        <span className="clause-label">Clause II &mdash; Primary standard</span>

        <div className="standard-card standard-card--primary">
          <div className="seal" aria-hidden="true">
            <div className="seal-ring">
              <span className="seal-eyebrow">Verified</span>
              <span className="seal-number">{primaryStandard.match}%</span>
              <span className="seal-eyebrow">Match</span>
            </div>
          </div>

          <div className="standard-code">{primaryStandard.code}</div>
          <h2 className="standard-title">{primaryStandard.title}</h2>

          <div className="standard-tags">
            {primaryStandard.tags.map((tag) => (
              <span
                key={tag}
                className={tag === "Current" ? "tag tag--current" : "tag"}
              >
                {tag === "Current" ? "\u25CF Current" : tag}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Related Standards */}
      <section className="report-clause">
        <div className="clause-heading-row">
          <span className="clause-label">
            Clause III &mdash; Allied and normative standards
          </span>
          <Link2 size={16} className="clause-heading-icon" />
        </div>

        <div className="ledger">
          <div className="ledger-row ledger-row--header">
            <span>No.</span>
            <span>Standard</span>
            <span>Type</span>
            <span>Relevance</span>
          </div>

          {relatedStandards.map((std, i) => (
            <div className="ledger-row" key={std.code}>
              <span className="ledger-index">{String(i + 1).padStart(2, "0")}</span>
              <span className="ledger-code">{std.code}</span>
              <span className="ledger-type">{std.type}</span>
              <span className="ledger-relevance">
                <span className="relevance-bar">
                  <span
                    className="relevance-fill"
                    style={{ width: `${std.match}%` }}
                  />
                </span>
                <span className="relevance-value">{std.match}%</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Compliance */}
      <section className="report-clause">
        <div className="clause-heading-row">
          <span className="clause-label">Clause IV &mdash; Certification requirements</span>
          <ShieldCheck size={16} className="clause-heading-icon" />
        </div>

        <div className="compliance-banner">
          <CheckCircle2 size={18} />
          <div className="compliance-text">
            <strong>BIS product certification</strong>
            <p>Applicable to this procurement item</p>
          </div>
          <span className="compliance-badge">Required</span>
        </div>
      </section>

      {/* AI Recommendation Note */}
      <section className="report-clause">
        <span className="clause-label">Clause V &mdash; Recommendation summary</span>
        <div className="ai-note">
          <p className="ai-note-text">
            Based on semantic analysis of the procurement requirement, the
            primary standard and related standards listed above are
            recommended for consideration while preparing the technical
            specification.
          </p>
          <p className="ai-note-caveat">
            <Sparkles size={13} />
            AI-generated &mdash; verify against the latest BIS notification
            before finalising the tender.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="report-footer">
        <div className="report-footer-status">
          <CheckCircle2 size={16} />
          <span>Report ready for procurement review</span>
        </div>
        <div className="report-footer-meta">
          <span>{refNumber}</span>
          <span className="report-footer-wordmark">IS-ASSIST</span>
        </div>
      </div>
    </div>
  );
}

export default ProcurementReport;