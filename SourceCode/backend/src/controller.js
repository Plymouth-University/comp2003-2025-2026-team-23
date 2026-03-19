const OpenAI = require("openai");
const fs = require("fs");
const formData = require("form-data");
const { buildPrompt } = require("./promptBuilder");


exports.prompt = async (req, res) => {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    // Validate task and audience
    const { task, audience, complexity } = req.body; // ADDED complexity

    if (!task || !audience) {
        return res.status(400).json({
            error: "Missing task or audience"
        });
    }

    // prevent crash if file missing
    if (!req.file || !req.file.filename) {
        return res.status(400).json({
            error: "No file uploaded"
        });
    }

    // Build dynamic prompt
    let promptData;
    try {
        // CHANGED: pass complexity (default to 3 if missing)
        promptData = buildPrompt(task, audience, complexity || 3);
    } catch (error) {
        return res.status(400).json({
            error: error.message
        });
    }

    const { model, temperature, systemMessage } = promptData;

    try {

        // Transfer file to OpenAI - it must be POSTed to a file server and then referenced
        const uploadedFile = await client.files.create({
            file: fs.createReadStream(`./uploads/${req.file["filename"]}`),
            purpose: "user_data"
        });
        // TODO: end request early if it fails

        console.log(`Sent file ${req.file["filename"]} to OpenAI server. ID is ${uploadedFile.id}.`);

        const completion = await client.chat.completions.create({
            model,
            temperature, // added dynamic temperature
            messages: [
                {
                    role: "system",
                    content: systemMessage
                },
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: "Please summarise the attached PDF following the schema."
                        },
                        {
                            type: "file",
                            file: {
                                file_id: uploadedFile.id
                            }
                        }
                    ]
                }
            ],
            response_format: { type: "json_object" },
            store: false,
        });

        // prevent accidental global variable
        const response = completion.choices[0].message.content;

        if (!response) {
            return res.status(500).json({
                summary: "",
                key_points: [],
                recommendations: []
            });
        }

        // safer parse logging (still inside your try block)
        let parsed;
        try {
            parsed = JSON.parse(response);
        } catch (parseError) {
            console.error("JSON parse error:", parseError, response);
            throw parseError;
        }

        res.json(parsed);

    } catch (error) {
        console.error("OpenAI Error:", error);
        return res.status(500).json({
            summary: "",
            key_points: [],
            recommendations: []
        });
    }
}




exports.ping = (req, res) => {
    res.json({message: "Pong!"})
}