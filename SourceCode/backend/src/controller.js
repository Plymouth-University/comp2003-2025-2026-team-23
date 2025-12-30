const OpenAI = require("openai");
const fs = require("fs");
const formData = require("form-data")

exports.prompt = async (req, res) => {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    // Transfer file to OpenAI - it must be POSTed to a file server and then referenced
    const uploadedFile = await client.files.create({
        file: fs.createReadStream(`./uploads/${req.file["filename"]}`),
        purpose: "user_data"
    });
    // TODO: end request early if it fails

    console.log(`Sent file ${req.file["filename"]} to OpenAI server. ID is ${uploadedFile.id}.`);

    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are an AI assistant that extracts key information from medical research PDF documents. Your job: 1. Read the PDF provided by the user. 2. Summarise this PDF into 3 sections: 'summary', 'key_points', and 'recommendations'. 3. Output the final answer ONLY in valid JSON, matching the schema below. JSON Schema: {'summary': 'string', 'key_points': ['string'],'recommendations': ['string']}. Rules: - Do NOT add extra fields. - Do NOT return markdown. - Do NOT use comments. - Only return valid JSON. - ONLY use the previously uploaded file, and return all fields empty if a file was not correctly sent with this request."
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
    response = completion.choices[0].message.content
    console.log(completion.choices[0].message.content);
    console.log("Deleting file (not done yet)");
    res.json({response});
}




exports.ping = (req, res) => {
    res.json({message: "Pong!"})
}
