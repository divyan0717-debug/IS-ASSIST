const express = require("express");
const puppeteer = require("puppeteer");
const { buildReportHtml } = require("./reportTemplate");

const router = express.Router();

// A single shared browser instance, launched lazily and reused across requests.
let browserPromise = null;
function getBrowser() {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
  }
  return browserPromise;
}

// ==========================================
// POST /api/report
// GENERATE PROCUREMENT REPORT
// ==========================================

router.post("/report", async (req, res) => {
  let page;

  try {
    const { requirement, analysis } = req.body;

    if (!requirement) {
      return res.status(400).json({
        success: false,
        message: "Requirement is required.",
      });
    }

    const refNumber = `IS-ASSIST/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`;
    const generatedOn = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const html = buildReportHtml({ requirement, analysis, refNumber, generatedOn });

    const browser = await getBrowser();
    page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="IS-ASSIST-Report.pdf"');
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Report Generation Error:", error);

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: "Unable to generate report.",
        error: error.message,
      });
    }
  } finally {
    if (page) await page.close();
  }
});

module.exports = router;