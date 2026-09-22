const Groq = require("groq-sdk");

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const GROQ_MODEL = "openai/gpt-oss-20b";

const generateGroqText = async (prompt) => {
  console.log("\n========== GROQ TEXT GENERATION ==========");
  console.log("Model:", GROQ_MODEL);

  try {
    const completion =
      await groq.chat.completions.create({
        model: GROQ_MODEL,

        messages: [
          {
            role: "system",
            content:
              "You are NEXORA AI, a helpful and intelligent AI assistant. Give clear, accurate and friendly answers.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      });

    return (
      completion.choices?.[0]?.message?.content ||
      "Sorry, I couldn't generate a response."
    );
  } catch (error) {
    console.error(
      "========== GROQ ERROR =========="
    );

    console.error(
      error?.message || error
    );

    throw error;
  }
};

module.exports = {
  generateGroqText,
};