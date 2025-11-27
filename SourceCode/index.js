import OpenAI from "openai";

import dotenv from "dotenv";
dotenv.config();

const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
            role: "user",
            content: "Introduce yourself and your role",
        },
    ],
    store: true,
});

console.log(completion.choices[0].message);