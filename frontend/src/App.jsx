import { useEffect, useRef, useState } from "react";

import {
  Search,
  FileText,
  LayoutDashboard,
  Settings,
  History,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Link2,
  Award,
  CalendarDays,
  Trash2,
  Mic,
  MicOff,
  Globe,
  UploadCloud,
  Bell,
  Bookmark,
  Share2,
  HelpCircle,
  Menu,
  X,
  Sparkles,
  AlertTriangle,
  Check,
  Download,
  Network,
  ClipboardCheck,
  BookOpen,
  UserCircle,
  CircleHelp,
} from "lucide-react";

import "./App.css";
import StandardDetails from "./components/StandardDetails";
import translations from "./translations";
import AIChatbot from "./components/AIChatbot";
import CertificationJourney from "./certification/CertificationJourney";

const API_BASE = "https://is-assist.onrender.com/api";

const extractPowerFromText = (text = "") => {
  const match = text.match(/\b\d+(?:\.\d+)?\s?(?:W|kW)\b/i);
  return match ? match[0].replace(/\s+/g, "") : null;
};

const cleanSourceUrl = (value) => {
  if (!value) return "";
  const text = String(value).trim();
  const markdown = text.match(/\((https?:\/\/[^)]+)\)/i);
  if (markdown) return markdown[1];
  const direct = text.match(/https?:\/\/\S+/i);
  return direct ? direct[0].replace(/[)\]]+$/, "") : text;
};

const getStatusLabel = (standard) => {
  if (!standard) return "Not available";
  if (standard.status) return standard.status;
  if (standard.statusParsed?.is_current) return "Current";
  return "Status not specified";
};

const getRecommendationIconClass = (standard, index) => {
  const type = String(
    standard?.category || standard?.documentType || ""
  ).toLowerCase();

  if (
    type.includes("certification") ||
    type.includes("manual")
  ) {
    return "orange";
  }

  if (type.includes("test")) return "blue";

  return index % 2 === 0 ? "blue" : "orange";
};

