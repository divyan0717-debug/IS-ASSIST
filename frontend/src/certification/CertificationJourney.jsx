import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  ExternalLink,
  Factory,
  FileCheck2,
  FileText,
  FlaskConical,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";
import "./CertificationJourney.css";

const BIS_LINKS = {
  certification:
    "https://www.bis.gov.in/product-certification/product-certification-process/?lang=en",
  compulsory:
    "https://www.bis.gov.in/product-certification/products-under-compulsory-certification/?lang=en",
  apply: "https://www.bis.gov.in/apply-for-a-license/?lang=en",
  portal: "https://www.manakonline.in/",
};

const STORAGE_KEY = "is-assist-certification-journey-v2";

const STEP_DEFINITIONS = [
  {
    id: "scope",
    title: "Confirm applicable Indian Standard",
    shortTitle: "Confirm Standard",
    icon: ShieldCheck,
    description:
      "Confirm that the selected Indian Standard matches the product scope and the edition/status you intend to use.",
    action: "Confirm the recommended standard and current edition/status.",
    link: BIS_LINKS.certification,
    type: "scope",
  },
  {
    id: "route",
    title: "Verify certification / conformity route",
    shortTitle: "Certification Route",
    icon: ClipboardCheck,
    description:
      "The workflow keeps the route separate from the task status. The route should be verified against current official BIS information and any applicable compulsory-certification order.",
    action:
      "Verify whether certification is mandatory, voluntary, or needs official confirmation.",
    link: BIS_LINKS.compulsory,
    type: "route",
  },
  {
    id: "infrastructure",
    title: "Prepare manufacturing, QC and testing capability",
    shortTitle: "Manufacturing & QC",
    icon: Factory,
    description:
      "Track the internal capability evidence needed for the chosen product and conformity route.",
    action: "Complete the capability checklist.",
    link: BIS_LINKS.apply,
    type: "infrastructure",
  },
  {
    id: "documents",
    title: "Prepare documents and product evidence",
    shortTitle: "Documents",
    icon: FileText,
    description:
      "Collect and upload the documents you are actually using for the certification journey.",
    action: "Upload the required document evidence.",
    link: BIS_LINKS.apply,
    type: "documents",
  },
  {
    id: "testing",
    title: "Complete testing / conformity evidence",
    shortTitle: "Testing",
    icon: FlaskConical,
    description:
      "Record the testing evidence used to demonstrate conformity for the selected route.",
    action: "Enter the test report reference and laboratory details.",
    link: BIS_LINKS.certification,
    type: "testing",
  },
  {
    id: "application",
    title: "Submit the BIS application",
    shortTitle: "Application",
    icon: UploadCloud,
    description:
      "Track the actual application submission rather than asking the user to select a progress state manually.",
    action:
      "Enter the BIS application/reference number and submission date.",
    link: BIS_LINKS.portal,
    type: "application",
  },
  {
    id: "assessment",
    title: "Assessment / inspection and observations",
    shortTitle: "Assessment",
    icon: ClipboardCheck,
    description:
      "Record the assessment outcome and track any observations or corrective actions that remain open.",
    action:
      "Record the assessment outcome and resolve outstanding observations.",
    link: BIS_LINKS.certification,
    type: "assessment",
  },
  {
    id: "certified",
    title: "Licence / certificate obtained",
    shortTitle: "Licence",
    icon: Award,
    description:
      "Record an official licence or certificate only after it has actually been issued and its scope and validity have been checked.",
    action:
      "Enter the issued licence/certificate number and validity date.",
    link: BIS_LINKS.certification,
    type: "certified",
  },
  {
    id: "renewal",
    title: "Maintain compliance and track renewal / surveillance",
    shortTitle: "Renewal & Surveillance",
    icon: RefreshCw,
    description:
      "Keep post-certification information visible so renewal, surveillance and validity dates do not become hidden after certification.",
    action:
      "Record the validity and next review / renewal information.",
    link: BIS_LINKS.certification,
    type: "renewal",
  },
];

const initialStepState = () =>
  STEP_DEFINITIONS.reduce((accumulator, step) => {
    accumulator[step.id] = {};
    return accumulator;
  }, {});

