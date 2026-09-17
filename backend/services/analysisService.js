const fs = require("fs");
const path = require("path");

// ============================================================
// BIS KNOWLEDGE BASE
// ============================================================

const standardsPath = path.join(
  __dirname,
  "../data/bis_knowledge_v2.jsonl"
);

let knowledgeBase = [];

try {
  const raw = fs
    .readFileSync(standardsPath, "utf8")
    .replace(/^\uFEFF/, "");

  knowledgeBase = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      try {
        return JSON.parse(line);
      } catch (error) {
        console.error(
          `Invalid JSONL record at line ${index + 1}:`,
          error.message
        );

        return null;
      }
    })
    .filter(Boolean);

  console.log(
    `BIS knowledge base loaded: ${knowledgeBase.length} records`
  );
} catch (error) {
  console.error(
    "Unable to load BIS knowledge base:",
    error.message
  );
}

// ============================================================
// STOP WORDS
// ============================================================

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "for",
  "of",
  "to",
  "in",
  "on",
  "with",
  "from",
  "is",
  "are",
  "be",
  "this",
  "that",
  "these",
  "those",
  "was",
  "were",
  "will",
  "shall",
  "should",
  "must",
  "have",
  "has",
  "had",
  "into",
  "onto",
  "over",
  "under",
  "than",
  "then",
  "they",
  "their",
  "there",
  "here",
  "you",
  "your",
  "our",
  "its",
  "not",
  "can",
  "may",
  "also",
  "such",
  "using",
  "used",
  "use",
  "provide",
  "providing",
  "required",
  "requirement",
  "procurement",
  "supply",
  "purchase",
  "specified",
  "specification",
  "specifications",
  "suitable",
  "general",
  "application",
  "applications",
  "service",
  "services",
  "product",
  "products",
  "item",
  "items"
]);

// ============================================================
// SYNONYMS
// ============================================================

const SYNONYMS = new Map([
  ["lights", "light"],
  ["lighting", "light"],
  ["lamps", "lamp"],
  ["bulbs", "bulb"],
  ["luminaires", "luminaire"],
  ["roads", "road"],
  ["roadways", "road"],
  ["outdoors", "outdoor"],
  ["indoors", "indoor"],
  ["cables", "cable"],
  ["wires", "wire"],
  ["conductors", "conductor"],
  ["pipes", "pipe"],
  ["tubes", "tube"],
  ["bars", "bar"],
  ["rods", "rod"],
  ["toys", "toy"],
  ["batteries", "battery"],
  ["cells", "cell"]
]);

// ============================================================
// NORMALIZATION
// ============================================================