function App() {
  // =========================================================
  // CORE STATE
  // =========================================================

  const [requirement, setRequirement] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const [showResults, setShowResults] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showStandardDetails, setShowStandardDetails] =
    useState(false);
  const [showStandardsLibrary, setShowStandardsLibrary] =
    useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showCertificationJourney, setShowCertificationJourney] =
    useState(false);

  const [certificationReturnView, setCertificationReturnView] =
    useState("dashboard");

  const [certificationReturnStandard, setCertificationReturnStandard] =
    useState(null);

  const [certificationReturnLibraryStandard, setCertificationReturnLibraryStandard] =
    useState(null);

  const [standardDetailsReturnView, setStandardDetailsReturnView] =
    useState("default");

  const [analysisData, setAnalysisData] = useState(null);

  // A standard opened from the Standards Library rather than
  // from an analysis result.
  const [libraryStandard, setLibraryStandard] = useState(null);
  const [librarySearch, setLibrarySearch] = useState("");
  const [selectedAnalysisStandard, setSelectedAnalysisStandard] =
    useState(null);

  const [showAllRecommendations, setShowAllRecommendations] =
    useState(false);

  const [showAllRelationships, setShowAllRelationships] =
    useState(false);

  const [savedStandards, setSavedStandards] = useState(() => {
    try {
      const stored = window.localStorage.getItem(
        "is-assist-saved-standards"
      );

      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [actionMessage, setActionMessage] = useState("");

  // =========================================================
  // STANDARDS LIBRARY
  // =========================================================

  const [standardsLibrary, setStandardsLibrary] = useState([]);
  const [standardsLoading, setStandardsLoading] =
    useState(false);
  const [standardsError, setStandardsError] = useState("");

  const filteredStandards = standardsLibrary.filter(
    (standard) => {
      const query = librarySearch.trim().toLowerCase();

      if (!query) {
        return true;
      }

      return (
        String(standard.number || "")
          .toLowerCase()
          .includes(query) ||
        String(standard.title || "")
          .toLowerCase()
          .includes(query) ||
        String(standard.category || "")
          .toLowerCase()
          .includes(query)
      );
    }
  );

  const fetchStandardsLibrary = async () => {
    try {
      setStandardsLoading(true);
      setStandardsError("");

      const response = await fetch(
        `${API_BASE}/standards?limit=5000`
      );

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.message ||
            "Unable to load standards library."
        );
      }

      setStandardsLibrary(result.data || []);
    } catch (error) {
      console.error(
        "Standards library fetch error:",
        error
      );

      setStandardsError(
        error.message ||
          "Unable to load the standards library."
      );

      setStandardsLibrary([]);
    } finally {
      setStandardsLoading(false);
    }
  };

  useEffect(() => {
    fetchStandardsLibrary();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // =========================================================
  // SETTINGS
  // =========================================================

  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyInApp, setNotifyInApp] = useState(true);
  const [settingsSaved, setSettingsSaved] =
    useState(false);

  const handleSaveSettings = () => {
    setSettingsSaved(true);

    setTimeout(
      () => setSettingsSaved(false),
      2500
    );
  };

  // =========================================================
  // ALERTS
  // =========================================================

  const [alerts, setAlerts] = useState(() => {
    try {
      const stored = window.localStorage.getItem(
        "is-assist-alerts"
      );

      return stored
        ? JSON.parse(stored)
        : [
            {
              id: 1,
              titleKey: "alertAmendmentTitle",
              descriptionKey: "alertAmendmentDescription",
              timeKey: "alertTimeTwoDays",
              read: false,
            },
            {
              id: 2,
              titleKey: "alertIS732Title",
              descriptionKey: "alertIS732Description",
              timeKey: "alertTimeFiveDays",
              read: false,
            },
            {
              id: 3,
              titleKey: "alertRelatedTitle",
              descriptionKey: "alertRelatedDescription",
              timeKey: "alertTimeOneWeek",
              read: true,
            },
          ];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(
        "is-assist-alerts",
        JSON.stringify(alerts)
      );
    } catch {
      // Alert persistence is best-effort.
    }
  }, [alerts]);

  const unreadAlertsCount = alerts.filter(
    (a) => !a.read
  ).length;

  const markAlertRead = (id) => {
    setAlerts((prev) =>
      prev.map((a) =>
        a.id === id
          ? { ...a, read: true }
          : a
      )
    );
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) =>
      prev.map((a) => ({ ...a, read: true }))
    );
  };

  const getAlertText = (alert) => ({
    title: t(alert.titleKey || ""),
    description: t(alert.descriptionKey || ""),
    time: t(alert.timeKey || ""),
  });

  // =========================================================
  // HISTORY
  // =========================================================

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] =
    useState(false);

  // =========================================================
  // REPORT
  // =========================================================

  const [generatingReport, setGeneratingReport] =
    useState(false);

  // =========================================================
  // PDF
  // =========================================================

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [pdfAnalyzing, setPdfAnalyzing] =
    useState(false);

  const [pdfSuccess, setPdfSuccess] =
    useState(false);

  const fileInputRef = useRef(null);

  // =========================================================
  // LANGUAGE
  // =========================================================

  const [inputLanguage, setInputLanguage] =
    useState("en-IN");

  const [recommendationLanguage, setRecommendationLanguage] =
    useState("en-IN");

  const languages = [
    {
      code: "en-IN",
      name: "English",
    },
    {
      code: "hi-IN",
      name: "हिन्दी",
    },
    {
      code: "kn-IN",
      name: "ಕನ್ನಡ",
    },
    {
      code: "te-IN",
      name: "తెలుగు",
    },
    {
      code: "ta-IN",
      name: "தமிழ்",
    },
    {
      code: "ml-IN",
      name: "മലയാളം",
    },
    {
      code: "mr-IN",
      name: "मराठी",
    },
    {
      code: "bn-IN",
      name: "বাংলা",
    },
  ];

  const t = (key) =>
    translations[recommendationLanguage]?.[key] ??
    translations["en-IN"]?.[key] ??
    key;

  const tInput = (key) =>
    translations[inputLanguage]?.[key] ??
    translations["en-IN"]?.[key] ??
    key;

  // =========================================================
  // VOICE INPUT
  // =========================================================

  const [listening, setListening] =
    useState(false);

  const [speechSupported, setSpeechSupported] =
    useState(true);

  const [recognition, setRecognition] =
    useState(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const speechRecognition =
      new SpeechRecognition();

    speechRecognition.continuous = false;
    speechRecognition.interimResults = false;

    speechRecognition.onstart = () => {
      setListening(true);
    };

    speechRecognition.onresult = (event) => {
      const transcript =
        event.results[0][0].transcript;

      setRequirement((previous) => {
        if (!previous.trim()) {
          return transcript;
        }

        return `${previous} ${transcript}`;
      });
    };

    speechRecognition.onerror = (event) => {
      console.error(
        "Speech recognition error:",
        event.error
      );

      setListening(false);

      if (event.error === "not-allowed") {
        alert(t("microphoneDenied"));
      }

      if (event.error === "no-speech") {
        alert(t("noSpeech"));
      }
    };

    speechRecognition.onend = () => {
      setListening(false);
    };

    setRecognition(speechRecognition);

    return () => {
      try {
        speechRecognition.stop();
      } catch {
        // ignore
      }
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleVoiceInput = () => {
    if (!speechSupported) {
      alert(t("voiceNotSupported"));
      return;
    }

    if (!recognition) {
      return;
    }

    if (listening) {
      recognition.stop();
      return;
    }

    recognition.lang = inputLanguage;

    try {
      recognition.start();
    } catch (error) {
      console.error(
        "Could not start speech recognition:",
        error
      );
    }
  };

  // =========================================================
  // AI CLARIFICATION ENGINE
  // =========================================================

  const [
    clarificationQuestions,
    setClarificationQuestions,
  ] = useState([]);

  const [
    clarificationAnswers,
    setClarificationAnswers,
  ] = useState({});

  const [
    showClarificationPrompt,
    setShowClarificationPrompt,
  ] = useState(false);

  const CLARIFICATION_RULES = [
    {
      match:
        /\b(led|bulb|light|lamp|luminaire|street\s?light)\b/i,
      questions: [
        "What wattage or power rating do you need (e.g. 50W, 100W)?",
        "Is this for indoor or outdoor use?",
        "Any specific colour temperature required (warm white / cool white / daylight)?",
      ],
    },
    {
      match:
        /\b(cable|wire|conductor)\b/i,
      questions: [
        "What voltage rating is required (e.g. 1.1kV, 11kV)?",
        "What conductor size do you need (in sq mm)?",
        "Is it for indoor, outdoor, or underground use?",
      ],
    },
    {
      match:
        /\b(pipe|pipeline|tube)\b/i,
      questions: [
        "What diameter or size is needed?",
        "What material is required (PVC, GI, HDPE, etc.)?",
        "What pressure rating does it need to withstand?",
      ],
    },
    {
      match:
        /\b(cement|concrete)\b/i,
      questions: [
        "What grade is required (e.g. OPC 43, OPC 53, PPC)?",
        "What is it being used for (structural, plastering, flooring)?",
      ],
    },
    {
      match:
        /\b(steel|tmt|rod|bar)\b/i,
      questions: [
        "What grade or strength is required (e.g. Fe 500, Fe 550)?",
        "What diameter or size do you need?",
      ],
    },
  ];

  const DEFAULT_CLARIFICATION_QUESTIONS = [
    "What is the intended application or environment (indoor/outdoor)?",
    "Are there any mandatory technical specifications (size, capacity, rating)?",
    "Is there a specific certification or compliance requirement?",
  ];

  const isUnderSpecified = (text) => {
    const wordCount = text
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .length;

    const hasNumbers = /\d/.test(text);

    return wordCount < 6 && !hasNumbers;
  };

  const generateClarificationQuestions = (
    text
  ) => {
    const rule = CLARIFICATION_RULES.find(
      (r) => r.match.test(text)
    );

    return (
      rule
        ? rule.questions
        : DEFAULT_CLARIFICATION_QUESTIONS
    ).slice(0, 3);
  };

  const handleClarificationAnswerChange = (
    question,
    value
  ) => {
    setClarificationAnswers((prev) => ({
      ...prev,
      [question]: value,
    }));
  };

  const handleClarificationContinue = () => {
    const answeredLines =
      clarificationQuestions
        .map((q) => {
          const answer = (
            clarificationAnswers[q] || ""
          ).trim();

          return answer
            ? `${q} ${answer}`
            : null;
        })
        .filter(Boolean);

    if (answeredLines.length > 0) {
      setRequirement((prev) =>
        `${prev.trim()} ${answeredLines.join(
          " "
        )}`.trim()
      );
    }

    setShowClarificationPrompt(false);
    setClarificationQuestions([]);
    setClarificationAnswers({});

    runAnalysis();
  };

  const handleClarificationSkip = () => {
    setShowClarificationPrompt(false);
    setClarificationQuestions([]);
    setClarificationAnswers({});

    runAnalysis();
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  const resetViews = () => {
    setShowResults(false);
    setShowHistory(false);
    setShowStandardDetails(false);
    setShowStandardsLibrary(false);
    setShowSettings(false);
    setShowAlerts(false);
    setShowHelp(false);
    setShowSaved(false);
    setShowCertificationJourney(false);
    setSelectedAnalysisStandard(null);
    setShowAllRecommendations(false);
    setShowAllRelationships(false);
  };

  const goDashboard = () => {
    resetViews();
  };

  const goAnalyze = () => {
    resetViews();

    setTimeout(() => {
      document
        .querySelector(".requirement-input")
        ?.focus();
    }, 100);
  };

  const handleHistory = () => {
    resetViews();

    setShowHistory(true);

    fetchHistory();
  };

  const handleStandardsLibrary = () => {
    resetViews();

    setLibraryStandard(null);
    setLibrarySearch("");
    setShowStandardsLibrary(true);

    if (standardsLibrary.length === 0) {
      fetchStandardsLibrary();
    }
  };

  const handleSettings = () => {
    resetViews();

    setShowSettings(true);
  };

  const handleAlerts = () => {
    resetViews();

    setShowAlerts(true);
  };

  const handleHelp = () => {
    resetViews();

    setShowHelp(true);
  };

  const handleSaved = () => {
    resetViews();
    setShowSaved(true);
  };

  const handleCertificationJourney = () => {
    let returnView = "dashboard";

    if (showStandardDetails) {
      returnView = "standardDetails";
    } else if (showResults) {
      returnView = "results";
    } else if (showHistory) {
      returnView = "history";
    } else if (showStandardsLibrary) {
      returnView = "standards";
    } else if (showSettings) {
      returnView = "settings";
    } else if (showAlerts) {
      returnView = "alerts";
    } else if (showHelp) {
      returnView = "help";
    }

    setCertificationReturnView(returnView);
    setCertificationReturnStandard(
      selectedAnalysisStandard ||
        analysisData?.primaryStandard ||
        null
    );
    setCertificationReturnLibraryStandard(
      libraryStandard || null
    );

    resetViews();
    setShowCertificationJourney(true);
  };

  const handleBack = () => {
    if (showCertificationJourney) {
      setShowCertificationJourney(false);

      setShowResults(false);
      setShowHistory(false);
      setShowStandardDetails(false);
      setShowStandardsLibrary(false);
      setShowSettings(false);
      setShowAlerts(false);
      setShowHelp(false);
      setShowAllRecommendations(false);
      setShowAllRelationships(false);

      if (certificationReturnView === "standardDetails") {
        setLibraryStandard(certificationReturnLibraryStandard);
        setSelectedAnalysisStandard(
          certificationReturnStandard ||
            analysisData?.primaryStandard ||
            null
        );
        setShowStandardDetails(true);
        return;
      }

      if (certificationReturnView === "results") {
        setLibraryStandard(null);
        setSelectedAnalysisStandard(
          certificationReturnStandard ||
            analysisData?.primaryStandard ||
            null
        );
        setShowResults(true);
        return;
      }

      if (certificationReturnView === "history") {
        setLibraryStandard(null);
        setSelectedAnalysisStandard(null);
        setShowHistory(true);
        fetchHistory();
        return;
      }

      if (certificationReturnView === "standards") {
        setLibraryStandard(null);
        setSelectedAnalysisStandard(null);
        setShowStandardsLibrary(true);
        return;
      }

      if (certificationReturnView === "settings") {
        setLibraryStandard(null);
        setSelectedAnalysisStandard(null);
        setShowSettings(true);
        return;
      }

      if (certificationReturnView === "alerts") {
        setLibraryStandard(null);
        setSelectedAnalysisStandard(null);
        setShowAlerts(true);
        return;
      }

      if (certificationReturnView === "help") {
        setLibraryStandard(null);
        setSelectedAnalysisStandard(null);
        setShowHelp(true);
        return;
      }

      setLibraryStandard(null);
      setSelectedAnalysisStandard(null);
      return;
    }

    resetViews();
  };

  // =========================================================
  // FETCH HISTORY
  // =========================================================

  const fetchHistory = async () => {
    try {
      setHistoryLoading(true);

      const response = await fetch(
        `${API_BASE}/history`
      );

      const result = await response.json();

      if (result.success) {
        setHistory(result.data || []);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error(
        "History fetch error:",
        error
      );
    } finally {
      setHistoryLoading(false);
    }
  };

  // =========================================================
  // ANALYZE REQUIREMENT
  // =========================================================

  const handleAnalyze = async () => {
    if (!requirement.trim()) {
      alert(
        t("enterProductDescription")
      );

      return;
    }

    if (isUnderSpecified(requirement)) {
      setClarificationQuestions(
        generateClarificationQuestions(
          requirement
        )
      );

      setClarificationAnswers({});
      setShowClarificationPrompt(true);

      return;
    }

    await runAnalysis();
  };

  const runAnalysis = async () => {
    try {
      setAnalyzing(true);

      setShowResults(false);
      setShowHistory(false);
      setShowStandardDetails(false);
      setShowSaved(false);

      const response = await fetch(
        `${API_BASE}/analyze`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            requirement:
              requirement.trim(),

            inputLanguage,

            recommendationLanguage,

            language:
              recommendationLanguage,
          }),
        }
      );

      const result = await response.json();

      if (!result.success) {
        alert(
          result.message ||
            t("analysisFailed")
        );

        return;
      }

      setAnalysisData(
        result.data
      );

      setSelectedAnalysisStandard(
        result.data?.primaryStandard ||
          null
      );

      setShowAllRecommendations(false);
      setShowAllRelationships(false);

      setShowResults(true);

      fetchHistory();
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      alert(
        `${t(
          "backendConnection"
        )} Please make sure your backend is running on port 5000.`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  // =========================================================
  // GENERATE REPORT
  // =========================================================

  const handleGenerateReport = async () => {
    if (!requirement.trim()) {
      alert(t("noRequirement"));
      return;
    }

    try {
      setGeneratingReport(true);

      const response = await fetch(
        `${API_BASE}/report`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            requirement:
              requirement.trim(),

            analysis:
              analysisData,

            language:
              recommendationLanguage,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          t("reportError");

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.message ||
            errorMessage;
        } catch {
          // Ignore
        }

        throw new Error(
          errorMessage
        );
      }

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "IS-ASSIST-Report.pdf";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(
        "Report generation error:",
        error
      );

      alert(
        error.message ||
          t("reportError")
      );
    } finally {
      setGeneratingReport(false);
    }
  };

  // =========================================================
  // PDF UPLOAD
  // =========================================================

  const handleFileChange = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.type !==
      "application/pdf"
    ) {
      alert(
        "Please select a PDF file."
      );

      return;
    }

    if (
      file.size >
      20 * 1024 * 1024
    ) {
      alert(
        "PDF must be smaller than 20 MB."
      );

      return;
    }

    setSelectedFile(file);
    setPdfSuccess(false);
  };

  const handlePdfUpload = () => {
    fileInputRef.current?.click();
  };

  const handlePdfAnalyze =
    async () => {
      if (!selectedFile) {
        alert(
          "Please select a tender PDF first."
        );

        return;
      }

      try {
        setPdfAnalyzing(true);
        setPdfSuccess(false);

        const formData =
          new FormData();

        formData.append(
          "tender",
          selectedFile
        );

        const response =
          await fetch(
            `${API_BASE}/analyze-pdf`,
            {
              method: "POST",
              body: formData,
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.message ||
              "Unable to analyze the tender PDF."
          );
        }

        const analyzedData =
          result.data || null;

        setAnalysisData(
          analyzedData
        );

        setSelectedAnalysisStandard(
          analyzedData?.primaryStandard ||
            null
        );

        setShowAllRecommendations(
          false
        );

        setShowAllRelationships(
          false
        );

        setRequirement(
          analyzedData?.requirement ||
            `Tender document: ${selectedFile.name}`
        );

        setPdfSuccess(true);

        setShowResults(true);
        setShowHistory(false);
        setShowStandardDetails(
          false
        );

        fetchHistory();
      } catch (error) {
        console.error(
          "PDF analysis error:",
          error
        );

        alert(
          error.message ||
            "Unable to process the tender PDF."
        );
      } finally {
        setPdfAnalyzing(false);
      }
    };

  // =========================================================
  // CLEAR HISTORY
  // =========================================================

  const clearHistory = async () => {
    const confirmed =
      window.confirm(
        t("confirmClearHistory")
      );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/history`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (result.success) {
        setHistory([]);
      } else {
        alert(
          "Unable to clear history."
        );
      }
    } catch (error) {
      console.error(
        "Clear history error:",
        error
      );

      alert(
        t("backendConnection")
      );
    }
  };

  const deleteHistoryItem = (
    id
  ) => {
    const confirmed =
      window.confirm(
        "Delete this item from your analysis history?"
      );

    if (!confirmed) {
      return;
    }

    setHistory((prev) =>
      prev.filter(
        (item) => item.id !== id
      )
    );
  };

  // =========================================================
  // VIEW STANDARD
  // =========================================================

  const handleViewStandard = (
    standard = null
  ) => {
    setStandardDetailsReturnView("default");
    setSelectedAnalysisStandard(
      standard ||
        analysisData?.primaryStandard ||
        null
    );

    setLibraryStandard(null);

    setShowStandardDetails(true);
  };

  const handleViewLibraryStandard =
    (standard) => {
      setStandardDetailsReturnView("default");
      setLibraryStandard(standard);

      setSelectedAnalysisStandard(
        null
      );

      setShowStandardDetails(true);
    };

  const handleCloseStandard = () => {
    setShowStandardDetails(false);
    setLibraryStandard(null);
    setSelectedAnalysisStandard(null);

    if (standardDetailsReturnView === "saved") {
      setStandardDetailsReturnView("default");
      setShowSaved(true);
    }
  };

  const showActionMessage = (
    message
  ) => {
    setActionMessage(message);

    window.setTimeout(
      () => setActionMessage(""),
      2500
    );
  };

  const handleToggleRecommendations =
    () => {
      setShowAllRecommendations(
        (previous) => !previous
      );
    };

  const handleToggleRelationships =
    () => {
      setShowAllRelationships(
        (previous) => !previous
      );
    };

  const handleSaveStandard = (
    standard = primaryStandard
  ) => {
    if (!standard?.number) {
      showActionMessage(
        "No standard is available to save."
      );

      return;
    }

    const alreadySaved =
      savedStandards.some(
        (item) =>
          item.id === standard.id ||
          (!item.id &&
            item.number ===
              standard.number)
      );

    setSavedStandards(
      (previous) => {
        const exists =
          previous.some(
            (item) =>
              item.id ===
                standard.id ||
              (!item.id &&
                item.number ===
                  standard.number)
          );

        const next = exists
          ? previous.filter(
              (item) =>
                !(
                  item.id ===
                    standard.id ||
                  (!item.id &&
                    item.number ===
                      standard.number)
                )
            )
          : [
              ...previous,
              {
                ...standard,
                savedAt:
                  new Date().toISOString(),
              },
            ];

        try {
          window.localStorage.setItem(
            "is-assist-saved-standards",
            JSON.stringify(
              next
            )
          );
        } catch {
          // Local persistence is best-effort.
        }

        return next;
      }
    );

    showActionMessage(
      alreadySaved
        ? `${standard.number} removed from My Saved.`
        : `${standard.number} saved to My Saved.`
    );
  };

  const handleDownloadPreview = (
    standard = primaryStandard
  ) => {
    const url =
      cleanSourceUrl(
        standard?.sourceUrl
      );

    if (!url) {
      showActionMessage(
        "No BIS source document is available for this standard."
      );

      return;
    }

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleGenerateSpecification =
    () => {
      const requirementText =
        analysisData?.requirement ||
        requirement ||
        "Procurement requirement not specified.";

      const lines = [
        "IS-ASSIST — PROCUREMENT SPECIFICATION DRAFT",
        "",
        `Requirement: ${requirementText}`,
        "",
        "Recommended Primary Standard:",
        `${
          primaryStandard.number ||
          "Not available"
        } — ${
          primaryStandard.title ||
          "Not available"
        }`,
        `Match Score: ${
          primaryStandard.match ??
          "—"
        }%`,
        `Status: ${primaryStatusLabel}`,
        "",
        "Extracted Procurement Context:",
        `Product: ${
          analysisData?.product ||
          analysisData
            ?.extractedRequirements
            ?.product ||
          "Not specified"
        }`,
        `Application: ${
          analysisData?.application ||
          analysisData
            ?.extractedRequirements
            ?.application ||
          "Not specified"
        }`,
        `Category: ${
          analysisData?.category ||
          analysisData
            ?.extractedRequirements
            ?.category ||
          "Not specified"
        }`,
        `Power: ${displayPower}`,
        `Key Requirements: ${
          analysisData?.keyRequirements ||
          analysisData
            ?.extractedRequirements
            ?.keyRequirements ||
          "Not specified"
        }`,
        "",
        "Related Standards:",
        ...(relatedRecommendations.length
          ? relatedRecommendations.map(
              (item, index) =>
                `${index + 1}. ${
                  item.number ||
                  "Not specified"
                } — ${
                  item.title ||
                  "No title"
                } (Match: ${
                  item.match ?? "—"
                }%)`
            )
          : [
              "No related standards returned.",
            ]),
        "",
        "Evidence / Verification:",
        analysisData?.evidence
          ?.verificationLevel ||
          verificationLabel ||
          "Not available",
        analysisData?.evidence
          ?.sourceName
          ? `Source: ${analysisData.evidence.sourceName}`
          : "Source: BIS knowledge base",
        analysisData?.evidence
          ?.coverageNote || "",
        "",
        "Important: Verify the final procurement clause against the official BIS document before issuing a tender or making a compliance determination.",
      ];

      const blob = new Blob(
        [lines.join("\n")],
        {
          type:
            "text/plain;charset=utf-8",
        }
      );

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        "IS-ASSIST-Procurement-Specification.txt";

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);

      showActionMessage(
        "Procurement specification draft generated."
      );
    };

  const handleShareResults =
    async () => {
      const shareText = [
        "IS-ASSIST Analysis",
        `Requirement: ${
          analysisData?.requirement ||
          requirement ||
          "Not specified"
        }`,
        `Primary Standard: ${
          primaryStandard.number ||
          "Not available"
        }`,
        `Match Score: ${
          primaryStandard.match ??
          "—"
        }%`,
      ].join("\n");

      try {
        if (navigator.share) {
          await navigator.share({
            title:
              "IS-ASSIST Analysis",
            text: shareText,
          });

          showActionMessage(
            "Results shared."
          );

          return;
        }

        if (
          navigator.clipboard
            ?.writeText
        ) {
          await navigator.clipboard.writeText(
            shareText
          );

          showActionMessage(
            "Results copied to clipboard."
          );

          return;
        }

        showActionMessage(
          "Sharing is not available in this browser."
        );
      } catch (error) {
        console.error(
          "Share results error:",
          error
        );

        showActionMessage(
          "Unable to share or copy the results."
        );
      }
    };

  // =========================================================
  // FORMATTERS
  // =========================================================

  const formatDate = (
    date
  ) => {
    if (!date) {
      return t("unknownDate");
    }

    return new Date(
      date
    ).toLocaleString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  const getPrimaryStandard = () => {
    return (
      libraryStandard ||
      selectedAnalysisStandard ||
      analysisData?.primaryStandard ||
      null
    );
  };

  const primaryStandard =
    getPrimaryStandard() || {};

  const relatedRecommendations =
    (
      analysisData?.relatedStandards ||
      []
    ).filter(Boolean);

  const displayPower =
    analysisData?.power ||
    extractPowerFromText(
      analysisData?.requirement ||
        requirement
    ) ||
    "Not specified";

  const primaryIsCurrent =
    primaryStandard
      ?.statusParsed
      ?.is_current ??
    String(
      primaryStandard?.status ||
        ""
    )
      .toLowerCase()
      .includes("current");

  const primaryStatusLabel =
    getStatusLabel(
      primaryStandard
    );

  const verificationLabel =
    analysisData?.evidence
      ?.verificationLevel ||
    (primaryStandard?.contentDepth ===
    "detailed"
      ? "Detailed evidence"
      : "Catalogue-level evidence");

  // =========================================================
  // SIDEBAR
  // =========================================================

  const [sidebarOpen, setSidebarOpen] =
    useState(false);

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app-shell">

      {/* =====================================================
          MOBILE OVERLAY
      ===================================================== */}

      {sidebarOpen && (
        <div
          className="mobile-overlay"
          onClick={() =>
            setSidebarOpen(false)
          }
        />
      )}

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside
        className={`sidebar ${
          sidebarOpen
            ? "sidebar-open"
            : ""
        }`}
      >

        <div className="sidebar-brand">

          <div className="brand-mark">
            IS
          </div>

          <div>
            <h2>
              IS-ASSIST AI
            </h2>

            <p>
              Indian Standards
              <br />
              Recommendation Engine
            </p>
          </div>

          <button
            className="mobile-close"
            onClick={() =>
              setSidebarOpen(false)
            }
          >
            <X size={20} />
          </button>

        </div>

        <div className="sidebar-divider" />

        <nav className="sidebar-nav">

          <button
            className={`nav-item ${
              !showResults &&
              !showHistory &&
              !showStandardsLibrary &&
              !showSettings &&
              !showAlerts &&
              !showHelp &&
              !showSaved &&
              !showCertificationJourney
                ? "active"
                : ""
            }`}
            onClick={goDashboard}
          >
            <LayoutDashboard size={18} />
            <span>
              {t("dashboard")}
            </span>
          </button>

          <button
            className="nav-item"
            onClick={goAnalyze}
          >
            <Search size={18} />
            <span>
              {t(
                "analyzeRequirement"
              )}
            </span>
          </button>

          <button
            className="nav-item"
            onClick={
              handlePdfUpload
            }
          >
            <UploadCloud size={18} />
            <span>
              {t(
                "uploadTenderPDF"
              )}
            </span>
          </button>

          <button
            className={`nav-item ${
              showHistory
                ? "active"
                : ""
            }`}
            onClick={
              handleHistory
            }
          >
            <History size={18} />
            <span>
              {t("history")}
            </span>
          </button>

          <button
            className="nav-item"
            onClick={
              handleStandardsLibrary
            }
          >
            <BookOpen size={18} />
            <span>
              {t("standards")}
            </span>
          </button>

          <button
            className={`nav-item ${
              showSaved ? "active" : ""
            }`}
            onClick={handleSaved}
          >
            <Bookmark size={18} />
            <span>
              {t("mySaved")}
            </span>
            {savedStandards.length > 0 && (
              <span className="nav-badge">
                {savedStandards.length}
              </span>
            )}
          </button>

          <button
            className={`nav-item ${
              showCertificationJourney
                ? "active"
                : ""
            }`}
            onClick={
              handleCertificationJourney
            }
          >
            <ShieldCheck size={18} />
            <span>
              {t("certificationJourney")}
            </span>
          </button>

          <button
            className={`nav-item ${
              showAlerts
                ? "active"
                : ""
            }`}
            onClick={
              handleAlerts
            }
          >
            <Bell size={18} />
            <span>
              {t("alerts")}
            </span>

            {unreadAlertsCount >
              0 && (
              <span className="nav-badge">
                {
                  unreadAlertsCount
                }
              </span>
            )}
          </button>

        </nav>

        <div className="sidebar-bottom">

          <button
            className={`nav-item ${
              showSettings
                ? "active"
                : ""
            }`}
            onClick={
              handleSettings
            }
          >
            <Settings size={18} />
            <span>
              {t("settings")}
            </span>
          </button>

          <button
            className={`nav-item ${
              showHelp
                ? "active"
                : ""
            }`}
            onClick={
              handleHelp
            }
          >
            <HelpCircle size={18} />
            <span>
              {t("helpAndGuide")}
            </span>
          </button>

          <div className="sidebar-profile">

            <div className="profile-avatar">
              <UserCircle size={29} />
            </div>

            <div className="profile-info">
              <strong>
                {t(
                  "procurementOfficer"
                )}
              </strong>

              <span>
                Government of India
              </span>

              <small>
                <i />
                {t(
                  "aiSystemOnline"
                )}
              </small>
            </div>

          </div>

          <div className="sidebar-help">

            <span>
              {t("needHelp")}
            </span>

            <p>
              {t("needHelpDescription")}
            </p>

            <button>
              <Sparkles size={15} />
              {t("chatWithAssistant")}
            </button>

          </div>

        </div>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <main className="main-area">

        {actionMessage && (
          <div
            className="app-action-toast"
            role="status"
          >
            {actionMessage}
          </div>
        )}

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="topbar reference-topbar">
          <button
            type="button"
            className="reference-brand"
            onClick={goDashboard}
            aria-label={t("goHome")}
          >
            <span className="reference-brand-mark">IS</span>
            <span className="reference-brand-copy">
              <strong>BUREAU OF INDIAN STANDARDS</strong>
              <small>Ministry of Consumer Affairs, Food &amp; Public Distribution</small>
            </span>
          </button>

          <nav className="reference-main-nav" aria-label="Primary navigation">
            <button
              type="button"
              className={!showResults && !showHistory && !showStandardsLibrary && !showStandardDetails && !showSaved && !showCertificationJourney && !showSettings && !showAlerts && !showHelp ? "active" : ""}
              onClick={goDashboard}
            >
              {t("servicesNav")}
            </button>
            <button
              type="button"
              className={showStandardsLibrary || showStandardDetails ? "active" : ""}
              onClick={handleStandardsLibrary}
            >
              {t("standards")}
            </button>
            <button
              type="button"
              className={showCertificationJourney ? "active" : ""}
              onClick={handleCertificationJourney}
            >
              {t("certificationNav")}
            </button>
            <button
              type="button"
              className={showHistory ? "active" : ""}
              onClick={handleHistory}
            >
              {t("history")}
            </button>
            <button
              type="button"
              className={showSaved ? "active" : ""}
              onClick={handleSaved}
            >
              {t("mySaved")}
            </button>
            <button
              type="button"
              className={showHelp ? "active" : ""}
              onClick={handleHelp}
            >
              {t("contactBIS")}
            </button>
          </nav>

          <div className="reference-top-actions">
            <button
              type="button"
              className="reference-alert-button"
              onClick={handleAlerts}
              aria-label={t("alerts")}
              title={t("alerts")}
            >
              <Bell size={16} />
              {unreadAlertsCount > 0 && (
                <span>{unreadAlertsCount}</span>
              )}
            </button>

            <div className="reference-language">
              <Globe size={15} />
              <select
                value={recommendationLanguage}
                onChange={(e) => setRecommendationLanguage(e.target.value)}
                aria-label={t("interfaceLanguage")}
              >
                {languages.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronRight size={12} className="rotate-90" />
            </div>
            <button
              type="button"
              className="reference-signin"
              onClick={handleSettings}
            >
              <UserCircle size={15} />
              {t("applicantSignIn")}
            </button>
          </div>
        </header>

        {/* ===================================================
            CONTENT
        =================================================== */}

        {showCertificationJourney ? (
          <CertificationJourney
            initialProduct={
              analysisData?.product ||
              analysisData
                ?.extractedRequirements
                ?.product ||
              ""
            }

            initialStandard={
              analysisData
                ?.primaryStandard
                ?.number ||
              ""
            }

            onBack={
              handleBack
            }
          />
        ) : showStandardDetails ? (

          /* =================================================
             STANDARD DETAILS
          ================================================= */

          <section className="page-container standard-details-page">

            <div className="details-header">

              <button
                className="inline-back"
                onClick={
                  handleCloseStandard
                }
              >
                <ArrowLeft size={15} />
                Back to recommendations
              </button>

              <div className="details-title">

                <div className="details-is">
                  IS
                </div>

                <div>

                  <span className="section-label">
                    INDIAN STANDARD
                  </span>

                  <h2>
                    {
                      primaryStandard.number
                    }
                  </h2>

                  <p>
                    {
                      primaryStandard.title
                    }
                  </p>

                </div>

              </div>

              <div className="details-actions">

                <button
                  onClick={() =>
                    handleDownloadPreview(
                      primaryStandard
                    )
                  }
                >
                  <Download size={16} />
                  Download Preview
                </button>

                <button
                  className="primary-action"
                  onClick={() =>
                    handleSaveStandard(
                      primaryStandard
                    )
                  }
                >
                  <Bookmark size={16} />

                  {
                    savedStandards.some(
                      (item) =>
                        item.id ===
                          primaryStandard.id ||
                        (!item.id &&
                          item.number ===
                            primaryStandard.number)
                    )
                      ? t("saved")
                      : t("saveStandard")
                  }
                </button>

              </div>

            </div>

            <div className="standard-detail-grid">

              <div className="result-card">

                <div className="result-card-header">

                  <div>
                    <span className="section-label">
                      STANDARD OVERVIEW
                    </span>

                    <h2>
                      About this Standard
                    </h2>
                  </div>

                  <ShieldCheck
                    size={20}
                  />

                </div>

                <p className="detail-description">
                  {
                    primaryStandard.content ||
                    primaryStandard.coverageNote ||
                    "No detailed scope text is available in the current knowledge base. Verify the official BIS document before using this standard for compliance decisions."
                  }
                </p>

                <div className="detail-meta-grid">

                  <div>
                    <span>
                      {
                        t(
                          "standard"
                        )
                      }
                    </span>

                    <strong>
                      {
                        primaryStandard.number ||
                        "Not available"
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Match Score
                    </span>

                    <strong>
                      {
                        primaryStandard.match ??
                        "—"
                      }%
                    </strong>
                  </div>

                  <div>

                    <span>
                      {t("status")}
                    </span>

                    <strong
                      className={
                        primaryIsCurrent
                          ? "success-text"
                          : ""
                      }
                    >
                      ●{" "}
                      {
                        primaryStatusLabel
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      {
                        t(
                          "certification"
                        )
                      }
                    </span>

                    <strong>
                      {
                        analysisData
                          ?.certification
                          ?.applicable
                          ? `BIS ${t(
                              "applicable"
                            )}`
                          : "Not established"
                      }
                    </strong>

                  </div>

                </div>

              </div>

              <div className="result-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      {
                        t(
                          "standardStatus"
                        )
                      }
                    </span>

                    <h2>
                      {
                        t(
                          "versionInformation"
                        )
                      }
                    </h2>

                  </div>

                  <CalendarDays
                    size={20}
                  />

                </div>

                <div className="status-list">

                  <div>
                    <span>
                      {
                        t(
                          "currentEdition"
                        )
                      }
                    </span>

                    <strong>
                      {
                        primaryStandard.number
                      }
                    </strong>
                  </div>

                  <div>
                    <span>
                      Publication{" "}
                      {
                        t("status")
                      }
                    </span>

                    <strong
                      className={
                        primaryIsCurrent
                          ? "success-text"
                          : ""
                      }
                    >
                      {
                        primaryStatusLabel
                      }
                    </strong>
                  </div>

                  <div>

                    <span>
                      Verification
                    </span>

                    <strong>
                      {
                        verificationLabel
                      }
                    </strong>

                  </div>

                </div>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    SCOPE
                  </span>

                  <h2>
                    Applicable Procurement Context
                  </h2>

                </div>

                <ClipboardCheck
                  size={20}
                />

              </div>

              <div className="scope-boxes">

                <div>

                  <strong>
                    {t("product")}
                  </strong>

                  <span>
                    {
                      analysisData
                        ?.product ||
                      analysisData
                        ?.extractedRequirements
                        ?.product ||
                      "Not specified"
                    }
                  </span>

                </div>

                <div>

                  <strong>
                    {
                      t(
                        "application"
                      )
                    }
                  </strong>

                  <span>
                    {
                      analysisData
                        ?.application ||
                      analysisData
                        ?.extractedRequirements
                        ?.application ||
                      "Not specified"
                    }
                  </span>

                </div>

                <div>

                  <strong>
                    {
                      t("category")
                    }
                  </strong>

                  <span>
                    {
                      analysisData
                        ?.category ||
                      analysisData
                        ?.extractedRequirements
                        ?.category ||
                      "Not specified"
                    }
                  </span>

                </div>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>
                  <span className="section-label">
                    REFERENCES
                  </span>

                  <h2>
                    {
                      t(
                        "relatedStandards"
                      )
                    }
                  </h2>
                </div>

                <Link2 size={20} />

              </div>

              <div className="reference-list">

                {relatedRecommendations.length >
                0 ? (
                  relatedRecommendations.map(
                    (
                      standard,
                      index
                    ) => (
                      <div
                        key={
                          standard.id ||
                          `${standard.number}-${index}`
                        }
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          handleViewStandard(
                            standard
                          )
                        }
                        onKeyDown={(
                          event
                        ) => {
                          if (
                            event.key ===
                              "Enter" ||
                            event.key ===
                              " "
                          ) {
                            handleViewStandard(
                              standard
                            );
                          }
                        }}
                      >

                        <span>
                          {
                            standard.type ||
                            standard.category ||
                            "Related Standard"
                          }
                        </span>

                        <strong>
                          {
                            standard.number ||
                            "Not specified"
                          }
                        </strong>

                        <ChevronRight
                          size={16}
                        />

                      </div>
                    )
                  )
                ) : (
                  <div>
                    <span>
                      No related standards were returned for this analysis.
                    </span>
                  </div>
                )}

              </div>

            </div>

          </section>

        ) : showHistory ? (

          /* =================================================
             HISTORY PAGE
          ================================================= */

          <section className="page-container">

            <div className="page-heading-row">

              <div>

                <span className="section-label">
                  {
                    t(
                      "previousAnalyses"
                    )
                  }
                </span>

                <h2>
                  {
                    t(
                      "analysisHistory"
                    )
                  }
                </h2>

                <p>
                  {
                    t(
                      "reviewPrevious"
                    )
                  }
                </p>

              </div>

              {history.length >
                0 && (
                <button
                  className="danger-button"
                  onClick={
                    clearHistory
                  }
                >
                  <Trash2 size={16} />
                  {
                    t(
                      "clearHistory"
                    )
                  }
                </button>
              )}

            </div>

            {historyLoading ? (

              <div className="empty-state">

                <div className="loading-spinner" />

                <h3>
                  {
                    t(
                      "loadingHistory"
                    )
                  }
                </h3>

              </div>

            ) : history.length ===
              0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  <History
                    size={28}
                  />
                </div>

                <h3>
                  {
                    t("noHistory")
                  }
                </h3>

                <p>
                  {
                    t(
                      "historyDescription"
                    )
                  }
                </p>

                <button
                  className="primary-action large"
                  onClick={
                    goAnalyze
                  }
                >
                  <Search size={17} />

                  {
                    t(
                      "analyzeRequirement"
                    )
                  }
                </button>

              </div>

            ) : (

              <div className="history-list">

                {history.map(
                  (item) => (

                    <div
                      className="history-card"
                      key={item.id}
                    >

                      <div className="history-icon">

                        {item.type ===
                        "PDF" ? (
                          <FileText
                            size={22}
                          />
                        ) : (
                          <Search
                            size={22}
                          />
                        )}

                      </div>

                      <div className="history-content">

                        <div className="history-title-row">

                          <h3>
                            {item.type ===
                            "PDF"
                              ? item.fileName ||
                                "Tender PDF"
                              : t(
                                  "requirementAnalysis"
                                )}
                          </h3>

                          <span
                            className={`history-type ${
                              item.type ===
                              "PDF"
                                ? "pdf-type"
                                : ""
                            }`}
                          >
                            {item.type ===
                            "PDF"
                              ? t("pdf")
                              : "ANALYSIS"}
                          </span>

                        </div>

                        <p>
                          {
                            item.requirement
                          }
                        </p>

                        <div className="history-meta">

                          <span>

                            <CalendarDays
                              size={14}
                            />

                            {
                              formatDate(
                                item.createdAt
                              )
                            }

                          </span>

                          <span>

                            {
                              t(
                                "standard"
                              )
                            }:

                            <strong>
                              {
                                item.standard ||
                                "—"
                              }
                            </strong>

                          </span>

                          <span>

                            {
                              t(
                                "match"
                              )
                            }:

                            <strong>
                              {
                                item.match ||
                                "—"
                              }
                              %
                            </strong>

                          </span>

                        </div>

                      </div>

                      <ChevronRight
                        size={20}
                        className="history-arrow"
                      />

                      <button
                        type="button"
                        className="history-delete"
                        title="Delete this item"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteHistoryItem(
                            item.id
                          );
                        }}
                      >
                        <Trash2 size={16} />
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        ) : showResults ? (

          /* =================================================
             RESULTS PAGE
          ================================================= */

          <section className="page-container results-flow">

            <div className="result-requirement">

              <div>

                <span className="section-label">
                  {
                    t(
                      "yourRequirement"
                    )
                  }
                </span>

                <p>
                  {
                    requirement
                  }
                </p>

              </div>

              <div className="analysis-complete">

                <CheckCircle2
                  size={17}
                />

                {
                  t(
                    "analyzeComplete"
                  )
                }

              </div>

            </div>

            <section className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    {
                      t(
                        "aiUnderstanding"
                      )
                    }
                  </span>

                  <h2>
                    {
                      t(
                        "extractedRequirements"
                      )
                    }
                  </h2>

                </div>

                <div className="ai-pill">
                  <Sparkles
                    size={14}
                  />

                  {
                    t(
                      "aiPowered"
                    )
                  }
                </div>

              </div>

              <div className="understanding-grid">

                <div className="understanding-item purple">

                  <div className="understanding-icon">
                    <FileText
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      {
                        t(
                          "product"
                        )
                      }
                    </span>

                    <strong>
                      {
                        analysisData
                          ?.product ||
                        analysisData
                          ?.extractedRequirements
                          ?.product ||
                        "Not specified"
                      }
                    </strong>

                  </div>

                </div>

                <div className="understanding-item blue">

                  <div className="understanding-icon">
                    ⚡
                  </div>

                  <div>

                    <span>
                      {
                        t("power")
                      }
                    </span>

                    <strong>
                      {
                        displayPower
                      }
                    </strong>

                  </div>

                </div>

                <div className="understanding-item green">

                  <div className="understanding-icon">
                    <Globe
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      {
                        t(
                          "application"
                        )
                      }
                    </span>

                    <strong>
                      {
                        analysisData
                          ?.application ||
                        analysisData
                          ?.extractedRequirements
                          ?.application ||
                        "Not specified"
                      }
                    </strong>

                  </div>

                </div>

                <div className="understanding-item orange">

                  <div className="understanding-icon">
                    <ShieldCheck
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      Key Requirements
                    </span>

                    <strong>
                      {
                        analysisData
                          ?.keyRequirements ||
                        analysisData
                          ?.extractedRequirements
                          ?.keyRequirements ||
                        "Not specified"
                      }
                    </strong>

                  </div>

                </div>

                <div className="understanding-item yellow">

                  <div className="understanding-icon">
                    <BookOpen
                      size={19}
                    />
                  </div>

                  <div>

                    <span>
                      {
                        t(
                          "category"
                        )
                      }
                    </span>

                    <strong>
                      {
                        analysisData
                          ?.category ||
                        analysisData
                          ?.extractedRequirements
                          ?.category ||
                        "Not specified"
                      }
                    </strong>

                  </div>

                </div>

              </div>

            </section>

            {(analysisData
              ?.needsClarification ||
              analysisData
                ?.clarificationQuestions
                ?.length >
                0) && (

              <section className="clarification-card">

                <div className="clarification-icon">
                  <CircleHelp
                    size={21}
                  />
                </div>

                <div className="clarification-content">

                  <span className="section-label">
                    AI CLARIFICATION
                  </span>

                  <h3>
                    A few details could improve the recommendation
                  </h3>

                  <p>
                    Please provide the following information for a more accurate standards match.
                  </p>

                  <div className="clarification-list">

                    {(
                      analysisData
                        ?.clarificationQuestions ||
                      [
                        "What is the intended application?",
                        "Are there any mandatory technical specifications?",
                      ]
                    ).map(
                      (
                        question,
                        index
                      ) => (

                        <div
                          key={
                            index
                          }
                        >
                          <span>
                            {
                              index +
                              1
                            }
                          </span>

                          {
                            question
                          }
                        </div>

                      )
                    )}

                  </div>

                </div>

              </section>

            )}

            <div className="results-columns">

              <section className="result-card standards-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      RECOMMENDED STANDARDS
                    </span>

                    <h2>
                      Most Relevant Standards
                    </h2>

                  </div>

                  <span className="count-pill">

                    {
                      relatedRecommendations.length >
                      0
                        ? `${relatedRecommendations.length} Related Found`
                        : "Primary Only"
                    }

                  </span>

                </div>

                <div className="recommendation-list">

                  <div className="recommendation primary">

                    <div className="recommendation-icon green">
                      <FileText
                        size={22}
                      />
                    </div>

                    <div className="recommendation-main">

                      <div className="recommendation-heading">

                        <span className="primary-label">
                          {
                            t(
                              "primary"
                            ).toUpperCase()
                          }
                        </span>

                        <span className="current-label">
                          ●{" "}
                          {
                            primaryStatusLabel
                          }
                        </span>

                      </div>

                      <h3>
                        {
                          primaryStandard.number
                        }
                      </h3>

                      <p>
                        {
                          primaryStandard.title
                        }
                      </p>

                      <div className="tag-row">

                        <span>
                          {
                            t(
                              "productStandard"
                            )
                          }
                        </span>

                        <span>
                          {
                            primaryStandard
                              .statusParsed
                              ?.revision ||
                            (primaryIsCurrent
                              ? "Current edition"
                              : "Edition status not confirmed")
                          }
                        </span>

                      </div>

                    </div>

                    <div className="match-column">

                      <strong>
                        {
                          primaryStandard.match ??
                          "—"
                        }%
                      </strong>

                      <span>
                        Match Score
                      </span>

                      <button
                        onClick={() =>
                          handleViewStandard(
                            primaryStandard
                          )
                        }
                      >
                        View Details
                        <ChevronRight
                          size={14}
                        />
                      </button>

                    </div>

                  </div>

                  {(
                    showAllRecommendations
                      ? relatedRecommendations
                      : relatedRecommendations.slice(
                          0,
                          3
                        )
                  ).map(
                    (
                      standard,
                      index
                    ) => {

                      const iconClass =
                        getRecommendationIconClass(
                          standard,
                          index
                        );

                      return (
                        <div
                          className="recommendation"
                          key={
                            standard.id ||
                            `${standard.number}-${index}`
                          }
                        >

                          <div
                            className={`recommendation-icon ${iconClass}`}
                          >

                            {iconClass ===
                            "orange" ? (
                              <ShieldCheck
                                size={22}
                              />
                            ) : iconClass ===
                              "blue" ? (
                              <ClipboardCheck
                                size={22}
                              />
                            ) : (
                              <Link2
                                size={22}
                              />
                            )}

                          </div>

                          <div className="recommendation-main">

                            <div className="recommendation-heading">

                              <span className="current-label">
                                ●{" "}
                                {
                                  getStatusLabel(
                                    standard
                                  )
                                }
                              </span>

                            </div>

                            <h3>
                              {
                                standard.number ||
                                "Not specified"
                              }
                            </h3>

                            <p>
                              {
                                standard.title ||
                                "No title available"
                              }
                            </p>

                            <div className="tag-row">

                              <span>
                                {
                                  standard.type ||
                                  standard.category ||
                                  "Related Standard"
                                }
                              </span>

                              {standard.contentDepth && (
                                <span>
                                  {
                                    standard.contentDepth.replace(
                                      /_/g,
                                      " "
                                    )
                                  }
                                </span>
                              )}

                            </div>

                          </div>

                          <div
                            className={`match-column ${iconClass}-text`}
                          >

                            <strong>
                              {
                                standard.match ??
                                "—"
                              }%
                            </strong>

                            <span>
                              Match Score
                            </span>

                            <button
                              onClick={() =>
                                handleViewStandard(
                                  standard
                                )
                              }
                            >
                              View Details
                              <ChevronRight
                                size={14}
                              />
                            </button>

                          </div>

                        </div>
                      );
                    }
                  )}

                  {relatedRecommendations.length ===
                    0 && (
                    <div className="empty-state compact">

                      <h3>
                        No related standards returned
                      </h3>

                      <p>
                        The current analysis did not identify additional standards.
                      </p>

                    </div>
                  )}

                </div>

                <button
                  className="view-all-button"
                  onClick={
                    handleToggleRecommendations
                  }
                  disabled={
                    relatedRecommendations.length ===
                    0
                  }
                >

                  {
                    showAllRecommendations
                      ? "Show fewer recommendations"
                      : `View all ${relatedRecommendations.length} related recommendations`
                  }

                  <ChevronRight
                    size={15}
                    className={
                      showAllRecommendations
                        ? "rotate-90"
                        : ""
                    }
                  />

                </button>

              </section>

              <section className="result-card relationship-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      {
                        t(
                          "standardRelationship"
                        )
                      }
                    </span>

                    <h2>
                      {
                        t(
                          "standardsNetwork"
                        )
                      }
                    </h2>

                  </div>

                  <Network
                    size={19}
                  />

                </div>

                <div className="network">

                  <div className="network-side">

                    {(
                      showAllRelationships
                        ? relatedRecommendations
                        : relatedRecommendations.slice(
                            0,
                            2
                          )
                    ).map(
                      (
                        standard,
                        index
                      ) => (

                        <div
                          className={`network-node ${
                            index === 0
                              ? "blue-node"
                              : "purple-node"
                          }`}
                          key={
                            standard.id ||
                            `${standard.number}-${index}`
                          }
                        >

                          <strong>
                            {
                              standard.number ||
                              "Not specified"
                            }
                          </strong>

                          <span>
                            {
                              standard.type ||
                              standard.category ||
                              "Related"
                            }
                          </span>

                        </div>

                      )
                    )}

                  </div>

                  <div className="network-center">

                    <div className="network-node primary-node">

                      <strong>
                        {
                          primaryStandard.number ||
                          "Not available"
                        }
                      </strong>

                      <span>
                        {
                          t(
                            "primary"
                          )
                        }{" "}
                        Standard
                      </span>

                    </div>

                  </div>

                </div>

                <div className="network-legend">

                  <span>
                    <i className="dot green-dot" />
                    {
                      t(
                        "primary"
                      )
                    }
                  </span>

                  <span>
                    <i className="dot blue-dot" />
                    Related
                  </span>

                  <span>
                    <i className="dot black-dot" />
                    Normative
                  </span>

                </div>

                <button
                  className="view-all-button"
                  onClick={
                    handleToggleRelationships
                  }
                  disabled={
                    relatedRecommendations.length ===
                    0
                  }
                >

                  {
                    relatedRecommendations.length >
                    0
                      ? showAllRelationships
                        ? "Show compact relationship view"
                        : "View all related standards"
                      : "No relationship data available"
                  }

                  <ChevronRight
                    size={15}
                    className={
                      showAllRelationships
                        ? "rotate-90"
                        : ""
                    }
                  />

                </button>

              </section>

              <section className="result-card compliance-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      {
                        t(
                          "certification"
                        )
                      }{" "}
                      & COMPLIANCE
                    </span>

                    <h2>
                      {
                        t(
                          "complianceRequirements"
                        )
                      }
                    </h2>

                  </div>

                  <ShieldCheck
                    size={20}
                  />

                </div>

                <div className="compliance-main">

                  <div className="compliance-heading">

                    <strong>
                      {
                        t(
                          "bisCertification"
                        )
                      }
                    </strong>

                    <span>
                      {
                        analysisData
                          ?.certification
                          ?.applicable
                          ? `✓ ${t(
                              "applicable"
                            ).toUpperCase()}`
                          : "! NOT ESTABLISHED"
                      }
                    </span>

                  </div>

                  <p>
                    {
                      analysisData
                        ?.certification
                        ?.note ||
                      "Certification status is limited to evidence available in the current knowledge base."
                    }
                  </p>

                </div>

                <div className="compliance-list">

                  {(
                    analysisData
                      ?.certification
                      ?.evidence ||
                    []
                  ).length > 0 ? (

                    analysisData.certification.evidence
                      .slice(0, 5)
                      .map(
                        (
                          item,
                          index
                        ) => (

                          <div
                            key={
                              item.id ||
                              `${item.number}-${index}`
                            }
                          >

                            <span>
                              {
                                item.number ||
                                "Certification evidence"
                              }

                              {
                                item.title
                                  ? ` — ${item.title}`
                                  : ""
                              }
                            </span>

                            <Check size={15} />

                          </div>

                        )
                      )

                  ) : (

                    <div>

                      <span>
                        No certification evidence was returned for the selected standard family.
                      </span>

                      <AlertTriangle
                        size={15}
                      />

                    </div>
                  )}

                </div>

              </section>

            </div>

            <div className="bottom-results-grid">

              <section className="result-card why-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      EXPLANATION
                    </span>

                    <h2>
                      {
                        t(
                          "whyRecommended"
                        )
                      }
                    </h2>

                  </div>

                  <Sparkles
                    size={19}
                  />

                </div>

                <div className="why-list">

                  {(
                    analysisData?.reasons ||
                    []
                  ).length > 0 ? (

                    analysisData.reasons.map(
                      (
                        reason,
                        index
                      ) => (

                        <div
                          key={`${reason}-${index}`}
                        >

                          <CheckCircle2
                            size={16}
                          />

                          <span>
                            {reason}
                          </span>

                        </div>

                      )
                    )

                  ) : (

                    <div>

                      <AlertTriangle
                        size={16}
                      />

                      <span>
                        No detailed recommendation reasons were returned.
                      </span>

                    </div>
                  )}

                </div>

              </section>

              <section className="result-card match-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      MATCH DISTRIBUTION
                    </span>

                    <h2>
                      Relevance Analysis
                    </h2>

                  </div>

                </div>

                <div className="match-content">

                  <div className="score-ring">

                    <div>

                      <strong>
                        {
                          primaryStandard.match ||
                          95
                        }%
                      </strong>

                      <span>
                        {
                          t(
                            "match"
                          )
                        }
                      </span>

                    </div>

                  </div>

                  <div className="match-breakdown">

                    <div>
                      <i />
                      Keyword Coverage

                      <strong>
                        {
                          primaryStandard
                            .matchBreakdown
                            ?.tokenCoverage ??
                          "—"
                        }%
                      </strong>
                    </div>

                    <div>
                      <i />
                      Title Match

                      <strong>
                        {
                          primaryStandard
                            .matchBreakdown
                            ?.titleCoverage ??
                          "—"
                        }%
                      </strong>
                    </div>

                    <div>
                      <i />
                      Content Match

                      <strong>
                        {
                          primaryStandard
                            .matchBreakdown
                            ?.contentCoverage ??
                          "—"
                        }%
                      </strong>
                    </div>

                    <div>
                      <i />
                      Application Match

                      <strong>
                        {
                          primaryStandard
                            .matchBreakdown
                            ?.applicationMatch ??
                          "—"
                        }%
                      </strong>
                    </div>

                    <div>
                      <i />
                      Environment Match

                      <strong>
                        {
                          primaryStandard
                            .matchBreakdown
                            ?.environmentMatch ??
                          "—"
                        }%
                      </strong>
                    </div>

                  </div>

                </div>

              </section>

              <section className="result-card status-card">

                <div className="result-card-header">

                  <div>

                    <span className="section-label">
                      {
                        t(
                          "standardStatus"
                        )
                      }
                    </span>

                    <h2>
                      {
                        t(
                          "versionInformation"
                        )
                      }
                    </h2>

                  </div>

                  <CalendarDays
                    size={19}
                  />

                </div>

                <div className="status-standard">

                  <strong>
                    {
                      primaryStandard.number
                    }
                  </strong>

                  <span className="status-current">
                    ●{" "}
                    {
                      t(
                        "current"
                      ).toUpperCase()
                    }
                  </span>

                </div>

                <div className="status-data">

                  <div>

                    <span>
                      Published / Edition
                    </span>

                    <strong>
                      {
                        primaryStandard.date ||
                        analysisData
                          ?.version
                          ?.currentEdition ||
                        "Not specified"
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Revision
                    </span>

                    <strong>
                      {
                        primaryStandard
                          .statusParsed
                          ?.revision ||
                        analysisData
                          ?.version
                          ?.revision ||
                        "Not specified"
                      }
                    </strong>

                  </div>

                  <div>

                    <span>
                      Evidence
                    </span>

                    <strong>
                      {
                        verificationLabel
                      }
                    </strong>

                  </div>

                </div>

                <button
                  className="view-standard-link"
                  onClick={
                    handleViewStandard
                  }
                >
                  View Standard
                  <ChevronRight
                    size={14}
                  />
                </button>

              </section>

            </div>

            <section className="actions-card">

              <div>

                <span className="section-label">
                  ACTIONS
                </span>

                <h2>
                  {
                    t(
                      "readyToUse"
                    )
                  }
                </h2>

                <p>
                  {
                    t(
                      "generateDescription"
                    )
                  }
                </p>

              </div>

              <div className="actions-buttons">

                <button
                  onClick={
                    handleGenerateSpecification
                  }
                >
                  <FileText
                    size={17}
                  />
                  Generate Specification
                </button>

                <button
                  onClick={
                    handleGenerateReport
                  }
                  disabled={
                    generatingReport
                  }
                  className="primary-action"
                >
                  <Download
                    size={17}
                  />

                  {
                    generatingReport
                      ? t("generating")
                      : t(
                          "generateReport"
                        )
                  }

                </button>

                <button
                  onClick={() =>
                    handleSaveStandard(
                      primaryStandard
                    )
                  }
                >
                  <Bookmark
                    size={17}
                  />

                  {
                    savedStandards.some(
                      (item) =>
                        item.id ===
                          primaryStandard.id ||
                        (!item.id &&
                          item.number ===
                            primaryStandard.number)
                    )
                      ? t("savedToMyList")
                      : t("saveToMyList")
                  }

                </button>

                <button
                  onClick={
                    handleShareResults
                  }
                >
                  <Share2
                    size={17}
                  />
                  Share Results
                </button>

              </div>

            </section>

          </section>

        ) : showStandardsLibrary ? (

          /* =================================================
             STANDARDS LIBRARY
          ================================================= */

          <section className="page-container">

            <div className="page-heading-row">

              <div>

                <span className="section-label">
                  BROWSE
                </span>

                <h2>
                  {
                    t(
                      "standards"
                    )
                  }
                </h2>

                <p>
                  Search the Indian Standards available for analysis.
                </p>

              </div>

              <div>

                <span className="library-source-note">
                  Live dataset •{" "}
                  {
                    standardsLibrary.length.toLocaleString()
                  }{" "}
                  loaded
                </span>

              </div>

            </div>

            <div className="library-search">

              <Search size={16} />

              <input
                type="text"
                value={
                  librarySearch
                }
                onChange={(e) =>
                  setLibrarySearch(
                    e.target.value
                  )
                }
                placeholder="Search by standard number, title or category..."
              />

            </div>

            {standardsLoading ? (

              <div className="empty-state">

                <div className="loading-spinner" />

                <h3>
                  Loading Indian Standards...
                </h3>

                <p>
                  Fetching standards from the BIS knowledge base.
                </p>

              </div>

            ) : standardsError ? (

              <div className="empty-state">

                <div className="empty-icon">
                  <AlertTriangle
                    size={28}
                  />
                </div>

                <h3>
                  Unable to load standards
                </h3>

                <p>
                  {
                    standardsError
                  }
                </p>

                <button
                  className="primary-action large"
                  onClick={
                    fetchStandardsLibrary
                  }
                >
                  <Search size={17} />
                  Retry
                </button>

              </div>

            ) : filteredStandards.length ===
              0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  <BookOpen
                    size={28}
                  />
                </div>

                <h3>
                  No standards match your search
                </h3>

                <p>
                  Try a different keyword or standard number.
                </p>

              </div>

            ) : (

              <div className="library-grid">

                {filteredStandards.map(
                  (
                    standard,
                    index
                  ) => (

                    <div
                      className="library-card"
                      key={
                        standard.id ||
                        `${standard.number}-${index}`
                      }
                    >

                      <div className="library-card-top">

                        <span className="library-tag">
                          {
                            standard.category ||
                            "Indian Standard"
                          }
                        </span>

                        {standard.status && (
                          <span className="library-match">
                            {
                              standard.status
                            }
                          </span>
                        )}

                      </div>

                      <h3>
                        {
                          standard.number
                        }
                      </h3>

                      <p>
                        {
                          standard.title
                        }
                      </p>

                      {standard.documentType && (
                        <small className="library-document-type">
                          {
                            standard.documentType
                          }
                        </small>
                      )}

                      <button
                        className="view-standard-link"
                        onClick={() =>
                          handleViewLibraryStandard(
                            standard
                          )
                        }
                      >
                        View Details
                        <ChevronRight
                          size={14}
                        />
                      </button>

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        ) : showSaved ? (

          /* =================================================
             MY SAVED STANDARDS
          ================================================= */

          <section className="page-container">
            <div className="page-heading-row">
              <div>
                <span className="section-label">
                  BOOKMARKS
                </span>
                <h2>{t("mySaved")}</h2>
                <p>
                  Standards you saved from analysis results or the Standards Library.
                </p>
              </div>
              <div>
                <span className="library-source-note">
                  {savedStandards.length} saved
                </span>
              </div>
            </div>

            {savedStandards.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <Bookmark size={28} />
                </div>
                <h3>No saved standards yet</h3>
                <p>
                  Open a standard and use "Save to My List" to keep it here.
                </p>
                <button
                  className="primary-action large"
                  onClick={handleStandardsLibrary}
                >
                  <BookOpen size={17} />
                  Browse Standards
                </button>
              </div>
            ) : (
              <div className="library-grid">
                {savedStandards.map((standard, index) => (
                  <div
                    className="library-card"
                    key={standard.id || `${standard.number || "saved"}-${index}`}
                  >
                    <div className="library-card-top">
                      <span className="library-tag">
                        {standard.category || "Indian Standard"}
                      </span>
                      <span className="library-match">{t("saved")}</span>
                    </div>
                    <h3>
                      {standard.number || "Standard number unavailable"}
                    </h3>
                    <p>
                      {standard.title || "No title available"}
                    </p>
                    {standard.documentType && (
                      <small className="library-document-type">
                        {standard.documentType}
                      </small>
                    )}
                    <div className="saved-card-actions">
                      <button
                        className="view-standard-link"
                        onClick={() => {
                          setLibraryStandard(standard);
                          setSelectedAnalysisStandard(null);
                          setStandardDetailsReturnView("saved");
                          setShowSaved(false);
                          setShowStandardDetails(true);
                        }}
                      >
                        View Details
                        <ChevronRight size={14} />
                      </button>
                      <button
                        className="saved-remove-button"
                        onClick={() => handleSaveStandard(standard)}
                      >
                        <Trash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

        ) : showSettings ? (

          /* =================================================
             SETTINGS
          ================================================= */

          <section className="page-container">

            <div className="page-heading-row">

              <div>

                <span className="section-label">
                  PREFERENCES
                </span>

                <h2>
                  {
                    t(
                      "settings"
                    )
                  }
                </h2>

                <p>
                  {t("settingsDescription")}
                </p>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    ACCOUNT
                  </span>

                  <h2>
                    Profile
                  </h2>

                </div>

                <UserCircle
                  size={20}
                />

              </div>

              <div className="settings-row">

                <div>

                  <strong>
                    {
                      t(
                        "procurementOfficer"
                      )
                    }
                  </strong>

                  <span>
                    Government of India
                  </span>

                </div>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    NOTIFICATIONS
                  </span>

                  <h2>
                    {t("alertsAndUpdates")}
                  </h2>

                </div>

                <Bell size={20} />

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    {t("emailNotifications")}
                  </strong>

                  <span>
                    {t("emailNotificationsDescription")}
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifyEmail
                      ? "on"
                      : ""
                  }`}
                  onClick={() =>
                    setNotifyEmail(
                      (v) => !v
                    )
                  }
                  aria-pressed={
                    notifyEmail
                  }
                >
                  <span />
                </button>

              </div>

              <div className="settings-toggle-row">

                <div>

                  <strong>
                    {t("inAppAlerts")}
                  </strong>

                  <span>
                    {t("inAppAlertsDescription")}
                  </span>

                </div>

                <button
                  type="button"
                  className={`toggle-switch ${
                    notifyInApp
                      ? "on"
                      : ""
                  }`}
                  onClick={() =>
                    setNotifyInApp(
                      (v) => !v
                    )
                  }
                  aria-pressed={
                    notifyInApp
                  }
                >
                  <span />
                </button>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    LANGUAGE
                  </span>

                  <h2>
                    {t("defaultInterfaceLanguage")}
                  </h2>

                </div>

                <Globe size={20} />

              </div>

              <div className="language-control">

                <Globe size={17} />

                <div>

                  <span>
                    {
                      t(
                        "interfaceLanguage"
                      )
                    }
                  </span>

                  <select
                    value={
                      recommendationLanguage
                    }
                    onChange={(e) =>
                      setRecommendationLanguage(
                        e.target.value
                      )
                    }
                  >
                    {languages.map(
                      (item) => (
                        <option
                          key={
                            item.code
                          }
                          value={
                            item.code
                          }
                        >
                          {
                            item.name
                          }
                        </option>
                      )
                    )}
                  </select>

                </div>

              </div>

            </div>

            <div className="settings-save-row">

              {settingsSaved && (
                <span className="settings-saved-note">

                  <CheckCircle2
                    size={14}
                  />

                  {t("preferencesSaved")}

                </span>
              )}

              <button
                className="primary-action"
                onClick={
                  handleSaveSettings
                }
              >
                {t("saveChanges")}
              </button>

            </div>

          </section>

        ) : showAlerts ? (

          /* =================================================
             ALERTS
          ================================================= */

          <section className="page-container">

            <div className="page-heading-row">

              <div>

                <span className="section-label">
                  {t("notifications").toUpperCase()}
                </span>

                <h2>
                  {t("alerts")}
                </h2>

                <p>
                  {t("alertsDescription")}
                </p>

              </div>

              {unreadAlertsCount >
                0 && (
                <button
                  className="secondary-action"
                  onClick={
                    markAllAlertsRead
                  }
                >
                  {t("markAllAsRead")}
                </button>
              )}

            </div>

            {alerts.length ===
            0 ? (

              <div className="empty-state">

                <div className="empty-icon">
                  <Bell size={28} />
                </div>

                <h3>
                  {t("noAlertsYet")}
                </h3>

                <p>
                  {t("alertsEmptyDescription")}
                </p>

              </div>

            ) : (

              <div className="history-list">

                {alerts.map(
                  (alert) => (

                    <div
                      className={`alert-card ${
                        alert.read
                          ? ""
                          : "alert-unread"
                      }`}
                      key={alert.id}
                    >

                      <div className="alert-icon">
                        <Bell
                          size={18}
                        />
                      </div>

                      <div className="history-content">

                        <div className="history-title-row">

                          <h3>
                            {getAlertText(alert).title}
                          </h3>

                          {!alert.read && (
                            <span className="alert-dot" />
                          )}

                        </div>

                        <p>
                          {getAlertText(alert).description}
                        </p>

                        <div className="history-meta">

                          <span>
                            {getAlertText(alert).time}
                          </span>

                        </div>

                      </div>

                      {!alert.read && (
                        <button
                          className="secondary-action"
                          onClick={() =>
                            markAlertRead(
                              alert.id
                            )
                          }
                        >
                          {t("markRead")}
                        </button>
                      )}

                    </div>

                  )
                )}

              </div>

            )}

          </section>

        ) : showHelp ? (

          /* =================================================
             HELP & GUIDE
          ================================================= */

          <section className="page-container">

            <div className="page-heading-row">

              <div>

                <span className="section-label">
                  SUPPORT
                </span>

                <h2>
                  {t("helpAndGuide")}
                </h2>

                <p>
                  Getting the most out of IS-ASSIST AI.
                </p>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    GETTING STARTED
                  </span>

                  <h2>
                    How it works
                  </h2>

                </div>

                <Sparkles size={20} />

              </div>

              <div className="help-steps">

                <div>

                  <span>1</span>

                  <div>

                    <strong>
                      Describe your requirement
                    </strong>

                    <p>
                      Type or speak a product/technical description on the Dashboard - the more specific, the better.
                    </p>

                  </div>

                </div>

                <div>

                  <span>2</span>

                  <div>

                    <strong>
                      Answer clarifying questions
                    </strong>

                    <p>
                      If your requirement is light on detail, you'll be asked a couple of quick follow-ups before analysis runs.
                    </p>

                  </div>

                </div>

                <div>

                  <span>3</span>

                  <div>

                    <strong>
                      Review recommendations
                    </strong>

                    <p>
                      See the primary standard, related standards, and certification requirements for your product.
                    </p>

                  </div>

                </div>

                <div>

                  <span>4</span>

                  <div>

                    <strong>
                      Generate a report
                    </strong>

                    <p>
                      Download a procurement-ready PDF summarizing the recommended standards.
                    </p>

                  </div>

                </div>

              </div>

            </div>

            <div className="result-card">

              <div className="result-card-header">

                <div>

                  <span className="section-label">
                    FAQ
                  </span>

                  <h2>
                    Common Questions
                  </h2>

                </div>

                <CircleHelp
                  size={20}
                />

              </div>

              <div className="faq-list">

                <div>

                  <strong>
                    Can I upload a tender PDF instead of typing?
                  </strong>

                  <p>
                    Yes - use "Upload Tender (PDF)" on the Dashboard and the requirement will be extracted automatically.
                  </p>

                </div>

                <div>

                  <strong>
                    Can I delete a single history entry?
                  </strong>

                  <p>
                    Yes - open History and use the trash icon on any entry to remove just that one, or "Clear History" to remove all.
                  </p>

                </div>

                <div>

                  <strong>
                    What if the AI needs more information?
                  </strong>

                  <p>
                    It'll ask 2-3 quick clarifying questions (e.g. wattage, indoor/outdoor use) before running the full analysis.
                  </p>

                </div>

              </div>

            </div>

          </section>

        ) : (

          /* =================================================
             DASHBOARD
          ================================================= */

          <section className="reference-dashboard">
            <section className="reference-hero page-container">
              <div className="reference-hero-copy">
                <div className="reference-eyebrow"><span></span>{t("heroEyebrow")}</div>
                <h2>{t("heroTitleLine1")}<br /><em>{t("heroTitleEm")}</em></h2>
                <p>{t("heroSubtext")}</p>
                <div className="reference-hero-tags">
                  <span><CheckCircle2 size={14} /> {t("heroTagNoWrongDoors")}</span>
                  <span><CalendarDays size={14} /> {t("heroTagClearSteps")}</span>
                </div>
              </div>
              <div className="reference-reassurance">
                <div className="reference-reassurance-orbit"></div>
                <span className="reference-card-label">{t("reassuranceLabel")}</span>
                <h3>{t("reassuranceTitle")}</h3>
                <div className="reference-reassurance-divider"></div>
                <div className="reference-reassurance-foot">
                  <span className="reference-help-circle"><CircleHelp size={17} /></span>
                  <p>{t("reassuranceText")}</p>
                </div>
              </div>
            </section>

            <section className="reference-pathway page-container">
              <div className="reference-section-heading">
                <div>
                  <span className="reference-section-number">{t("pathwaySectionNumber")}</span>
                  <h2>{t("pathwayHeading")}</h2>
                </div>
                <p>{t("pathwaySubtext")}</p>
              </div>

              <div className="reference-pathway-grid">
                <button type="button" className="reference-pathway-card selected" onClick={handleCertificationJourney}>
                  <span className="reference-selected">✓ {t("pathwaySelected")}</span>
                  <div className="reference-path-icon gold"><Award size={22} /></div>
                  <span className="reference-card-label">{t("pathwayCertifyLabel")}</span>
                  <h3>{t("pathwayCertifyTitle")}</h3>
                  <p>{t("pathwayCertifyText")}</p>
                  <strong>{t("pathwayCertifyCta")} <ArrowRight size={16} /></strong>
                </button>

                <button type="button" className="reference-pathway-card" onClick={handleStandardsLibrary}>
                  <div className="reference-path-icon teal"><BookOpen size={22} /></div>
                  <span className="reference-card-label">{t("pathwayStandardLabel")}</span>
                  <h3>{t("pathwayStandardTitle")}</h3>
                  <p>{t("pathwayStandardText")}</p>
                  <strong>{t("pathwayStandardCta")} <ArrowRight size={16} /></strong>
                </button>

                <button type="button" className="reference-pathway-card" onClick={handleHistory}>
                  <div className="reference-path-icon rose"><ClipboardCheck size={22} /></div>
                  <span className="reference-card-label">{t("pathwayTrackLabel")}</span>
                  <h3>{t("pathwayTrackTitle")}</h3>
                  <p>{t("pathwayTrackText")}</p>
                  <strong>{t("pathwayTrackCta")} <ArrowRight size={16} /></strong>
                </button>

                <button type="button" className="reference-pathway-card" onClick={handleHelp}>
                  <div className="reference-path-icon slate"><CircleHelp size={22} /></div>
                  <span className="reference-card-label">{t("pathwayHelpLabel")}</span>
                  <h3>{t("pathwayHelpTitle")}</h3>
                  <p>{t("pathwayHelpText")}</p>
                  <strong>{t("pathwayHelpCta")} <ArrowRight size={16} /></strong>
                </button>
              </div>

              <div className="reference-pathway-note"><span><ArrowRight size={16} /></span>{t("pathwayNote")}</div>
            </section>

            <section className="reference-search-area page-container">
              <div className="reference-search-card">
                <span className="reference-section-number light">{t("searchSectionNumber")}</span>
                <h2>{t("searchHeading")}</h2>
                <p>{t("searchSubtext")}</p>
                <div className="reference-search-row">
                  <div className="reference-search-input">
                    <Search size={18} />
                    <input value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleStandardsLibrary(); }} placeholder={t("searchPlaceholder")} />
                  </div>
                  <button type="button" onClick={handleStandardsLibrary}>{t("searchButton")} <ArrowRight size={16} /></button>
                </div>
                <div className="reference-popular-searches">
                  <span>{t("popularSearchesLabel")}</span>
                  <button type="button" onClick={() => { setLibrarySearch("ISI mark"); handleStandardsLibrary(); }}>{t("popularSearchISI")}</button>
                  <button type="button" onClick={() => { setLibrarySearch("BIS licence"); handleStandardsLibrary(); }}>{t("popularSearchLicence")}</button>
                  <button type="button" onClick={() => { setLibrarySearch("IS 302"); handleStandardsLibrary(); }}>{t("popularSearchIS302")}</button>
                </div>
              </div>

              <div className="reference-selected-route">
                <span className="reference-section-number">{t("selectedRouteLabel")}</span>
                <div className="reference-route-header">
                  <div>
                    <h3>{t("pathwayCertifyTitle")}</h3>
                    <p>{t("selectedRouteText")}</p>
                  </div>
                  <span className="reference-route-check"><Check size={16} /></span>
                </div>
                <button type="button" onClick={handleCertificationJourney}>{t("continueRoute")} <ArrowRight size={17} /></button>
              </div>
            </section>

            <section className="reference-requirement-section page-container">
              <div className="reference-section-heading compact">
                <div>
                  <span className="reference-section-number">{t("requirementSectionNumber")}</span>
                  <h2>{t("requirementHeading")}</h2>
                </div>
                <p>{t("requirementSubtext")}</p>
              </div>

              <div className="reference-requirement-card">
                <div className="reference-requirement-top">
                  <div><span className="reference-card-label">{t("requirementCardLabel")}</span><h3>{t("requirementCardTitle")}</h3></div>
                  <span className="reference-ai-pill"><Sparkles size={13} /> {t("aiPowered")}</span>
                </div>

                <div className="reference-language-row">
                  <label><span>{t("inputLanguage")}</span><div><Globe size={15} /><select value={inputLanguage} onChange={(e) => setInputLanguage(e.target.value)}>{languages.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div></label>
                  <label><span>{t("interfaceLanguage")}</span><div><Sparkles size={15} /><select value={recommendationLanguage} onChange={(e) => setRecommendationLanguage(e.target.value)}>{languages.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div></label>
                </div>

                <div className="reference-textarea-wrap">
                  <textarea className="requirement-input reference-requirement-input" value={requirement} onChange={(e) => setRequirement(e.target.value)} placeholder={tInput("requirementPlaceholder")} />
                  <div className="input-counter">{requirement.length} / 2000</div>
                  <button type="button" className={`voice-button ${listening ? "voice-listening" : ""}`} onClick={handleVoiceInput} title={listening ? t("stopListening") : t("speakRequirement")}>{listening ? <MicOff size={18} /> : <Mic size={18} />}</button>
                </div>

                {listening && <div className="voice-status reference-voice-status"><span />{t("listening")}<small>{t("speakYourRequirement")}</small></div>}

                {showClarificationPrompt && (
                  <div className="clarification-card pre-analysis-clarification">
                    <div className="clarification-icon"><CircleHelp size={21} /></div>
                    <div className="clarification-content">
                      <span className="section-label">AI CLARIFICATION</span>
                      <h3>A few details would sharpen this recommendation</h3>
                      <p>Your requirement looks a little light on specifics. Answer what you can (or skip) and we will factor it into the analysis.</p>
                      <div className="clarification-list clarification-inputs">
                        {clarificationQuestions.map((question, index) => (
                          <div key={question} className="clarification-question-row"><span>{index + 1}</span><div className="clarification-question-body"><label>{question}</label><input type="text" value={clarificationAnswers[question] || ""} onChange={(e) => handleClarificationAnswerChange(question, e.target.value)} placeholder="Type your answer (optional)" /></div></div>
                        ))}
                      </div>
                      <div className="clarification-actions"><button type="button" className="secondary-action" onClick={handleClarificationSkip}>Skip &amp; analyze anyway</button><button type="button" className="primary-action" onClick={handleClarificationContinue}>Continue analysis <ChevronRight size={15} /></button></div>
                    </div>
                  </div>
                )}

                <div className="reference-analyze-footer">
                  <p><strong>{t("requirementTip")}</strong> {t("requirementTipText")}</p>
                  <button className="reference-gold-button" onClick={handleAnalyze} disabled={analyzing}>{analyzing ? <span className="button-spinner" /> : <Sparkles size={16} />}{analyzing ? t("analyzing") : t("analyzeRequirement")}{!analyzing && <ArrowRight size={16} />}</button>
                </div>
              </div>
            </section>

            <section className="reference-tender-section page-container">
              <div className="reference-section-heading compact">
                <div><span className="reference-section-number">{t("tenderSectionNumber")}</span><h2>{t("tenderHeading")}</h2></div>
                <p>{t("tenderSubtext")}</p>
              </div>
              <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={handleFileChange} hidden />
              <div className={`reference-upload-card ${selectedFile ? "has-file" : ""}`} onClick={handlePdfUpload}>
                {selectedFile ? <><div className="reference-upload-icon success"><FileText size={25} /></div><strong>{selectedFile.name}</strong><span>{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</span>{pdfSuccess && <span className="pdf-success"><CheckCircle2 size={15} /> {t("tenderProcessed")}</span>}</> : <><div className="reference-upload-icon"><UploadCloud size={27} /></div><strong>{t("tenderDropText")}</strong><span>{t("tenderOrClick")}</span><small>{t("tenderSupportedInfo")}</small></>}
              </div>
              <button className="reference-dark-button full" onClick={handlePdfAnalyze} disabled={!selectedFile || pdfAnalyzing}>{pdfAnalyzing ? <span className="button-spinner" /> : <Sparkles size={16} />}{pdfAnalyzing ? t("tenderProcessing") : t("tenderAnalyzeButton")}{!pdfAnalyzing && <ArrowRight size={16} />}</button>
            </section>

            <section className="reference-stats page-container">
              <div><span>{t("statsIndianStandardsLabel")}</span><strong>{standardsLibrary.length > 0 ? standardsLibrary.length.toLocaleString() : "LIVE"}</strong><small>{t("availableForAnalysis")}</small></div>
              <div><span>{t("statsAiRecommendationsLabel")}</span><strong>LIVE</strong><small>{t("statsContextAware")}</small></div>
              <div><span>{t("statsSavedStandardsLabel")}</span><strong>{savedStandards.length}</strong><small>{t("statsReadyAccess")}</small></div>
            </section>
          </section>

        )}

      </main>

      {/* =====================================================
          CONTEXT-AWARE AI CHATBOT
      ===================================================== */}

      <AIChatbot
        requirement={requirement}
        analysisData={analysisData}
        onRequirementUpdate={
          setRequirement
        }
        onViewStandard={
          handleViewStandard
        }
        onOpenCertification={
          handleCertificationJourney
        }
      />

    </div>
  );
}

export default App;