function deriveStatus(step, data) {
  const value = data || {};

  switch (step.type) {
    case "scope":
      return value.confirmed ? "completed" : "not-started";

    case "route":
      return value.verified ? "completed" : "not-started";

    case "infrastructure": {
      const checklist = value.checklist || {};

      const items = [
        checklist.manufacturing,
        checklist.quality,
        checklist.testing,
      ];

      const complete = items.every(Boolean);
      const started = items.some(Boolean);

      return complete
        ? "completed"
        : started
          ? "in-progress"
          : "not-started";
    }

    case "documents": {
      const uploaded = Array.isArray(value.files) ? value.files : [];

      if (uploaded.length === 0) return "not-started";
      if (uploaded.length >= 3) return "completed";

      return "in-progress";
    }

    case "testing": {
      const started = Boolean(
        value.reportRef || value.labName || value.testDate
      );

      const complete = Boolean(
        value.reportRef && value.labName && value.testDate
      );

      return complete
        ? "completed"
        : started
          ? "in-progress"
          : "not-started";
    }

    case "application": {
      const started = Boolean(
        value.applicationRef || value.submissionDate
      );

      const complete = Boolean(
        value.applicationRef && value.submissionDate
      );

      return complete
        ? "completed"
        : started
          ? "in-progress"
          : "not-started";
    }

    case "assessment": {
      const outcome = value.outcome || "";
      const hasOutcome = Boolean(outcome);
      const hasObservations = Boolean(value.observations?.trim());
      const corrected = Boolean(value.correctiveAction?.trim());

      const complete =
        outcome === "passed" ||
        (outcome === "observations-resolved" && corrected);

      if (complete) return "completed";

      if (hasOutcome || hasObservations || corrected) {
        return "in-progress";
      }

      return "not-started";
    }

    case "certified": {
      const started = Boolean(
        value.licenceNumber ||
        value.validUntil ||
        value.fileName
      );

      const complete = Boolean(
        value.licenceNumber &&
        value.validUntil &&
        value.verified
      );

      return complete
        ? "completed"
        : started
          ? "in-progress"
          : "not-started";
    }

    case "renewal": {
      const started = Boolean(
        value.validUntil || value.nextReviewDate
      );

      const complete = Boolean(
        value.validUntil && value.nextReviewDate
      );

      return complete
        ? "completed"
        : started
          ? "in-progress"
          : "not-started";
    }

    default:
      return "not-started";
  }
}

function statusLabel(status) {
  if (status === "completed") return "Completed";
  if (status === "in-progress") return "In progress";

  return "Not started";
}

