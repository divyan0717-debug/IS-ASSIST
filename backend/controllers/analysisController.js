```js
const {
  analyzeRequirement: analyzeRequirementService,
} = require("../services/analysisService");

// ==========================================
// ANALYZE PROCUREMENT REQUIREMENT
// ==========================================
const analyzeRequirement = async (req, res) => {
  try {
    const { requirement, language } = req.body;

    // Validate requirement
    if (!requirement || !requirement.trim()) {
      return res.status(400).json({
        success: false,
        message: "Procurement requirement is required.",
      });
    }

    console.log("==========================================");
    console.log("ANALYSIS REQUEST");
    console.log("Requirement:", requirement);
    console.log("Language:", language || "en-IN");
    console.log("==========================================");

    // Call the standards analysis service
    const result = await analyzeRequirementService(
      requirement.trim()
    );

    // Send result to frontend
    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("==========================================");
    console.error("Analysis Error:", error);
    console.error("==========================================");

    return res.status(500).json({
      success: false,
      message: "Failed to analyze requirement.",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : undefined,
    });
  }
};

// ==========================================
// EXPORT CONTROLLER
// ==========================================
module.exports = {
  analyzeRequirement,
};
```
