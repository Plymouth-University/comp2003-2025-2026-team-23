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
{'summary': 'string', 'key_points': ['string'], 'recommendations': ['string']}

Field expectations:
- summary → a structured, well-written overview (length depends on complexity)
- key_points → multiple detailed bullet points (more points at higher complexity)
- recommendations → actionable or meaningful takeaways (not generic)

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