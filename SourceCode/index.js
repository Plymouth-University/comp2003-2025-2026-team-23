import OpenAI from "openai";

import dotenv from "dotenv";
dotenv.config();

exports.prompt = async (req, res) => {
    const client = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY
    });

    const completion = await client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            {
                role: "system",
                content: "You are an AI assistant that extracts key information from medical research PDF documents. Your job: 1. Read the PDF provided by the user. 2. Summarise it into 3 sections: 'summary', 'key_points', and 'recommendations'. 3. Output the final answer ONLY in valid JSON, matching the schema below. JSON Schema: {'summary': 'string', 'key_points': ['string'],'recommendations': ['string']}. Rules: - Do NOT add extra fields. - Do NOT return markdown. - Do NOT use comments. - Only return valid JSON."
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
                        file: { file_id: upload.id }
                    }
                ]
            }
        ],
        response_format: { type: "json_object" },
        store: false,
    });

    console.log(completion.choices[0].message.content);
    res.json({message: completion.choices[0].message.content});
}
