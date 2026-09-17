import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Send,
  X,
  MessageCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  FileText,
  Sparkles,
  Mic,
  MicOff,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  ListChecks,
} from "lucide-react";

import "./AIChatbot.css";

const GREETING =
  "Hello! I'm the IS-ASSIST AI Assistant. I can help you understand Indian Standards and improve your procurement requirement. Tap a question below or type your own.";

// --------------------------------------------------
// SUGGESTED QUESTION LIBRARY
// Every question the assistant knows how to answer,
// keyed so responses can recommend relevant follow-ups.
// --------------------------------------------------
const QUESTION_LIBRARY = {
  standard: {
    label: "Recommended standard",
    question: "What standard is recommended for my requirement?",
    icon: FileText,
  },
  why: {
    label: "Why this standard?",
    question: "Why was this standard recommended?",
    icon: Sparkles,
  },
  related: {
    label: "Related standards",
    question: "Show me related standards",
    icon: ListChecks,
  },
  requirement: {
    label: "What you understood",
    question: "What did you understand from my requirement?",
    icon: HelpCircle,
  },
  certification: {
    label: "Certification needed?",
    question: "Do I need BIS certification for this?",
    icon: ShieldCheck,
  },
  next: {
    label: "Next steps",
    question: "What should I do next?",
    icon: ExternalLink,
  },
  bis: {
    label: "About BIS",
    question: "Tell me about the BIS certification process",
    icon: ShieldCheck,
  },
  procurement: {
    label: "Improve requirement",
    question: "How can I write a better procurement requirement?",
    icon: HelpCircle,
  },
  help: {
    label: "What can you do?",
    question: "What can you help me with?",
    icon: Sparkles,
  },
};