function CertificationJourney({
  initialProduct = "",
  initialStandard = "",
  onBack,
}) {
  const [product, setProduct] = useState(initialProduct);
  const [standard, setStandard] = useState(initialStandard);

  const [routeDecision, setRouteDecision] = useState(
    "Needs verification"
  );

  const [routeVerified, setRouteVerified] = useState(false);
  const [started, setStarted] = useState(false);
  const [stepData, setStepData] = useState(initialStepState);
  const [selectedStepId, setSelectedStepId] = useState("scope");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "null"
      );

      if (!saved) return;

      if (saved.product) {
        setProduct(saved.product);
      }

      if (saved.standard) {
        setStandard(saved.standard);
      }

      if (saved.routeDecision) {
        setRouteDecision(saved.routeDecision);
      }

      if (saved.routeVerified) {
        setRouteVerified(true);
      }

      if (saved.started) {
        setStarted(true);
      }

      if (saved.stepData) {
        setStepData(saved.stepData);
      }

      if (saved.selectedStepId) {
        setSelectedStepId(saved.selectedStepId);
      }
    } catch {
      // Ignore malformed local storage and start cleanly.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          product,
          standard,
          routeDecision,
          routeVerified,
          started,
          stepData,
          selectedStepId,
        })
      );
    } catch {
      // Local storage is optional; the journey still works in-memory.
    }
  }, [
    product,
    standard,
    routeDecision,
    routeVerified,
    started,
    stepData,
    selectedStepId,
  ]);

  const stepStatuses = useMemo(
    () =>
      STEP_DEFINITIONS.reduce((accumulator, step) => {
        accumulator[step.id] = deriveStatus(
          step,
          stepData[step.id]
        );

        return accumulator;
      }, {}),
    [stepData]
  );

  const selectedStep =
    STEP_DEFINITIONS.find(
      (step) => step.id === selectedStepId
    ) || STEP_DEFINITIONS[0];

  const SelectedStepIcon = selectedStep.icon;

  const completedCount = Object.values(stepStatuses).filter(
    (status) => status === "completed"
  ).length;

  const progress = Math.round(
    (completedCount / STEP_DEFINITIONS.length) * 100
  );

  const updateStep = (stepId, patch) => {
    setStepData((previous) => ({
      ...previous,
      [stepId]: {
        ...(previous[stepId] || {}),
        ...patch,
      },
    }));
  };

  const startJourney = () => {
    if (!product.trim() || !standard.trim()) {
      setNotice(
        "Enter the product and applicable IS standard before starting the journey."
      );

      return;
    }

    setStarted(true);

    setNotice(
      "Journey created. Step status will update from actions and evidence, not manual status selection."
    );
  };

  const resetJourney = () => {
    setStarted(false);
    setRouteDecision("Needs verification");
    setRouteVerified(false);
    setStepData(initialStepState());
    setSelectedStepId("scope");
    setNotice("");

    localStorage.removeItem(STORAGE_KEY);
  };

  const openLink = (url) => {
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleFileUpload = (
    stepId,
    event,
    label = "document"
  ) => {
    const selectedFiles = Array.from(
      event.target.files || []
    );

    if (!selectedFiles.length) return;

    const previousFiles =
      stepData[stepId]?.files || [];

    const nextFiles = [
      ...previousFiles,

      ...selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        label,
      })),
    ];

    updateStep(stepId, {
      files: nextFiles,
    });

    setNotice(
      `${selectedFiles.length} ${label}${
        selectedFiles.length > 1 ? "s" : ""
      } added to the journey.`
    );

    event.target.value = "";
  };

  const removeFile = (stepId, index) => {
    const current =
      stepData[stepId]?.files || [];

    updateStep(stepId, {
      files: current.filter(
        (_, fileIndex) => fileIndex !== index
      ),
    });
  };

  const renderStepForm = () => {
    const data =
      stepData[selectedStep.id] || {};

    if (selectedStep.type === "scope") {
      return (
        <div className="cert-action-panel">
          <div className="cert-confirm-row">
            <div>
              <strong>
                Standard identified by IS-ASSIST
              </strong>

              <span>
                {standard || "No standard selected"}
              </span>
            </div>

            <div className="cert-readonly-chip">
              {product || "Product not specified"}
            </div>
          </div>

          <label className="cert-check-row">
            <input
              type="checkbox"
              checked={Boolean(data.confirmed)}
              onChange={(event) =>
                updateStep(selectedStep.id, {
                  confirmed:
                    event.target.checked,
                })
              }
            />

            <span>
              <strong>
                I have confirmed the product scope and the applicable standard.
              </strong>

              <small>
                Completion is based on this confirmation action.
              </small>
            </span>
          </label>
        </div>
      );
    }

    if (selectedStep.type === "route") {
      return (
        <div className="cert-action-panel">
          <div className="cert-route-decision-head">
            <span>
              Certification route decision
            </span>

            <strong>
              {routeDecision}
            </strong>
          </div>

          <div className="cert-route-choice-grid">
            {[
              "Mandatory",
              "Voluntary",
              "Needs verification",
            ].map((option) => (
              <button
                type="button"
                key={option}
                className={`cert-route-choice ${
                  routeDecision === option
                    ? "active"
                    : ""
                }`}
                onClick={() => {
                  setRouteDecision(option);
                  setRouteVerified(false);
                }}
              >
                {option}
              </button>
            ))}
          </div>

          <p className="cert-helper-text">
            This is a route decision, not a workflow status.
            Keep “Needs verification” until the current official
            BIS information has been checked.
          </p>

          <label className="cert-check-row">
            <input
              type="checkbox"
              checked={routeVerified}
              onChange={(event) => {
                setRouteVerified(
                  event.target.checked
                );

                updateStep(
                  selectedStep.id,
                  {
                    verified:
                      event.target.checked,
                  }
                );
              }}
            />

            <span>
              <strong>
                I verified the selected route against official BIS information.
              </strong>

              <small>
                Only this verification action can complete the step.
              </small>
            </span>
          </label>
        </div>
      );
    }

    if (
      selectedStep.type ===
      "infrastructure"
    ) {
      const checklist =
        data.checklist || {};

      const items = [
        [
          "manufacturing",
          "Manufacturing capability evidence prepared",
        ],
        [
          "quality",
          "Quality-control / process-control evidence prepared",
        ],
        [
          "testing",
          "Testing capability / test arrangement evidence prepared",
        ],
      ];

      return (
        <div className="cert-action-panel">
          <div className="cert-evidence-title">
            Capability evidence
          </div>

          <div className="cert-evidence-list">
            {items.map(
              ([key, label]) => (
                <label
                  className="cert-check-row"
                  key={key}
                >
                  <input
                    type="checkbox"
                    checked={Boolean(
                      checklist[key]
                    )}
                    onChange={(event) =>
                      updateStep(
                        selectedStep.id,
                        {
                          checklist: {
                            ...checklist,
                            [key]:
                              event.target
                                .checked,
                          },
                        }
                      )
                    }
                  />

                  <span>{label}</span>
                </label>
              )
            )}
          </div>
        </div>
      );
    }

    if (selectedStep.type === "documents") {
      const files = data.files || [];

      return (
        <div className="cert-action-panel">
          <div className="cert-upload-header">
            <div>
              <strong>
                Document evidence
              </strong>

              <span>
                {files.length} file
                {files.length === 1
                  ? ""
                  : "s"} added · 3 evidence items required for demo completion
              </span>
            </div>

            <label className="cert-upload-button">
              <UploadCloud size={16} />
              Add documents

              <input
                type="file"
                multiple
                onChange={(event) =>
                  handleFileUpload(
                    selectedStep.id,
                    event,
                    "document"
                  )
                }
              />
            </label>
          </div>

          {files.length ? (
            <div className="cert-file-list">
              {files.map(
                (file, index) => (
                  <div
                    className="cert-file-row"
                    key={`${file.name}-${index}`}
                  >
                    <FileText size={16} />

                    <span>
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeFile(
                          selectedStep.id,
                          index
                        )
                      }
                      aria-label={`Remove ${file.name}`}
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          ) : (
            <div className="cert-empty-evidence">
              No documents added yet.
            </div>
          )}
        </div>
      );
    }

    if (selectedStep.type === "testing") {
      return (
        <div className="cert-action-panel">
          <div className="cert-form-grid compact-grid">
            <label>
              <span>
                Test report reference
              </span>

              <input
                value={
                  data.reportRef || ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      reportRef:
                        event.target
                          .value,
                    }
                  )
                }
                placeholder="e.g. TR-2026-00123"
              />
            </label>

            <label>
              <span>
                Laboratory / test facility
              </span>

              <input
                value={
                  data.labName || ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      labName:
                        event.target
                          .value,
                    }
                  )
                }
                placeholder="Enter laboratory name"
              />
            </label>

            <label>
              <span>
                Test date
              </span>

              <input
                type="date"
                value={
                  data.testDate || ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      testDate:
                        event.target
                          .value,
                    }
                  )
                }
              />
            </label>
          </div>

          <label className="cert-upload-button wide-upload">
            <UploadCloud size={16} />
            Attach test report

            <input
              type="file"
              onChange={(event) =>
                handleFileUpload(
                  selectedStep.id,
                  event,
                  "test report"
                )
              }
            />
          </label>

          {!!data.files?.length && (
            <div className="cert-file-list">
              {data.files.map(
                (file, index) => (
                  <div
                    className="cert-file-row"
                    key={`${file.name}-${index}`}
                  >
                    <FileCheck2 size={16} />

                    <span>
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeFile(
                          selectedStep.id,
                          index
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );
    }

    if (selectedStep.type === "application") {
      return (
        <div className="cert-action-panel">
          <div className="cert-form-grid compact-grid">
            <label>
              <span>
                BIS application / reference number
              </span>

              <input
                value={
                  data.applicationRef ||
                  ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      applicationRef:
                        event.target
                          .value,
                    }
                  )
                }
                placeholder="Enter application reference"
              />
            </label>

            <label>
              <span>
                Submission date
              </span>

              <input
                type="date"
                value={
                  data.submissionDate ||
                  ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      submissionDate:
                        event.target
                          .value,
                    }
                  )
                }
              />
            </label>
          </div>

          <div className="cert-info-strip">
            <CircleAlert size={16} />

            <span>
              Application completion is based on an actual
              reference number and submission date being
              recorded.
            </span>
          </div>
        </div>
      );
    }

    if (selectedStep.type === "assessment") {
      return (
        <div className="cert-action-panel">
          <div className="cert-form-grid compact-grid">
            <label>
              <span>
                Assessment outcome
              </span>

              <select
                value={
                  data.outcome || ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      outcome:
                        event.target
                          .value,
                    }
                  )
                }
              >
                <option value="">
                  Select outcome
                </option>

                <option value="passed">
                  Passed / no open observations
                </option>

                <option value="observations-resolved">
                  Observations raised and resolved
                </option>

                <option value="observations-open">
                  Observations still open
                </option>
              </select>
            </label>
          </div>

          <label className="cert-textarea-label">
            <span>
              Observations / notes
            </span>

            <textarea
              rows="4"
              value={
                data.observations || ""
              }
              onChange={(event) =>
                updateStep(
                  selectedStep.id,
                  {
                    observations:
                      event.target.value,
                  }
                )
              }
              placeholder='Record the assessment observations or write “No open observations”.'
            />
          </label>

          <label className="cert-textarea-label">
            <span>
              Corrective action / resolution notes
            </span>

            <textarea
              rows="3"
              value={
                data.correctiveAction ||
                ""
              }
              onChange={(event) =>
                updateStep(
                  selectedStep.id,
                  {
                    correctiveAction:
                      event.target.value,
                  }
                )
              }
              placeholder="Required when observations were raised and resolved."
            />
          </label>
        </div>
      );
    }

    if (selectedStep.type === "certified") {
      return (
        <div className="cert-action-panel">
          <div className="cert-form-grid compact-grid">
            <label>
              <span>
                Licence / certificate number
              </span>

              <input
                value={
                  data.licenceNumber ||
                  ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      licenceNumber:
                        event.target
                          .value,
                    }
                  )
                }
                placeholder="Enter official number"
              />
            </label>

            <label>
              <span>
                Valid until
              </span>

              <input
                type="date"
                value={
                  data.validUntil || ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      validUntil:
                        event.target
                          .value,
                    }
                  )
                }
              />
            </label>
          </div>

          <label className="cert-check-row">
            <input
              type="checkbox"
              checked={Boolean(
                data.verified
              )}
              onChange={(event) =>
                updateStep(
                  selectedStep.id,
                  {
                    verified:
                      event.target
                        .checked,
                  }
                )
              }
            />

            <span>
              <strong>
                Official licence / certificate details checked.
              </strong>

              <small>
                Completion requires the number, validity date and
                this verification action.
              </small>
            </span>
          </label>

          <label className="cert-upload-button wide-upload">
            <UploadCloud size={16} />
            Attach licence / certificate

            <input
              type="file"
              onChange={(event) =>
                handleFileUpload(
                  selectedStep.id,
                  event,
                  "licence"
                )
              }
            />
          </label>

          {!!data.files?.length && (
            <div className="cert-file-list">
              {data.files.map(
                (file, index) => (
                  <div
                    className="cert-file-row"
                    key={`${file.name}-${index}`}
                  >
                    <Award size={16} />

                    <span>
                      {file.name}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        removeFile(
                          selectedStep.id,
                          index
                        )
                      }
                    >
                      ×
                    </button>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      );
    }

    if (selectedStep.type === "renewal") {
      return (
        <div className="cert-action-panel">
          <div className="cert-form-grid compact-grid">
            <label>
              <span>
                Certificate valid until
              </span>

              <input
                type="date"
                value={
                  data.validUntil || ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      validUntil:
                        event.target
                          .value,
                    }
                  )
                }
              />
            </label>

            <label>
              <span>
                Next review / renewal date
              </span>

              <input
                type="date"
                value={
                  data.nextReviewDate ||
                  ""
                }
                onChange={(event) =>
                  updateStep(
                    selectedStep.id,
                    {
                      nextReviewDate:
                        event.target
                          .value,
                    }
                  )
                }
              />
            </label>
          </div>

          <div className="cert-info-strip">
            <RefreshCw size={16} />

            <span>
              Reminder timing should be based on the official
              validity and renewal/surveillance information
              recorded for the certificate.
            </span>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="cert-page">
      <header className="cert-topbar">
        <button
          className="cert-back-button"
          type="button"
          onClick={onBack}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="cert-breadcrumb">
          <span>IS-ASSIST</span>
          <ArrowRight size={14} />
          <strong>
            Certification Journey
          </strong>
        </div>

        <div className="cert-official-pill">
          <ShieldCheck size={15} />
          Evidence-driven workflow
        </div>
      </header>

      <main className="cert-content">
        <section className="cert-hero">
          <div>
            <div className="cert-eyebrow">
              <Award size={15} />
              COMPLIANCE & CERTIFICATION
            </div>

            <h1>
              From applicable standard to certification
            </h1>

            <p>
              IS-ASSIST tracks workflow progress from real
              actions and evidence instead of asking the user
              to manually choose “in progress” or
              “completed”.
            </p>
          </div>

          <div className="cert-hero-icon">
            <FileCheck2 size={56} />
          </div>
        </section>

        {!started ? (
          <>
            <section className="cert-card cert-start-card">
              <div className="cert-card-heading">
                <div className="cert-heading-icon">
                  <ListChecks size={19} />
                </div>

                <div>
                  <span className="cert-label">
                    START A JOURNEY
                  </span>

                  <h2>
                    Create the certification workspace
                  </h2>

                  <p>
                    Use the product and standard already
                    identified by IS-ASSIST.
                  </p>
                </div>
              </div>

              <div className="cert-form-grid">
                <label>
                  <span>
                    Product
                  </span>

                  <input
                    value={product}
                    onChange={(event) =>
                      setProduct(
                        event.target.value
                      )
                    }
                    placeholder="e.g. LED street light"
                  />
                </label>

                <label>
                  <span>
                    Applicable IS standard
                  </span>

                  <input
                    value={standard}
                    onChange={(event) =>
                      setStandard(
                        event.target.value
                      )
                    }
                    placeholder="e.g. IS 16107 : Part 2 : Sec 2 (2017)"
                  />
                </label>
              </div>

              <div className="cert-verification-banner">
                <CircleAlert size={18} />

                <div>
                  <strong>
                    Certification applicability is a verification step.
                  </strong>

                  <p>
                    IS-ASSIST should not mark the route as
                    mandatory or voluntary without current
                    authoritative evidence.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    openLink(
                      BIS_LINKS.compulsory
                    )
                  }
                >
                  Check BIS
                  <ExternalLink size={14} />
                </button>
              </div>

              {notice && (
                <div className="cert-notice">
                  {notice}
                </div>
              )}

              <button
                className="cert-primary-button"
                type="button"
                onClick={startJourney}
              >
                Start certification journey
                <ArrowRight size={17} />
              </button>
            </section>

            <section className="cert-info-grid">
              <div className="cert-mini-card">
                <ShieldCheck size={21} />

                <strong>
                  System-derived progress
                </strong>

                <span>
                  Status changes when required evidence or
                  actions are recorded.
                </span>
              </div>

              <div className="cert-mini-card">
                <ClipboardCheck size={21} />

                <strong>
                  Evidence trail
                </strong>

                <span>
                  Documents, test references, applications
                  and certificates stay connected.
                </span>
              </div>

              <div className="cert-mini-card">
                <RefreshCw size={21} />

                <strong>
                  Post-certification tracking
                </strong>

                <span>
                  Validity and renewal information remain
                  visible after issuance.
                </span>
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="cert-summary-grid">
              <div className="cert-card cert-product-summary">
                <span className="cert-label">
                  PRODUCT
                </span>

                <h2>{product}</h2>

                <p>{standard}</p>

                <div className="cert-summary-tags">
                  <span>
                    {routeDecision}
                  </span>

                  <span>
                    {completedCount} /{" "}
                    {STEP_DEFINITIONS.length}{" "}
                    completed
                  </span>
                </div>
              </div>

              <div className="cert-card cert-progress-card">
                <div className="cert-progress-head">
                  <div>
                    <span className="cert-label">
                      JOURNEY PROGRESS
                    </span>

                    <strong>
                      {progress}%
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={resetJourney}
                  >
                    Reset
                  </button>
                </div>

                <div className="cert-progress-track">
                  <div
                    style={{
                      width: `${progress}%`,
                    }}
                  />
                </div>

                <p>
                  Progress is calculated from evidence and
                  actions. There are no manual workflow-status
                  buttons.
                </p>
              </div>
            </section>

            <section className="cert-card cert-route-card">
              <div className="cert-card-heading">
                <div className="cert-heading-icon">
                  <ShieldCheck size={19} />
                </div>

                <div>
                  <span className="cert-label">
                    CERTIFICATION ROUTE
                  </span>

                  <h2>
                    {routeDecision}
                  </h2>

                  <p>
                    Route decision and workflow status are
                    intentionally kept separate.
                  </p>
                </div>
              </div>

              <div className="cert-route-status-row">
                <span
                  className={
                    routeVerified
                      ? "route-verified"
                      : "route-unverified"
                  }
                >
                  {routeVerified ? (
                    <Check size={14} />
                  ) : (
                    <CircleAlert size={14} />
                  )}

                  {routeVerified
                    ? "Official-source check recorded"
                    : "Verification required"}
                </span>

                <button
                  type="button"
                  onClick={() =>
                    setSelectedStepId(
                      "route"
                    )
                  }
                >
                  Open route step
                  <ArrowRight size={15} />
                </button>
              </div>
            </section>

            <section className="cert-workspace">
              <div className="cert-card cert-steps-card">
                <div className="cert-card-heading compact">
                  <div className="cert-heading-icon">
                    <ListChecks size={19} />
                  </div>

                  <div>
                    <span className="cert-label">
                      YOUR ROADMAP
                    </span>

                    <h2>
                      Certification journey
                    </h2>
                  </div>
                </div>

                <div className="cert-step-list">
                  {STEP_DEFINITIONS.map(
                    (step, index) => {
                      const StepIcon =
                        step.icon;

                      const status =
                        stepStatuses[
                          step.id
                        ];

                      const active =
                        selectedStepId ===
                        step.id;

                      return (
                        <button
                          type="button"
                          key={step.id}
                          className={`cert-step-row ${
                            active
                              ? "active"
                              : ""
                          }`}
                          onClick={() =>
                            setSelectedStepId(
                              step.id
                            )
                          }
                        >
                          <div
                            className={`cert-step-index ${status}`}
                          >
                            {status ===
                            "completed" ? (
                              <CheckCircle2
                                size={17}
                              />
                            ) : (
                              index + 1
                            )}
                          </div>

                          <div className="cert-step-icon">
                            <StepIcon size={17} />
                          </div>

                          <div className="cert-step-copy">
                            <strong>
                              {
                                step.shortTitle
                              }
                            </strong>

                            <span>
                              {statusLabel(
                                status
                              )}
                            </span>
                          </div>

                          <ArrowRight size={16} />
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              <div className="cert-card cert-detail-card">
                <div className="cert-detail-top">
                  <div className="cert-detail-icon">
                    <SelectedStepIcon
                      size={23}
                    />
                  </div>

                  <div>
                    <span className="cert-label">
                      STEP{" "}
                      {STEP_DEFINITIONS.findIndex(
                        (step) =>
                          step.id ===
                          selectedStep.id
                      ) + 1}
                    </span>

                    <h2>
                      {selectedStep.title}
                    </h2>
                  </div>
                </div>

                <div className="cert-current-status">
                  <span>
                    Current system status
                  </span>

                  <strong
                    className={`cert-status-badge ${stepStatuses[selectedStep.id]}`}
                  >
                    {stepStatuses[
                      selectedStep.id
                    ] === "completed" && (
                      <CheckCircle2
                        size={14}
                      />
                    )}

                    {statusLabel(
                      stepStatuses[
                        selectedStep.id
                      ]
                    )}
                  </strong>
                </div>

                <p className="cert-detail-description">
                  {selectedStep.description}
                </p>

                <div className="cert-next-action">
                  <span>
                    System-tracked action
                  </span>

                  <strong>
                    {selectedStep.action}
                  </strong>
                </div>

                {renderStepForm()}

                <div className="cert-detail-actions">
                  <button
                    type="button"
                    onClick={() =>
                      openLink(
                        selectedStep.link
                      )
                    }
                  >
                    Open official BIS guidance
                    <ExternalLink size={15} />
                  </button>

                  <span className="cert-no-manual-status">
                    <CheckCircle2 size={14} />
                    Status calculated automatically
                  </span>
                </div>

                {notice && (
                  <div className="cert-notice">
                    {notice}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}

export default CertificationJourney;