function normalizeText(text = "") {
  return String(text)
    .toLowerCase()
    .replace(/[^a-z0-9/.:()\-–\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalToken(token) {
  const clean = token
    .toLowerCase()
    .trim();

  if (SYNONYMS.has(clean)) {
    return SYNONYMS.get(clean);
  }

  if (
    clean.endsWith("ies") &&
    clean.length > 4
  ) {
    return `${clean.slice(0, -3)}y`;
  }

  if (
    clean.endsWith("s") &&
    !clean.endsWith("ss") &&
    clean.length > 3
  ) {
    return clean.slice(0, -1);
  }

  return clean;
}

function tokenize(text = "") {
  return normalizeText(text)
    .split(" ")
    .map(canonicalToken)
    .filter(
      (token) =>
        token.length > 2 &&
        !STOP_WORDS.has(token)
    );
}

function unique(values = []) {
  return [...new Set(values)];
}

// ============================================================
// WORD / PHRASE MATCHING
// ============================================================

function escapeRegex(text) {
  return text.replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

function containsWholeWord(
  text,
  word
) {
  return new RegExp(
    `\\b${escapeRegex(word)}\\b`,
    "i"
  ).test(text);
}

function phrasePresent(
  text,
  phrase
) {
  const phraseTokens =
    tokenize(phrase);

  if (!phraseTokens.length) {
    return false;
  }

  const textTokens =
    new Set(tokenize(text));

  return phraseTokens.every(
    (token) =>
      textTokens.has(token)
  );
}

// ============================================================
// STANDARD FAMILY
// ============================================================

function standardFamilyKey(
  value = ""
) {
  const match =
    normalizeText(value).match(
      /\bis\s*(\d+)/i
    );

  return match
    ? `IS ${match[1]}`
    : null;
}

// ============================================================
// STATUS
// ============================================================

function getStatus(record) {
  const parsed =
    record.status_parsed || {};

  const raw =
    record.status ||
    "Unknown";

  return {
    raw,

    isCurrent:
      typeof parsed.is_current ===
      "boolean"
        ? parsed.is_current
        : /current|in force/i.test(
            raw
          ),

    isMandatory:
      typeof parsed.is_mandatory ===
      "boolean"
        ? parsed.is_mandatory
        : /mandatory|qco|compulsory/i.test(
            raw
          ),

    isSuperseded:
      parsed.is_superseded === true,

    isWithdrawn:
      parsed.is_withdrawn === true,

    isSuspended:
      parsed.is_suspended === true,

    revision:
      parsed.revision || null,

    statusDate:
      parsed.status_date || null
  };
}

// ============================================================
// CATEGORY
// ============================================================

function getCategory(record) {
  return (
    record.category ||
    record.domain ||
    "Indian Standards"
  );
}

// ============================================================
// USABLE RECORDS
// ============================================================

function isUsableRecord(record) {
  if (!record) {
    return false;
  }

  if (!record.standard_number) {
    return false;
  }

  return (
    record.domain === "standards" ||
    record.domain === "certification" ||
    record.domain ===
      "mandatory_certifications" ||
    [
      "standard",
      "standard_catalog_entry",
      "product_manual",
      "gazette_notification"
    ].includes(
      record.document_type
    )
  );
}

// ============================================================
// SEARCHABLE FIELDS
// ============================================================

function getSearchFields(record) {
  return {
    number: normalizeText(
      record.standard_number || ""
    ),

    title: normalizeText(
      record.title || ""
    ),

    content: normalizeText(
      record.content || ""
    ),

    section: normalizeText(
      record.section || ""
    ),

    clause: normalizeText(
      record.clause || ""
    ),

    related: Array.isArray(
      record.related_standards
    )
      ? record.related_standards
          .map(normalizeText)
          .join(" ")
      : "",

    full: normalizeText(
      [
        record.standard_number,
        record.title,
        record.content,
        record.section,
        record.clause,
        Array.isArray(
          record.related_standards
        )
          ? record.related_standards.join(
              " "
            )
          : ""
      ]
        .filter(Boolean)
        .join(" ")
    )
  };
}

// ============================================================
// REQUIREMENT UNDERSTANDING
// ============================================================

function extractRequirementSignals(
  requirement
) {
  const text =
    normalizeText(requirement);

  const tokens = unique(
    tokenize(text)
  );

  const signals = {
    product: null,
    productFamily: null,
    application: null,
    environment: null,
    technicalSpecs: [],
    phrases: [],
    tokens
  };

  // ----------------------------------------------------------
  // PRODUCT DETECTION
  // ----------------------------------------------------------

  const productRules = [
    {
      regex:
        /\bled\b.*\b(street|road)\b|\b(street|road).*?\bled\b/i,

      product:
        "LED street light",

      family:
        "road lighting",

      phrases: [
        "led",
        "street",
        "road"
      ]
    },

    {
      regex:
        /\bled\b.*\bluminaire\b|\bluminaire\b.*?\bled\b/i,

      product:
        "LED luminaire",

      family:
        "led luminaire",

      phrases: [
        "led",
        "luminaire"
      ]
    },

    {
      regex:
        /\bled\b.*\b(bulb|lamp)\b|\b(bulb|lamp).*?\bled\b/i,

      product:
        "LED lamp / bulb",

      family:
        "led lamp",

      phrases: [
        "led",
        "lamp"
      ]
    },

    {
      regex:
        /\b(deformed steel bar|tmt|fe\s*\d+)\b/i,

      product:
        "Reinforcement steel bar",

      family:
        "concrete reinforcement",

      phrases: [
        "steel",
        "bar"
      ]
    },

    {
      regex:
        /\b(reinforced concrete|plain concrete|concrete)\b/i,

      product:
        "Concrete / reinforced concrete",

      family:
        "concrete",

      phrases: [
        "concrete"
      ]
    },

    {
      regex:
        /\b(cement|opc|ppc|portland cement)\b/i,

      product:
        "Cement",

      family:
        "cement",

      phrases: [
        "cement"
      ]
    },

    {
      regex:
        /\b(toy|toys)\b/i,

      product:
        "Toy",

      family:
        "toys",

      phrases: [
        "toy"
      ]
    },

    {
      regex:
        /\b(cable|wire|conductor)\b/i,

      product:
        "Cable / wire",

      family:
        "cables",

      phrases: [
        "cable"
      ]
    },

    {
      regex:
        /\b(pipe|pipeline|tube)\b/i,

      product:
        "Pipe / tube",

      family:
        "piping",

      phrases: [
        "pipe"
      ]
    }
  ];

  const matchedProduct =
    productRules.find(
      (rule) =>
        rule.regex.test(text)
    );

  if (matchedProduct) {
    signals.product =
      matchedProduct.product;

    signals.productFamily =
      matchedProduct.family;

    signals.phrases.push(
      ...matchedProduct.phrases
    );
  }

  // ----------------------------------------------------------
  // APPLICATION
  // ----------------------------------------------------------

  if (
    /\bstreet\b|\broad\b|\bhighway\b|\bmunicipal road\b|\broadway\b/i.test(
      text
    )
  ) {
    signals.application =
      "Road / street lighting";

    signals.phrases.push(
      "road",
      "street"
    );
  } else if (
    /\bindustrial\b/i.test(
      text
    )
  ) {
    signals.application =
      "Industrial use";

    signals.phrases.push(
      "industrial"
    );
  } else if (
    /\b(residential|home|household|domestic)\b/i.test(
      text
    )
  ) {
    signals.application =
      "Residential / household use";

    signals.phrases.push(
      "household"
    );
  }

  // ----------------------------------------------------------
  // ENVIRONMENT
  // ----------------------------------------------------------

  if (
    /\b(outdoor|outside|external)\b/i.test(
      text
    )
  ) {
    signals.environment =
      "Outdoor";

    signals.phrases.push(
      "outdoor"
    );
  } else if (
    /\b(indoor|inside)\b/i.test(
      text
    )
  ) {
    signals.environment =
      "Indoor";

    signals.phrases.push(
      "indoor"
    );
  }

  // ----------------------------------------------------------
  // TECHNICAL PARAMETERS
  // ----------------------------------------------------------

  const technicalPatterns = [
    /\b\d+(?:\.\d+)?\s*w\b/gi,
    /\b\d+(?:\.\d+)?\s*kw\b/gi,
    /\b\d+(?:\.\d+)?\s*kv\b/gi,
    /\b\d+(?:\.\d+)?\s*v\b/gi,
    /\b\d+(?:\.\d+)?\s*mm\b/gi,
    /\b\d+(?:\.\d+)?\s*sq\.?\s*mm\b/gi,
    /\bfe\s*\d+\b/gi
  ];

  for (const pattern of technicalPatterns) {
    const matches =
      text.match(pattern);

    if (matches) {
      signals.technicalSpecs.push(
        ...matches.map((value) =>
          value.trim()
        )
      );
    }
  }

  signals.technicalSpecs =
    unique(
      signals.technicalSpecs
    );

  return signals;
}

// ============================================================
// DOCUMENT PRIORITY
// ============================================================

function documentPriority(
  record
) {
  if (
    record.document_type ===
    "standard"
  ) {
    return 5;
  }

  if (
    record.document_type ===
    "standard_catalog_entry"
  ) {
    return 4;
  }

  if (
    record.document_type ===
    "product_manual"
  ) {
    return 3;
  }

  if (
    record.document_type ===
    "gazette_notification"
  ) {
    return 2;
  }

  return 1;
}

// ============================================================
// SCORE ONE RECORD
// ============================================================

function calculateMatch(
  requirement,
  record,
  signals
) {
  const fields =
    getSearchFields(record);

  const requirementTokens =
    signals.tokens;

  if (!requirementTokens.length) {
    return {
      score: 0,
      matchedKeywords: [],
      reasons: [],
      breakdown: {}
    };
  }

  const titleTokens =
    new Set(
      tokenize(fields.title)
    );

  const contentTokens =
    new Set(
      tokenize(fields.content)
    );

  const fullTokens =
    new Set(
      tokenize(fields.full)
    );

  // Exact tokens only.
  // This prevents "LED" from accidentally matching
  // the "led" inside words such as "rolled".

  const titleMatches =
    requirementTokens.filter(
      (token) =>
        titleTokens.has(token)
    );

  const contentMatches =
    requirementTokens.filter(
      (token) =>
        contentTokens.has(token)
    );

  const fullMatches =
    requirementTokens.filter(
      (token) =>
        fullTokens.has(token)
    );

  // ----------------------------------------------------------
  // PRODUCT MATCH
  // ----------------------------------------------------------

  const productTokens =
    signals.product
      ? unique(
          tokenize(
            signals.product
          )
        )
      : [];

  const productMatches =
    productTokens.filter(
      (token) =>
        fullTokens.has(token)
    );

  // ----------------------------------------------------------
  // BASE COVERAGE
  // ----------------------------------------------------------

  const tokenCoverage =
    Math.min(
      fullMatches.length /
        Math.max(
          requirementTokens.length,
          1
        ),
      1
    );

  const titleCoverage =
    Math.min(
      titleMatches.length /
        Math.max(
          requirementTokens.length,
          1
        ),
      1
    );

  const contentCoverage =
    Math.min(
      contentMatches.length /
        Math.max(
          requirementTokens.length,
          1
        ),
      1
    );

  let score = 0;

  // Generic relevance
  score +=
    tokenCoverage * 15;

  // Standard title is highly important
  score +=
    titleCoverage * 25;

  // Supporting description
  score +=
    contentCoverage * 10;

  // Product relevance
  if (productTokens.length) {
    score +=
      (
        productMatches.length /
        productTokens.length
      ) * 25;
  }

  // ----------------------------------------------------------
  // APPLICATION MATCH
  // ----------------------------------------------------------

  let applicationMatch = 0;

  if (
    signals.application ===
    "Road / street lighting"
  ) {
    const roadTitleMatch =
      (
        phrasePresent(
          fields.title,
          "road and street lighting"
        ) ||
        (
          containsWholeWord(
            fields.title,
            "street"
          ) &&
          containsWholeWord(
            fields.title,
            "lighting"
          )
        )
      );

    const roadContentMatch =
      (
        containsWholeWord(
          fields.content,
          "street"
        ) &&
        containsWholeWord(
          fields.content,
          "lighting"
        )
      );

    if (roadTitleMatch) {
      applicationMatch = 15;
    } else if (
      roadContentMatch
    ) {
      applicationMatch = 8;
    }
  }

  if (
    signals.application ===
    "Industrial use" &&
    containsWholeWord(
      fields.full,
      "industrial"
    )
  ) {
    applicationMatch = 10;
  }

  if (
    signals.application ===
    "Residential / household use" &&
    (
      containsWholeWord(
        fields.full,
        "household"
      ) ||
      containsWholeWord(
        fields.full,
        "domestic"
      )
    )
  ) {
    applicationMatch = 10;
  }

  score += applicationMatch;

  // ----------------------------------------------------------
  // ENVIRONMENT MATCH
  // ----------------------------------------------------------

  let environmentMatch = 0;

  if (
    signals.environment ===
    "Outdoor"
  ) {
    if (
      containsWholeWord(
        fields.title,
        "outdoor"
      ) ||
      containsWholeWord(
        fields.content,
        "outdoor"
      )
    ) {
      environmentMatch = 5;
    }
  }

  if (
    signals.environment ===
    "Indoor"
  ) {
    if (
      containsWholeWord(
        fields.title,
        "indoor"
      ) ||
      containsWholeWord(
        fields.content,
        "indoor"
      )
    ) {
      environmentMatch = 5;
    }
  }

  score += environmentMatch;

  // ----------------------------------------------------------
  // PHRASE MATCH
  // ----------------------------------------------------------

  let phraseBonus = 0;

  for (
    const phrase of unique(
      signals.phrases
    )
  ) {
    if (
      phrasePresent(
        fields.title,
        phrase
      )
    ) {
      phraseBonus += 3;
    } else if (
      phrasePresent(
        fields.content,
        phrase
      )
    ) {
      phraseBonus += 1;
    }
  }

  score += Math.min(
    phraseBonus,
    10
  );

  // ----------------------------------------------------------
  // EXACT STANDARD NUMBER
  // ----------------------------------------------------------

  const normalizedRequirement =
    normalizeText(
      requirement
    );

  const normalizedNumber =
    normalizeText(
      record.standard_number
    );

  if (
    normalizedNumber &&
    normalizedRequirement.includes(
      normalizedNumber
    )
  ) {
    score = 100;
  }

  // ----------------------------------------------------------
  // STATUS
  // ----------------------------------------------------------

  const status =
    getStatus(record);

  if (status.isCurrent) {
    score += 4;
  }

  if (status.isMandatory) {
    score += 3;
  }

  if (
    status.isSuperseded
  ) {
    score *= 0.55;
  }

  if (
    status.isWithdrawn
  ) {
    score *= 0.45;
  }

  if (
    status.isSuspended
  ) {
    score *= 0.7;
  }

  // ----------------------------------------------------------
  // EVIDENCE DEPTH
  // ----------------------------------------------------------

  if (
    record.content_depth ===
    "detailed"
  ) {
    score *= 1.08;
  } else if (
    record.content_depth ===
    "descriptive"
  ) {
    score *= 1.03;
  } else if (
    record.content_depth ===
    "catalog_stub"
  ) {
    score *= 0.97;
    score -= 2;
  }

  // Certification evidence should support,
  // not dominate, actual standard records.
  if (
    record.domain ===
      "certification" ||
    record.domain ===
      "mandatory_certifications"
  ) {
    score *= 0.96;
  }

  score = Math.max(
    0,
    Math.min(
      Math.round(score),
      100
    )
  );

  // ----------------------------------------------------------
  // REASONS
  // ----------------------------------------------------------

  const matchedKeywords =
    unique([
      ...titleMatches,
      ...contentMatches
    ]).slice(0, 12);

  const reasons = [];

  if (
    productMatches.length
  ) {
    reasons.push(
      `Product relevance: ${productMatches.join(
        ", "
      )}`
    );
  }

  if (
    titleMatches.length
  ) {
    reasons.push(
      `Title match: ${unique(
        titleMatches
      ).join(", ")}`
    );
  }

  if (
    applicationMatch > 0
  ) {
    reasons.push(
      `Application match: ${signals.application}`
    );
  }

  if (
    environmentMatch > 0
  ) {
    reasons.push(
      `Environment match: ${signals.environment}`
    );
  }

  if (
    signals.technicalSpecs
      .length
  ) {
    reasons.push(
      `Technical details detected: ${signals.technicalSpecs.join(
        ", "
      )}`
    );
  }

  if (
    status.isCurrent
  ) {
    reasons.push(
      "Record is marked current in the BIS knowledge base."
    );
  }

  if (
    status.isMandatory
  ) {
    reasons.push(
      "Record carries mandatory/certification evidence."
    );
  }

  if (
    record.content_depth
  ) {
    reasons.push(
      `Evidence depth: ${record.content_depth}`
    );
  }

  return {
    score,
    matchedKeywords,
    reasons,
    breakdown: {
      tokenCoverage:
        Math.round(
          tokenCoverage * 100
        ),

      titleCoverage:
        Math.round(
          titleCoverage * 100
        ),

      contentCoverage:
        Math.round(
          contentCoverage * 100
        ),

      productMatches:
        productMatches.length,

      applicationMatch,

      environmentMatch,

      technicalSpecs:
        signals.technicalSpecs
    }
  };
}

// ============================================================
// COLLAPSE DUPLICATE STANDARD FAMILIES
// ============================================================

function chooseBestFamilyRecord(
  records
) {
  return [...records].sort(
    (a, b) => {
      if (
        b.match !== a.match
      ) {
        return (
          b.match -
          a.match
        );
      }

      const currentA =
        getStatus(a).isCurrent
          ? 1
          : 0;

      const currentB =
        getStatus(b).isCurrent
          ? 1
          : 0;

      if (
        currentB !== currentA
      ) {
        return (
          currentB -
          currentA
        );
      }

      const depthPriority = {
        detailed: 4,
        descriptive: 3,
        catalog_stub: 2,
        directory_listing: 1
      };

      const depthA =
        depthPriority[
          a.content_depth
        ] || 0;

      const depthB =
        depthPriority[
          b.content_depth
        ] || 0;

      if (
        depthB !== depthA
      ) {
        return (
          depthB -
          depthA
        );
      }

      return (
        documentPriority(b) -
        documentPriority(a)
      );
    }
  )[0];
}

function collapseFamilies(
  matches
) {
  const groups =
    new Map();

  for (
    const match of matches
  ) {
    const key =
      match.standard_family_key ||
      standardFamilyKey(
        match.standard_number
      ) ||
      match.standard_number;

    if (!key) {
      continue;
    }

    if (!groups.has(key)) {
      groups.set(
        key,
        []
      );
    }

    groups
      .get(key)
      .push(match);
  }

  return [
    ...groups.values()
  ].map(
    chooseBestFamilyRecord
  );
}

// ============================================================
// FIND BEST RECORD FOR A FAMILY
// ============================================================

function findBestRecordForFamily(
  familyKey
) {
  return knowledgeBase
    .filter(
      (record) =>
        record.standard_number &&
        standardFamilyKey(
          record.standard_number
        ) === familyKey
    )
    .sort(
      (a, b) => {
        const currentA =
          getStatus(a)
            .isCurrent
            ? 1
            : 0;

        const currentB =
          getStatus(b)
            .isCurrent
            ? 1
            : 0;

        if (
          currentB !==
          currentA
        ) {
          return (
            currentB -
            currentA
          );
        }

        return (
          documentPriority(b) -
          documentPriority(a)
        );
      }
    )[0];
}

// ============================================================
// BUILD RELATED STANDARDS
// ============================================================

function buildRelatedStandards(
  primary,
  rankedMatches
) {
  const results = [];

  const primaryFamily =
    standardFamilyKey(
      primary.standard_number
    );

  const seen =
    new Set(
      primaryFamily
        ? [primaryFamily]
        : []
    );

  const addRecord = (
    record,
    reason,
    typeOverride = null
  ) => {
    if (
      !record?.standard_number
    ) {
      return;
    }

    const familyKey =
      standardFamilyKey(
        record.standard_number
      );

    if (
      !familyKey ||
      seen.has(familyKey)
    ) {
      return;
    }

    seen.add(familyKey);

    results.push({
      id:
        record.id ||
        null,

      number:
        record.standard_number,

      title:
        record.title ||
        "Indian Standard",

      type:
        typeOverride ||
        (
          record.document_type ===
          "product_manual"
            ? "Product Manual"
            : record.document_type ===
              "gazette_notification"
              ? "Certification / Order Evidence"
              : "Related Standard"
        ),

      match:
        record.match ||
        0,

      status:
        record.status ||
        "Unknown",

      category:
        getCategory(record),

      sourceUrl:
        record.source_url ||
        null,

      sourceName:
        record.source_name ||
        null,

      documentType:
        record.document_type ||
        null,

      contentDepth:
        record.content_depth ||
        null,

      coverageNote:
        record.coverage_note ||
        null,

      reasons: [
        reason
      ]
    });
  };

  // ----------------------------------------------------------
  // Explicit relationships
  // ----------------------------------------------------------

  const explicitRelated =
    Array.isArray(
      primary.related_standards
    )
      ? primary.related_standards
      : [];

  for (
    const number of explicitRelated
  ) {
    if (
      results.length >= 5
    ) {
      break;
    }

    const familyKey =
      standardFamilyKey(
        number
      );

    if (!familyKey) {
      continue;
    }

    const record =
      findBestRecordForFamily(
        familyKey
      );

    if (!record) {
      continue;
    }

    addRecord(
      record,
      `Explicitly referenced by ${primary.standard_number}.`
    );
  }

  // ----------------------------------------------------------
  // Ranked related matches
  // ----------------------------------------------------------

  for (
    const record of rankedMatches
  ) {
    if (
      results.length >= 5
    ) {
      break;
    }

    addRecord(
      record,
      "High relevance to the procurement requirement."
    );
  }

  return results;
}

// ============================================================
// CERTIFICATION EVIDENCE
// ============================================================

function findCertificationEvidence(
  primary
) {
  const familyKey =
    standardFamilyKey(
      primary.standard_number
    );

  if (!familyKey) {
    return [];
  }

  return knowledgeBase.filter(
    (record) => {
      if (
        !record.standard_number
      ) {
        return false;
      }

      const recordFamily =
        standardFamilyKey(
          record.standard_number
        );

      return (
        recordFamily ===
          familyKey &&
        (
          record.domain ===
            "certification" ||
          record.domain ===
            "mandatory_certifications" ||
          record.document_type ===
            "gazette_notification"
        )
      );
    }
  );
}

// ============================================================
// MAIN ANALYSIS
// ============================================================

async function analyzeRequirement(
  requirement
) {
  const text =
    String(
      requirement || ""
    ).trim();

  if (!text) {
    throw new Error(
      "Procurement requirement is required."
    );
  }

  if (
    !knowledgeBase.length
  ) {
    throw new Error(
      "BIS knowledge base could not be loaded."
    );
  }

  console.log(
    "Analyzing requirement against BIS knowledge base:"
  );

  console.log(text);

  // ----------------------------------------------------------
  // Understand the requirement
  // ----------------------------------------------------------

  const signals =
    extractRequirementSignals(
      text
    );

  // ----------------------------------------------------------
  // Candidate standards
  // ----------------------------------------------------------

  const candidates =
    knowledgeBase.filter(
      isUsableRecord
    );

  // ----------------------------------------------------------
  // Score every candidate
  // ----------------------------------------------------------

  let ranked =
    candidates
      .map((record) => {
        const result =
          calculateMatch(
            text,
            record,
            signals
          );

        return {
          ...record,

          match:
            result.score,

          matchedKeywords:
            result.matchedKeywords,

          matchReasons:
            result.reasons,

          matchBreakdown:
            result.breakdown
        };
      })
      .filter(
        (record) =>
          record.match >= 12
      )
      .sort(
        (a, b) => {
          if (
            b.match !==
            a.match
          ) {
            return (
              b.match -
              a.match
            );
          }

          const currentA =
            getStatus(a)
              .isCurrent
              ? 1
              : 0;

          const currentB =
            getStatus(b)
              .isCurrent
              ? 1
              : 0;

          if (
            currentB !==
            currentA
          ) {
            return (
              currentB -
              currentA
            );
          }

          return (
            documentPriority(b) -
            documentPriority(a)
          );
        }
      );

  // ----------------------------------------------------------
  // Remove duplicate families
  // ----------------------------------------------------------

  ranked =
    collapseFamilies(
      ranked
    ).sort(
      (a, b) =>
        b.match -
        a.match
    );

  // ==========================================================
  // NO STRONG RESULT
  // ==========================================================

  if (!ranked.length) {
    return {
      requirement: text,

      product:
        signals.product ||
        "Not identified",

      category:
        "Not identified",

      application:
        signals.application ||
        "Not identified",

      environment:
        signals.environment ||
        "Not identified",

      keyRequirements:
        signals.technicalSpecs
          .length
          ? signals.technicalSpecs.join(
              ", "
            )
          : "Not identified",

      needsClarification:
        true,

      extractedRequirements: {
        product:
          signals.product ||
          "Not identified",

        category:
          "Not identified",

        application:
          signals.application ||
          "Not identified",

        environment:
          signals.environment ||
          "Not identified",

        keyRequirements:
          signals.technicalSpecs
            .length
            ? signals.technicalSpecs.join(
                ", "
              )
            : "Not identified"
      },

      primaryStandard:
        null,

      relatedStandards:
        [],

      certification: {
        name:
          "BIS Product Certification",

        applicable:
          false,

        note:
          "No sufficiently relevant standard was found in the current BIS knowledge base."
      },

      version:
        null,

      reasons: [
        "No sufficiently relevant Indian Standard was identified.",
        "Add product type, application, material, size, capacity, rating or intended use for a stronger match."
      ],

      evidence:
        null,

      matchesFound:
        0,

      dataset: {
        totalRecords:
          knowledgeBase.length,

        candidateRecords:
          candidates.length,

        recommendationsReturned:
          0
      }
    };
  }

  // ==========================================================
  // PRIMARY STANDARD
  // ==========================================================

  const primary =
    ranked[0];

  const primaryStatus =
    getStatus(primary);

  // ==========================================================
  // RELATED STANDARDS
  // ==========================================================

  const relatedStandards =
    buildRelatedStandards(
      primary,
      ranked.slice(1)
    );

  // ==========================================================
  // CERTIFICATION
  // ==========================================================

  const certificationRecords =
    findCertificationEvidence(
      primary
    );

  const mandatoryEvidence =
    certificationRecords.find(
      (record) =>
        getStatus(record)
          .isMandatory
    );

  const certificationApplicable =
    Boolean(
      primaryStatus.isMandatory ||
      mandatoryEvidence
    );

  // ==========================================================
  // EVIDENCE LEVEL
  // ==========================================================

  let verificationLevel =
    "Dataset evidence";

  if (
    primary.content_depth ===
    "detailed"
  ) {
    verificationLevel =
      "Detailed evidence";
  } else if (
    primary.content_depth ===
    "descriptive"
  ) {
    verificationLevel =
      "Descriptive evidence";
  } else if (
    primary.content_depth ===
    "catalog_stub"
  ) {
    verificationLevel =
      "Catalogue-level evidence";
  }

  // ==========================================================
  // HUMAN-READABLE REASONS
  // ==========================================================

  const reasons =
    primary.matchReasons?.length
      ? primary.matchReasons
      : [
          "Relevant BIS standard identified from the procurement requirement."
        ];

  // ==========================================================
  // FINAL RESPONSE
  // ==========================================================

  return {
    requirement:
      text,

    // --------------------------------------------------------
    // TOP-LEVEL ALIASES
    // These keep the existing frontend compatible.
    // --------------------------------------------------------

    product:
      signals.product ||
      primary.title ||
      "Not identified",

    category:
      getCategory(primary),

    application:
      signals.application ||
      "Based on procurement description",

    environment:
      signals.environment ||
      "Not specified",

    power:
      signals.technicalSpecs.find(
        (spec) =>
          /\bw\b/i.test(spec)
      ) || null,

    keyRequirements:
      signals.technicalSpecs
        .length
        ? signals.technicalSpecs.join(
            ", "
          )
        : unique(
            signals.phrases
          ).join(", ") ||
          "No specific technical parameters extracted",

    needsClarification:
      false,

    // --------------------------------------------------------
    // STRUCTURED AI UNDERSTANDING
    // --------------------------------------------------------

    extractedRequirements: {
      product:
        signals.product ||
        primary.title ||
        "Not identified",

      category:
        getCategory(primary),

      application:
        signals.application ||
        "Based on procurement description",

      environment:
        signals.environment ||
        "Not specified",

      keyRequirements:
        signals.technicalSpecs
          .length
          ? signals.technicalSpecs.join(
              ", "
            )
          : unique(
              signals.phrases
            ).join(", ") ||
            "No specific technical parameters extracted"
    },

    // --------------------------------------------------------
    // PRIMARY STANDARD
    // --------------------------------------------------------

    primaryStandard: {
      id:
        primary.id ||
        null,

      number:
        primary.standard_number,

      title:
        primary.title,

      match:
        primary.match,

      type:
        "Primary Applicable Standard",

      status:
        primary.status ||
        "Unknown",

      category:
        getCategory(primary),

      sourceUrl:
        primary.source_url ||
        null,

      sourceName:
        primary.source_name ||
        null,

      documentType:
        primary.document_type ||
        null,

      content:
        primary.content ||
        null,

      clause:
        primary.clause ||
        null,

      section:
        primary.section ||
        null,

      date:
        primary.date ||
        null,

      datePrecision:
        primary.date_precision ||
        null,

      contentDepth:
        primary.content_depth ||
        null,

      coverageNote:
        primary.coverage_note ||
        null,

      statusParsed:
        primary.status_parsed ||
        null,

      relatedStandards:
        Array.isArray(
          primary.related_standards
        )
          ? primary.related_standards
          : [],

      sameFamilyIds:
        Array.isArray(
          primary.same_family_ids
        )
          ? primary.same_family_ids
          : [],

      matchBreakdown:
        primary.matchBreakdown ||
        {}
    },

    // --------------------------------------------------------
    // RELATED STANDARDS
    // --------------------------------------------------------

    relatedStandards,

    // --------------------------------------------------------
    // CERTIFICATION
    // --------------------------------------------------------

    certification: {
      name:
        certificationApplicable
          ? "BIS compulsory certification / conformity assessment"
          : "BIS Product Certification",

      applicable:
        certificationApplicable,

      evidence:
        certificationRecords
          .slice(0, 3)
          .map(
            (record) => ({
              id:
                record.id ||
                null,

              number:
                record.standard_number,

              title:
                record.title,

              status:
                record.status,

              sourceUrl:
                record.source_url ||
                null
            })
          ),

      note:
        certificationApplicable
          ? "The knowledge base contains mandatory/certification evidence for this standard family. Confirm the latest applicable QCO/order before making an official compliance determination."
          : "No mandatory certification evidence was found for the selected standard family in the current knowledge base."
    },

    // --------------------------------------------------------
    // VERSION
    // --------------------------------------------------------

    version: {
      currentEdition:
        primary.standard_number,

      status:
        primary.status ||
        "Unknown",

      revision:
        primaryStatus.revision,

      statusDate:
        primaryStatus.statusDate,

      isCurrent:
        primaryStatus.isCurrent
    },

    // --------------------------------------------------------
    // WHY RECOMMENDED
    // --------------------------------------------------------

    reasons,

    // --------------------------------------------------------
    // EVIDENCE
    // --------------------------------------------------------

    evidence: {
      verificationLevel,

      sourceUrl:
        primary.source_url ||
        null,

      sourceName:
        primary.source_name ||
        null,

      documentType:
        primary.document_type ||
        null,

      contentDepth:
        primary.content_depth ||
        null,

      coverageNote:
        primary.coverage_note ||
        null
    },

    // --------------------------------------------------------
    // DATASET INFO
    // --------------------------------------------------------

    matchesFound:
      ranked.length,

    dataset: {
      totalRecords:
        knowledgeBase.length,

      candidateRecords:
        candidates.length,

      recommendationsReturned:
        Math.min(
          relatedStandards.length +
            1,
          6
        )
    }
  };
}

// ============================================================
// EXPORT
// ============================================================

module.exports = {
  analyzeRequirement
};