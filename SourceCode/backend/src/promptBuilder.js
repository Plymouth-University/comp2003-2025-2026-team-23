const config = require("./promptConfig.json");

function buildPrompt(task, audience, complexity = 3) { // default aligned with slider
    const taskConfig = config[task];
    if (!taskConfig) {
        throw new Error("Invalid task type");
    }

    const audienceConfig = taskConfig.audiences[audience];
    if (!audienceConfig) {
        throw new Error("Invalid audience type");
    }

    // ADDED: clearer complexity mapping (1–5)
    const detailInstruction = `
Detail level: ${complexity}/5

1 = Very Simple → minimal, high-level points only  
2 = Simple → short explanations, limited detail  
3 = Moderate → balanced summary with key supporting details  
4 = Detailed → include evidence, reasoning, and more depth  
5 = Very Detailed → extract as much useful information as possible, including nuanced findings, edge cases, and supporting data
`;

    const systemMessage = `
${taskConfig.base_instruction}

${audienceConfig.instruction}

${detailInstruction}

Your job:
1. Carefully read the entire PDF.
2. Extract and organise ALL important information (do NOT overly summarise).
3. Focus on completeness and clarity based on the detail level.

Ensure coverage of:
- Main findings
- Supporting evidence
- Key statistics or results (if present)
- Limitations, risks, or uncertainties
- Practical or real-world implications

Output requirements:
Return ONLY valid JSON matching this schema:

{
  "blocks": [
    { "type": "title",            "data": { "title": "string" } },
    { "type": "author",           "data": { "authors": [{ "initials": "string", "name": "string", "department": "string", "institution": "string" }] } },
    { "type": "publication_info", "data": { "published": "string", "doi": "string" } },
    { "type": "sample_info",      "data": { "items": [{ "label": "string", "value": "string" }] } },
    { "type": "summary",          "data": { "heading": "Summary", "body": "string" } },
    { "type": "text_section",     "data": { "heading": "string", "body": "string" } },
    { "type": "stats",            "data": { "items": [{ "label": "string", "value": "string" }] } },
    { "type": "key_findings",     "data": { "heading": "Key Findings", "items": ["string"] } },
    { "type": "implications",     "data": { "heading": "string", "body": "string" } },
    { "type": "recommendations",  "data": { "heading": "Recommendations", "items": ["string"] } }
  ]
}

Field expectations:
- title → the paper's full title
- author → ALL authors as an array; derive initials from name (e.g. "F. Manning" → "FM")
- publication_info → journal, year, volume, DOI if present; use "N/A" if missing
- sample_info → 3-5 items covering things like sample size, age range, gender split, study type, setting etc.
- summary → structured overview, length scales with complexity level
- text_section → use for a notable secondary section e.g. "Concerns", "Limitations", "Background"; omit if not relevant
- stats → only include if the paper contains concrete numerical results, omit entirely if not, do ideally 4-6
- key_findings → at least 4-6 specific points
- implications → plain-language explanation of what the findings mean for the reader
- recommendations → 4-6 actionable takeaways, not generic

Rules:
- Do NOT add extra fields.
- Do NOT return markdown.
- Do NOT use comments.
- Only return valid JSON.
- Match the requested level of detail.
- ONLY use the uploaded file.
- Return empty fields if file missing.
`;

    return {
        model: taskConfig.model,
        temperature: taskConfig.temperature,
        systemMessage
    };
}

module.exports = { buildPrompt };