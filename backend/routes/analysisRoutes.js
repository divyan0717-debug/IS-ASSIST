const express = require("express");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const {
  analyzeRequirement,
} = require("../services/analysisService");

// ==========================================
// DATASET
// ==========================================

const standardsPath = path.join(
  __dirname,
  "../data/bis_knowledge_v2.jsonl"
);

// ==========================================
// LOAD BIS STANDARDS
// ==========================================

const loadStandards = () => {
  try {
    if (!fs.existsSync(standardsPath)) {
      console.error(
        "BIS dataset not found:",
        standardsPath
      );

      return [];
    }

    const raw = fs
      .readFileSync(
        standardsPath,
        "utf8"
      )
      .replace(/^\uFEFF/, "");

    const records = raw
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

    return records;
  } catch (error) {
    console.error(
      "Error loading BIS dataset:",
      error
    );

    return [];
  }
};

// ==========================================
// PDF UPLOAD CONFIGURATION
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 10 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    if (
      file.mimetype ===
      "application/pdf"
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF files are allowed."
        )
      );
    }
  },
});

// ==========================================
// HISTORY FILE
// ==========================================

const historyFile = path.join(
  __dirname,
  "../data/history.json"
);

// ==========================================
// READ HISTORY
// ==========================================

const readHistory = () => {
  try {
    if (!fs.existsSync(historyFile)) {
      return [];
    }

    const data = fs.readFileSync(
      historyFile,
      "utf8"
    );

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "Error reading history:",
      error
    );

    return [];
  }
};

// ==========================================
// SAVE HISTORY
// ==========================================

const saveHistory = (entry) => {
  try {
    const history =
      readHistory();

    history.unshift(entry);

    fs.writeFileSync(
      historyFile,
      JSON.stringify(
        history,
        null,
        2
      )
    );
  } catch (error) {
    console.error(
      "Error saving history:",
      error
    );
  }
};

// ==========================================
// GET /api/standards
// REAL BIS STANDARDS LIBRARY
// ==========================================

router.get(
  "/standards",
  (req, res) => {
    try {
      const standards =
        loadStandards();

      const standardRecords =
        standards
          .filter(
            (record) =>
              record &&
              record.standard_number
          )
          .filter(
            (record) =>
              record.domain ===
                "standards" ||
              record.domain ===
                "mandatory_certifications" ||
              record.document_type ===
                "standard" ||
              record.document_type ===
                "standard_catalog_entry" ||
              record.document_type ===
                "product_manual" ||
              record.document_type ===
                "gazette_notification"
          )
          .map((record) => ({
            id:
              record.id ||
              null,

            number:
              record.standard_number,

            title:
              record.title ||
              "Indian Standard",

            category:
              record.category ||
              record.domain ||
              "Indian Standards",

            status:
              record.status ||
              "Unknown",

            sourceUrl:
              record.source_url ||
              null,

            sourceName:
              record.source_name ||
              null,

            documentType:
              record.document_type ||
              null,

            content:
              record.content ||
              null,

            clause:
              record.clause ||
              null,

            section:
              record.section ||
              null,

            date:
              record.date ||
              null,

            contentDepth:
              record.content_depth ||
              null,

            coverageNote:
              record.coverage_note ||
              null,

            statusParsed:
              record.status_parsed ||
              null,

            relatedStandards:
              Array.isArray(
                record.related_standards
              )
                ? record.related_standards
                : [],

            standardFamilyKey:
              record.standard_family_key ||
              null,

            sameFamilyIds:
              Array.isArray(
                record.same_family_ids
              )
                ? record.same_family_ids
                : [],
          }));

      return res.status(200).json({
        success: true,

        count:
          standardRecords.length,

        totalRecords:
          standards.length,

        data:
          standardRecords,
      });
    } catch (error) {
      console.error(
        "Standards Library Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to load BIS standards library.",

        error:
          error.message,
      });
    }
  }
);

// ==========================================
// POST /api/analyze
// TEXT REQUIREMENT ANALYSIS
// ==========================================

router.post(
  "/analyze",
  async (req, res) => {
    try {
      const {
        requirement,
      } = req.body;

      if (
        !requirement ||
        !requirement.trim()
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Procurement requirement is required.",
        });
      }

      const result =
        await analyzeRequirement(
          requirement.trim()
        );

      saveHistory({
        id: Date.now(),

        type: "Text",

        requirement:
          requirement.trim(),

        standard:
          result.primaryStandard
            ?.number ||
          "Not available",

        match:
          result.primaryStandard
            ?.match ||
          0,

        createdAt:
          new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,

        message:
          "Requirement analyzed successfully.",

        data: result,
      });
    } catch (error) {
      console.error(
        "Analysis Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Something went wrong while analyzing the requirement.",

        error:
          error.message,
      });
    }
  }
);

// ==========================================
// POST /api/analyze-pdf
// PDF ANALYSIS
// ==========================================

router.post(
  "/analyze-pdf",
  upload.single("tender"),

  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,

          message:
            "Please upload a PDF tender document.",
        });
      }

      console.log(
        "PDF received:",
        req.file.originalname
      );

      const parser =
        new PDFParse({
          data: req.file.buffer,
        });

      const pdfData =
        await parser.getText();

      await parser.destroy();

      const extractedText =
        pdfData.text
          ? pdfData.text.trim()
          : "";

      console.log(
        "Extracted characters:",
        extractedText.length
      );

      if (!extractedText) {
        return res.status(400).json({
          success: false,

          message:
            "The PDF does not contain readable text.",
        });
      }

      const result =
        await analyzeRequirement(
          extractedText
        );

      saveHistory({
        id: Date.now(),

        type: "PDF",

        requirement:
          extractedText.substring(
            0,
            250
          ),

        fileName:
          req.file.originalname,

        standard:
          result.primaryStandard
            ?.number ||
          "Not available",

        match:
          result.primaryStandard
            ?.match ||
          0,

        createdAt:
          new Date().toISOString(),
      });

      return res.status(200).json({
        success: true,

        message:
          "Tender PDF analyzed successfully.",

        data: result,

        document: {
          fileName:
            req.file.originalname,

          pages:
            pdfData.total ||
            null,

          extractedCharacters:
            extractedText.length,
        },
      });
    } catch (error) {
      console.error(
        "PDF Analysis Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Something went wrong while processing the PDF.",

        error:
          error.message,
      });
    }
  }
);

// ==========================================
// GET /api/history
// GET ANALYSIS HISTORY
// ==========================================

router.get(
  "/history",
  (req, res) => {
    try {
      const history =
        readHistory();

      return res.status(200).json({
        success: true,

        count:
          history.length,

        data:
          history,
      });
    } catch (error) {
      console.error(
        "History Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to retrieve analysis history.",
      });
    }
  }
);

// ==========================================
// DELETE /api/history
// CLEAR HISTORY
// ==========================================

router.delete(
  "/history",
  (req, res) => {
    try {
      fs.writeFileSync(
        historyFile,
        JSON.stringify(
          [],
          null,
          2
        )
      );

      return res.status(200).json({
        success: true,

        message:
          "Analysis history cleared.",
      });
    } catch (error) {
      console.error(
        "Clear History Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to clear history.",
      });
    }
  }
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;