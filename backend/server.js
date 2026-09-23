// =====================================================
// NEXORA AI BACKEND
// =====================================================

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const { generateAIResponse } = require("./services/gemini");
const supabase = require("./lib/supabase");

const app = express();

// =====================================================
// MIDDLEWARE
// =====================================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://neexora-ai.netlify.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

app.use(
  express.json({
    limit: "20mb",
  })
);

// =====================================================
// HOME
// =====================================================

app.get("/", (req, res) => {
  res.json({
    message: "Nexora AI Backend is running 🚀",
  });
});

// =====================================================
// SUPABASE TEST
// =====================================================

app.get("/api/supabase-test", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("nexora_test")
      .select("*")
      .limit(1);

    if (error) {
      console.error(
        "❌ Supabase test error:",
        error.message
      );

      return res.status(500).json({
        success: false,
        error: error.message,
      });
    }

    res.json({
      success: true,
      message: "Supabase connected successfully 🚀",
      data: data,
    });

  } catch (error) {
    console.error(
      "❌ Supabase error:",
      error.message
    );

    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// =====================================================
// CHAT
// =====================================================

app.post("/api/chat", async (req, res) => {
  try {
    const { message, image } = req.body;

    // -----------------------------------------------
    // Validate message
    // -----------------------------------------------

    if (!message || !message.trim()) {
      return res.status(400).json({
        error: "Message is required",
      });
    }

    // -----------------------------------------------
    // Uploaded image
    // -----------------------------------------------

    let uploadedImage = null;

    if (image && image.data) {
      uploadedImage = {
        data: image.data,
        mimeType:
          image.mimeType || "image/jpeg",
      };
    }

    // -----------------------------------------------
    // Gemini / Pollinations
    // -----------------------------------------------

    const result = await generateAIResponse(
      message,
      uploadedImage
    );

    // -----------------------------------------------
    // Send response
    // -----------------------------------------------

    res.json({
      type: result.type || "text",
      reply: result.text || "",
      image: result.image || null,
    });

  } catch (error) {

    console.error(
      "❌ Nexora Server Error:",
      error
    );

    res.status(500).json({
      error:
        "Nexora AI could not process your request",
    });
  }
});

// =====================================================
// SERVER
// =====================================================

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(
    `🚀 Nexora backend running on http://localhost:${PORT}`
  );
});