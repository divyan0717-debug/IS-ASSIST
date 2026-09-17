import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Link2,
  CalendarDays,
  ClipboardCheck,
} from "lucide-react";

function StandardDetails({ onBack }) {
  return (
    <div className="standard-details">

      {/* Header */}

      <div className="details-header">

        <button className="back-button" onClick={onBack}>
          <ArrowLeft size={16} />
          Back to Recommendations
        </button>

        <div className="details-title">

          <div className="standard-icon large">
            IS
          </div>

          <div>

            <div className="details-title-row">

              <h1>IS XXXXX:2024</h1>

              <span className="current-badge">
                ● CURRENT
              </span>

            </div>

            <p>
              LED luminaires for road and street lighting
            </p>

          </div>

        </div>

      </div>


      {/* Overview */}

      <section className="details-card">

        <div className="details-card-title">

          <FileText size={19} />

          <div>
            <span className="section-label">
              STANDARD INFORMATION
            </span>

            <h2>Overview</h2>
          </div>

        </div>

        <p className="overview-text">
          This standard specifies requirements for LED luminaires
          intended for road and street lighting applications. It
          covers performance, safety, construction and testing
          requirements for applicable lighting equipment.
        </p>

      </section>


      {/* Information Grid */}

      <section className="details-info-grid">

        <div className="info-box">

          <CalendarDays size={18} />

          <span>Publication Year</span>

          <strong>2024</strong>

        </div>

        <div className="info-box">

          <ClipboardCheck size={18} />

          <span>Standard Type</span>

          <strong>Product Standard</strong>

        </div>

        <div className="info-box">

          <CheckCircle2 size={18} />

          <span>Status</span>

          <strong className="current-text">
            Current
          </strong>

        </div>

        <div className="info-box">

          <FileText size={18} />

          <span>Amendments</span>

          <strong>2 Amendments</strong>

        </div>

      </section>


      {/* Scope */}

      <section className="details-card">

        <div className="details-card-title">

          <div>

            <span className="section-label">
              SCOPE
            </span>

            <h2>Applicable Scope</h2>

          </div>

        </div>

        <div className="scope-list">

          <div>
            <CheckCircle2 size={17} />
            LED luminaires used for road lighting
          </div>

          <div>
            <CheckCircle2 size={17} />
            Outdoor municipal and highway applications
          </div>

          <div>
            <CheckCircle2 size={17} />
            Performance and safety requirements
          </div>

          <div>
            <CheckCircle2 size={17} />
            Testing and verification requirements
          </div>

        </div>

      </section>


      {/* Amendments */}

      <section className="details-card">

        <div className="details-card-title">

          <div>

            <span className="section-label">
              VERSION HISTORY
            </span>

            <h2>Amendments</h2>

          </div>

        </div>

        <div className="amendment-list">

          <div className="amendment">

            <div className="amendment-number">
              A2
            </div>

            <div>

              <strong>
                Amendment 2
              </strong>

              <p>
                Latest amendment incorporated into the current edition.
              </p>

            </div>

            <span>
              2024
            </span>

          </div>


          <div className="amendment">

            <div className="amendment-number">
              A1
            </div>

            <div>

              <strong>
                Amendment 1
              </strong>

              <p>
                Earlier technical requirements update.
              </p>

            </div>

            <span>
              2023
            </span>

          </div>

        </div>

      </section>


      {/* Related Standards */}

      <section className="details-card">

        <div className="details-card-title">

          <Link2 size={19} />

          <div>

            <span className="section-label">
              STANDARD RELATIONSHIPS
            </span>

            <h2>Related Standards</h2>

          </div>

        </div>


        <div className="details-related-grid">

          <div className="details-related">

            <span>SAFETY</span>

            <strong>
              IS YYYYY:2023
            </strong>

            <p>
              Safety requirements
            </p>

          </div>

          <div className="details-related">

            <span>TESTING</span>

            <strong>
              IS ZZZZZ:2022
            </strong>

            <p>
              Applicable test methods
            </p>

          </div>

          <div className="details-related">

            <span>INSTALLATION</span>

            <strong>
              IS AAAAA:2023
            </strong>

            <p>
              Installation requirements
            </p>

          </div>

        </div>

      </section>


      {/* Certification */}

      <section className="details-card">

        <div className="details-card-title">

          <ShieldCheck size={19} />

          <div>

            <span className="section-label">
              COMPLIANCE
            </span>

            <h2>Certification Requirement</h2>

          </div>

        </div>


        <div className="certification-detail">

          <div className="certification-icon">

            <ShieldCheck size={24} />

          </div>

          <div>

            <strong>
              BIS Product Certification
            </strong>

            <p>
              Certification requirement identified for this
              standard. Verify the current applicable regulatory
              status before procurement.
            </p>

          </div>

          <span className="applicable">
            ✓ Applicable
          </span>

        </div>

      </section>


      {/* Bottom Action */}

      <div className="details-footer">

        <div>

          <strong>
            Standard verified for prototype
          </strong>

          <p>
            Current edition and related information shown above.
          </p>

        </div>

        <button className="analyze-button">
          <FileText size={17} />
          Add to Procurement Report
        </button>

      </div>

    </div>
  );
}

export default StandardDetails;