function AIChatbot({
  requirement,
  analysisData,
  onRequirementUpdate,
  onViewStandard,
  onOpenCertification,
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeSuggestions, setActiveSuggestions] = useState(null);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [feedback, setFeedback] = useState({});

  const [messages, setMessages] = useState([
    { id: 1, sender: "ai", text: GREETING, actions: [], timestamp: Date.now() },
  ]);

  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);

  const primaryStandard = analysisData?.primaryStandard || null;

  const relatedStandards = useMemo(() => {
    return Array.isArray(analysisData?.relatedStandards)
      ? analysisData.relatedStandards.filter(Boolean)
      : [];
  }, [analysisData]);

  const certification = analysisData?.certification || null;

  const currentProduct =
    analysisData?.product || analysisData?.extractedRequirements?.product || "";

  const currentApplication = analysisData?.application || "";
  const currentEnvironment = analysisData?.environment || "";

  const primaryNumber = primaryStandard?.number || "No standard identified yet";
  const primaryTitle = primaryStandard?.title || "";
  const primaryStatus = primaryStandard?.status || "Unknown";
  const primaryMatch = primaryStandard?.match ?? null;

  // --------------------------------------------------
  // AUTO-SCROLL
  // --------------------------------------------------

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // --------------------------------------------------
  // VOICE INPUT SETUP
  // --------------------------------------------------

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-IN";

    recognition.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || "";
      setMessage(transcript);
    };

    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);

    recognitionRef.current = recognition;
    setVoiceSupported(true);
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (listening) {
      recognitionRef.current.stop();
      setListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch {
        setListening(false);
      }
    }
  };

  // --------------------------------------------------
  // FORMAT HELPERS
  // --------------------------------------------------

  const formatMatch = (value) => {
    if (value === null || value === undefined) return "Not available";
    return `${value}%`;
  };

  const formatTime = (ts) => {
    try {
      return new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const getRouteText = () => {
    if (!certification) {
      return "Certification route has not been analyzed yet.";
    }

    if (certification.applicable === true) {
      return "Certification / conformity requirements may apply. Please verify the exact route against the current official BIS requirements.";
    }

    if (certification.applicable === false) {
      return "No certification applicability was established from the current evidence.";
    }

    return certification.note || "Certification applicability requires verification.";
  };

  const getMatchBadge = (value) => {
    if (value === null || value === undefined) return null;
    const tone = value >= 80 ? "good" : value >= 50 ? "warn" : "low";
    return { label: `${value}% match`, tone };
  };

  const getDefaultSuggestions = () => {
    if (analysisData && primaryStandard) {
      return ["standard", "why", "certification", "next"];
    }
    return ["requirement", "procurement", "bis", "help"];
  };

  // --------------------------------------------------
  // DEMO / CONTEXT-AWARE RESPONSE ENGINE
  // --------------------------------------------------

  const getAIResponse = (question) => {
    const text = question.toLowerCase();

    const respond = (responseText, opts = {}) => ({
      text: responseText,
      actions: opts.actions || [],
      followUps: opts.followUps || [],
      badge: opts.badge || null,
    });

    // PRIMARY STANDARD
    if (
      text.includes("what standard") ||
      text.includes("which standard") ||
      text.includes("recommended standard") ||
      text.includes("applicable standard") ||
      text.includes("is code")
    ) {
      if (!analysisData || !primaryStandard) {
        return respond(
          "I don't have an analysis result yet. Enter your procurement requirement and click Analyze Requirement first.",
          { followUps: ["requirement", "procurement"] }
        );
      }

      return respond(
        `Your primary recommended standard is ${primaryNumber}` +
          (primaryTitle ? ` — ${primaryTitle}.` : ".") +
          `\n\nMatch score: ${formatMatch(primaryMatch)}` +
          `\nStatus: ${primaryStatus}.`,
        {
          actions: [{ label: "View Standard", type: "standard" }],
          followUps: ["why", "related", "certification"],
          badge: getMatchBadge(primaryMatch),
        }
      );
    }

    // WHY RECOMMENDED
    if (
      text.includes("why") &&
      (text.includes("recommend") || text.includes("standard") || text.includes("match"))
    ) {
      if (!analysisData || !primaryStandard) {
        return respond(
          "Analyze a procurement requirement first. Then I can explain why the primary standard was ranked highest.",
          { followUps: ["standard"] }
        );
      }

      const reasons = Array.isArray(analysisData.reasons)
        ? analysisData.reasons.filter(Boolean)
        : [];

      const breakdown = primaryStandard.matchBreakdown || null;

      let response = `IS-ASSIST ranked ${primaryNumber} as the primary match.`;

      if (reasons.length) {
        response +=
          "\n\nWhy it matched:\n" +
          reasons.slice(0, 5).map((reason) => `• ${reason}`).join("\n");
      }

      if (breakdown) {
        response +=
          "\n\nMatch breakdown:" +
          `\n• Token match: ${formatMatch(breakdown.token)}` +
          `\n• Title match: ${formatMatch(breakdown.title)}` +
          `\n• Content match: ${formatMatch(breakdown.content)}` +
          `\n• Application match: ${formatMatch(breakdown.application)}` +
          `\n• Environment match: ${formatMatch(breakdown.environment)}`;
      }

      return respond(response, {
        actions: [{ label: "View Standard", type: "standard" }],
        followUps: ["related", "certification", "next"],
        badge: getMatchBadge(primaryMatch),
      });
    }

    // RELATED STANDARDS
    if (
      text.includes("related standard") ||
      text.includes("other standards") ||
      text.includes("similar standards")
    ) {
      if (!relatedStandards.length) {
        return respond(
          "No related standards are currently available in this analysis result.",
          { followUps: ["standard", "why"] }
        );
      }

      const relatedText = relatedStandards
        .slice(0, 5)
        .map((standard, index) => {
          const match =
            standard.match !== undefined && standard.match !== null
              ? ` (${standard.match}% match)`
              : "";

          return `${index + 1}. ${standard.number || "Standard"}${
            standard.title ? ` — ${standard.title}` : ""
          }${match}`;
        })
        .join("\n");

      return respond(
        `Here are the related standards from the current analysis:\n\n${relatedText}`,
        { followUps: ["why", "certification"] }
      );
    }

    // PRODUCT / APPLICATION
    if (
      text.includes("what did you understand") ||
      text.includes("what did you extract") ||
      text.includes("understand my requirement") ||
      text.includes("my requirement")
    ) {
      if (!analysisData) {
        return respond(
          "I don't have a completed analysis result yet. Please analyze the requirement first.",
          { followUps: ["procurement"] }
        );
      }

      let response = "Here's what IS-ASSIST currently understands:\n";

      if (currentProduct) response += `\n• Product: ${currentProduct}`;
      if (currentApplication) response += `\n• Application: ${currentApplication}`;
      if (currentEnvironment) response += `\n• Environment: ${currentEnvironment}`;
      if (analysisData.power) response += `\n• Power: ${analysisData.power}`;
      if (analysisData.keyRequirements)
        response += `\n• Key requirements: ${analysisData.keyRequirements}`;

      return respond(response, { followUps: ["standard", "next"] });
    }

    // CERTIFICATION
    if (
      text.includes("certification") ||
      text.includes("certified") ||
      text.includes("licence") ||
      text.includes("license")
    ) {
      return respond(
        getRouteText() +
          "\n\nI will not claim that certification is mandatory unless the available authoritative evidence supports that conclusion.",
        {
          actions: [{ label: "Open Certification Journey", type: "certification" }],
          followUps: ["next", "bis"],
        }
      );
    }

    // WHAT NEXT
    if (
      text.includes("what next") ||
      text.includes("next step") ||
      text.includes("what should i do") ||
      text.includes("where do i start")
    ) {
      if (!analysisData) {
        return respond(
          "Start by entering the procurement requirement and analyzing it. Once a standard is identified, I can guide you to the next stage.",
          { followUps: ["requirement"] }
        );
      }

      return respond(
        `Your current primary standard is ${primaryNumber}.\n\n` +
          `Recommended next step: review the standard details and then open the Certification Journey to evaluate the applicable conformity/certification route.`,
        {
          actions: [
            { label: "View Standard", type: "standard" },
            { label: "Certification Journey", type: "certification" },
          ],
          followUps: ["certification", "standard"],
        }
      );
    }

    // BIS
    if (text.includes("bis") || text.includes("bureau of indian standards")) {
      return respond(
        "BIS information should be checked against current official sources for certification, licensing and conformity requirements. IS-ASSIST keeps certification applicability separate from the standard recommendation so that unsupported claims are not presented as facts.",
        {
          actions: [{ label: "Open Certification Journey", type: "certification" }],
          followUps: ["certification"],
        }
      );
    }

    // PROCUREMENT / TENDER
    if (
      text.includes("procurement") ||
      text.includes("tender") ||
      text.includes("specification")
    ) {
      return respond(
        "For a stronger procurement requirement, include the product, key technical specifications, intended application, operating environment, quantity and any known compliance constraints.",
        { followUps: ["requirement", "standard"] }
      );
    }

    // HELP
    if (text.includes("help") || text.includes("what can you do")) {
      return respond(
        "I can help you with:\n\n" +
          "• Understanding the analyzed requirement\n" +
          "• Explaining the recommended standard\n" +
          "• Explaining why the standard was recommended\n" +
          "• Showing related standards\n" +
          "• Discussing certification / BIS verification\n" +
          "• Guiding you to the next step",
        { followUps: getDefaultSuggestions() }
      );
    }

    // DEFAULT
    if (analysisData && primaryStandard) {
      return respond(
        `For your current analysis, the primary standard is ${primaryNumber}. ` +
          "Ask me why it was recommended, what related standards were found, whether certification needs verification, or what you should do next.",
        { followUps: ["why", "related", "certification"] }
      );
    }

    return respond(
      "I can help with Indian Standards, procurement requirements, BIS certification and understanding your analysis results. Analyze a requirement first for context-aware answers.",
      { followUps: getDefaultSuggestions() }
    );
  };

  // --------------------------------------------------
  // ACTION HANDLER
  // --------------------------------------------------

  const handleAction = (action) => {
    if (!action) return;

    if (action.type === "standard" && primaryStandard && onViewStandard) {
      onViewStandard(primaryStandard);
      return;
    }

    if (action.type === "certification" && onOpenCertification) {
      onOpenCertification();
      return;
    }

    if (action.type === "standard") {
      addAIMessage(
        "The standard details are available from the current analysis result. Open the recommendation card to view the full standard details."
      );
      return;
    }

    if (action.type === "certification") {
      addAIMessage(
        "Open Certification Journey from the main application to continue the evidence-driven certification workflow."
      );
    }
  };

  // --------------------------------------------------
  // ADD MESSAGE
  // --------------------------------------------------

  const addAIMessage = (text, actions = [], followUps = [], badge = null) => {
    const aiMessage = {
      id: Date.now() + Math.random(),
      sender: "ai",
      text,
      actions,
      badge,
      timestamp: Date.now(),
    };

    setMessages((previous) => [...previous, aiMessage]);
    setActiveSuggestions(followUps.length ? followUps : getDefaultSuggestions());

    if (!open) {
      setUnreadCount((previous) => previous + 1);
    }
  };

  // --------------------------------------------------
  // SEND MESSAGE
  // --------------------------------------------------

  const handleSend = (overrideText) => {
    const trimmedMessage = (overrideText ?? message).trim();

    if (!trimmedMessage) return;

    const userMessage = {
      id: Date.now(),
      sender: "user",
      text: trimmedMessage,
      timestamp: Date.now(),
    };

    setMessages((previous) => [...previous, userMessage]);
    setMessage("");
    setActiveSuggestions(null);
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(trimmedMessage);
      setIsTyping(false);
      addAIMessage(response.text, response.actions, response.followUps, response.badge);
    }, 500 + Math.random() * 350);
  };

  // --------------------------------------------------
  // ENTER KEY
  // --------------------------------------------------

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      handleSend();
    }
  };

  // --------------------------------------------------
  // COPY / FEEDBACK
  // --------------------------------------------------

  const handleCopy = (item) => {
    if (!navigator.clipboard) return;

    navigator.clipboard.writeText(item.text).then(() => {
      setCopiedId(item.id);
      setTimeout(() => setCopiedId(null), 1500);
    });
  };

  const handleFeedback = (id, type) => {
    setFeedback((previous) => ({
      ...previous,
      [id]: previous[id] === type ? null : type,
    }));
  };

  // --------------------------------------------------
  // CLEAR CHAT
  // --------------------------------------------------

  const handleClearChat = () => {
    setMessages([
      { id: Date.now(), sender: "ai", text: GREETING, actions: [], timestamp: Date.now() },
    ]);
    setActiveSuggestions(null);
    setFeedback({});
    setUnreadCount(0);
  };

  // --------------------------------------------------
  // CLARIFICATION
  // --------------------------------------------------

  const handleClarification = () => {
    if (!requirement || !requirement.trim()) {
      addAIMessage(
        "Please enter a procurement requirement first. I can then check whether additional information is required.",
        [],
        ["requirement"]
      );
      setOpen(true);
      return;
    }

    const text = requirement.toLowerCase();
    const questions = [];

    if (
      text.length < 30 ||
      (!text.includes("light") &&
        !text.includes("steel") &&
        !text.includes("pipe") &&
        !text.includes("cement") &&
        !text.includes("machine"))
    ) {
      questions.push("What is the exact product or equipment being procured?");
    }

    if (text.includes("light") && !text.match(/\d+\s*w/i)) {
      questions.push("What is the required power rating or wattage?");
    }

    if (
      !text.includes("road") &&
      !text.includes("indoor") &&
      !text.includes("outdoor") &&
      !text.includes("industrial") &&
      !text.includes("municipal")
    ) {
      questions.push("Where will the product be used? Please specify the application or environment.");
    }

    if (!text.match(/\d+\s*(nos|number|units|pieces)/i)) {
      questions.push("What quantity is required?");
    }

    if (!text.includes("bis") && !text.includes("certification")) {
      questions.push("Are there any known certifications or compliance requirements?");
    }

    if (!questions.length) {
      addAIMessage(
        "Your requirement contains enough information for a preliminary analysis. You can proceed with Analyze Requirement.",
        [],
        ["standard"]
      );
      setOpen(true);
      return;
    }

    const clarificationText =
      "Before I recommend standards, I need a few more details:\n\n" +
      questions.map((question, index) => `${index + 1}. ${question}`).join("\n");

    addAIMessage(clarificationText, [], ["requirement"]);
    setOpen(true);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  const suggestionsToShow = activeSuggestions || getDefaultSuggestions();

  return (
    <>
      {open && (
        <div className="ai-chat-window">
          {/* HEADER */}
          <div className="ai-chat-header">
            <div className="ai-chat-title">
              <div className="ai-chat-icon">
                <Bot size={20} />
              </div>

              <div>
                <strong>IS-ASSIST AI</strong>
                <span>
                  <span className="ai-live-dot" />
                  Standards Assistant
                </span>
              </div>
            </div>

            <div className="ai-chat-header-actions">
              <button
                className="chat-icon-button"
                onClick={handleClearChat}
                aria-label="Clear conversation"
                title="Clear conversation"
              >
                <RotateCcw size={16} />
              </button>

              <button
                className="chat-close-button"
                onClick={() => setOpen(false)}
                aria-label="Close chatbot"
              >
                <X size={19} />
              </button>
            </div>
          </div>

          {/* MESSAGES */}
          <div className="ai-chat-messages" aria-live="polite">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`chat-message ${
                  item.sender === "user" ? "user-message" : "ai-message"
                }`}
              >
                {item.sender === "ai" && (
                  <div className="message-avatar">
                    <Bot size={15} />
                  </div>
                )}

                <div>
                  <div className="message-content">
                    {item.badge && (
                      <span className={`match-badge match-${item.badge.tone}`}>
                        {item.badge.label}
                      </span>
                    )}

                    {item.text.split("\n").map((line, index) => (
                      <div key={index}>{line || <br />}</div>
                    ))}
                  </div>

                  {/* CONTEXT ACTIONS */}
                  {item.sender === "ai" && item.actions?.length > 0 && (
                    <div className="ai-chat-context-actions">
                      {item.actions.map((action, index) => (
                        <button
                          key={`${action.label}-${index}`}
                          type="button"
                          onClick={() => handleAction(action)}
                        >
                          {action.type === "standard" ? (
                            <FileText size={13} />
                          ) : (
                            <ShieldCheck size={13} />
                          )}
                          {action.label}
                          <ExternalLink size={12} />
                        </button>
                      ))}
                    </div>
                  )}

                  {/* FOOTER: timestamp + copy + feedback */}
                  <div
                    className={`message-footer ${
                      item.sender === "user" ? "footer-right" : ""
                    }`}
                  >
                    <span className="message-timestamp">{formatTime(item.timestamp)}</span>

                    {item.sender === "ai" && (
                      <div className="message-footer-actions">
                        <button
                          className="icon-btn"
                          onClick={() => handleCopy(item)}
                          aria-label="Copy message"
                          title="Copy"
                        >
                          {copiedId === item.id ? <Check size={12} /> : <Copy size={12} />}
                        </button>

                        <button
                          className={`icon-btn ${
                            feedback[item.id] === "up" ? "active-up" : ""
                          }`}
                          onClick={() => handleFeedback(item.id, "up")}
                          aria-label="Good response"
                          title="Helpful"
                        >
                          <ThumbsUp size={12} />
                        </button>

                        <button
                          className={`icon-btn ${
                            feedback[item.id] === "down" ? "active-down" : ""
                          }`}
                          onClick={() => handleFeedback(item.id, "down")}
                          aria-label="Poor response"
                          title="Not helpful"
                        >
                          <ThumbsDown size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="chat-message ai-message">
                <div className="message-avatar">
                  <Bot size={15} />
                </div>
                <div className="message-content typing-indicator">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* SUGGESTED QUESTIONS */}
          <div className="ai-chat-suggestions">
            <p className="ai-chat-suggestions-title">
              {messages.length <= 1 ? "Try asking" : "You might also ask"}
            </p>
            <div className="ai-chat-suggestions-list">
              {suggestionsToShow.map((key) => {
                const item = QUESTION_LIBRARY[key];
                if (!item) return null;
                const Icon = item.icon;

                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleSend(item.question)}
                  >
                    <Icon size={11} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* QUICK ACTION */}
          <div className="chat-quick-actions">
            <button onClick={handleClarification}>
              <HelpCircle size={15} />
              Check my requirement
            </button>
          </div>

          {/* INPUT */}
          <div className="ai-chat-input">
            {voiceSupported && (
              <button
                type="button"
                className={`mic-button ${listening ? "listening" : ""}`}
                onClick={toggleListening}
                aria-label={listening ? "Stop voice input" : "Start voice input"}
                title={listening ? "Stop voice input" : "Speak your question"}
              >
                {listening ? <MicOff size={16} /> : <Mic size={16} />}
              </button>
            )}

            <input
              type="text"
              placeholder={
                analysisData ? "Ask about your analysis..." : "Ask about Indian Standards..."
              }
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Ask IS-ASSIST AI"
            />

            <button
              onClick={() => handleSend()}
              disabled={!message.trim() || isTyping}
              aria-label="Send message"
            >
              <Send size={17} />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING BUTTON */}
      {!open && (
        <button
          className="ai-chat-floating-button"
          onClick={() => {
            setOpen(true);
            setUnreadCount(0);
          }}
        >
          <MessageCircle size={23} />
          <span>Chat with AI</span>
          {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
        </button>
      )}
    </>
  );
}

export default AIChatbot;