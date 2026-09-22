const { GoogleGenerativeAI } = require("@google/generative-ai");
const Groq = require("groq-sdk");


// =========================================
// CONFIGURATION
// =========================================

const TEXT_MODEL = "gemini-2.5-flash";

const VISION_MODEL = "gemini-2.5-flash";

const GROQ_MODEL = "openai/gpt-oss-20b";

const GROQ_VISION_MODEL =
  "qwen/qwen3.8-27b";

// =========================================
// GEMINI CLIENT
// =========================================

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY
);


// =========================================
// GROQ CLIENT
// =========================================

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


// =========================================
// IMAGE REQUEST DETECTION
// =========================================

const isImageRequest = (message = "") => {
  const text = message.toLowerCase().trim();

  const directImageWords = [
    "generate image",
    "create image",
    "make image",
    "generate an image",
    "create an image",
    "make an image",
    "draw an image",
    "generate a picture",
    "create a picture",
    "make a picture",
    "draw a picture",
    "generate photo",
    "create photo",
    "make photo",
    "generate a photo",
    "create a photo",
    "make a photo",
    "image please",
    "picture please",
  ];

  if (
    directImageWords.some((word) =>
      text.includes(word)
    )
  ) {
    return true;
  }

  const imageWords = [
    "image",
    "picture",
    "photo",
    "wallpaper",
    "portrait",
    "illustration",
    "artwork",
    "drawing",
  ];

  const actionWords = [
    "create",
    "generate",
    "make",
    "draw",
    "design",
    "show me",
  ];

  const hasImageWord = imageWords.some((word) =>
    text.includes(word)
  );

  const hasActionWord = actionWords.some((word) =>
    text.includes(word)
  );

  return hasImageWord && hasActionWord;
};


// =========================================
// CLEAN BASE64 IMAGE DATA
// =========================================

const cleanBase64Image = (imageData) => {
  if (!imageData) {
    throw new Error("Image data is missing.");
  }

  // Example:
  // data:image/jpeg;base64,/9j/4AAQ...
  //
  // Gemini/Groq needs only:
  // /9j/4AAQ...

  if (imageData.includes(",")) {
    return imageData.split(",")[1];
  }

  return imageData;
};


// =========================================
// GET IMAGE MIME TYPE
// =========================================

const getImageMimeType = (uploadedImage) => {
  if (
    uploadedImage &&
    uploadedImage.mimeType
  ) {
    return uploadedImage.mimeType;
  }

  return "image/jpeg";
};


// =========================================
// POLLINATIONS IMAGE GENERATION
// =========================================

const generateImage = async (prompt) => {
  console.log(
    "\n========== NEXORA IMAGE GENERATION =========="
  );

  console.log("Provider: Pollinations");
  console.log("Prompt:", prompt);

  try {
    const encodedPrompt =
      encodeURIComponent(prompt);

    const imageUrl =
      `https://gen.pollinations.ai/image/${encodedPrompt}?model=flux`;

    const response = await fetch(imageUrl, {
      headers: {
        Authorization:
          `Bearer ${process.env.POLLINATIONS_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(
        `Pollinations error: ${response.status} ${response.statusText}`
      );
    }

    const arrayBuffer =
      await response.arrayBuffer();

    const buffer =
      Buffer.from(arrayBuffer);

    const contentType =
      response.headers.get(
        "content-type"
      ) || "image/png";

    const base64Image =
      buffer.toString("base64");

    return (
      `data:${contentType};base64,` +
      base64Image
    );

  } catch (error) {
    console.error(
      "\n========== POLLINATIONS ERROR =========="
    );

    console.error(
      error?.message || error
    );

    throw error;
  }
};


// =========================================
// GEMINI NORMAL TEXT GENERATION
// =========================================

const generateText = async (prompt) => {
  console.log(
    "\n========== GEMINI TEXT GENERATION =========="
  );

  console.log(
    "Model:",
    TEXT_MODEL
  );

  try {
    const model =
      genAI.getGenerativeModel({
        model: TEXT_MODEL,

        tools: [
          {
            googleSearch: {},
          },
        ],
      });

    const result =
      await model.generateContent(
        prompt
      );

    const response =
      result.response;

    const text =
      response.text();

    if (
      !text ||
      !text.trim()
    ) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    return text;

  } catch (error) {
    console.error(
      "\n========== GEMINI ERROR =========="
    );

    console.error(
      error?.message || error
    );

    throw error;
  }
};


// =========================================
// GEMINI IMAGE UNDERSTANDING
// =========================================

const generateVisionResponse = async (
  prompt,
  uploadedImage
) => {
  console.log(
    "\n========== GEMINI IMAGE ANALYSIS =========="
  );

  console.log(
    "Model:",
    VISION_MODEL
  );

  try {

    if (
      !uploadedImage ||
      !uploadedImage.data
    ) {
      throw new Error(
        "Uploaded image data is missing."
      );
    }

    // ---------------------------------------
    // CLEAN BASE64
    // ---------------------------------------

    const base64Image =
      cleanBase64Image(
        uploadedImage.data
      );

    const mimeType =
      getImageMimeType(
        uploadedImage
      );

    console.log(
      "Image MIME type:",
      mimeType
    );

    console.log(
      "Image data received: YES"
    );


    // ---------------------------------------
    // GEMINI VISION MODEL
    // ---------------------------------------

    const model =
      genAI.getGenerativeModel({
        model: VISION_MODEL,
      });


    // ---------------------------------------
    // IMAGE PART
    // ---------------------------------------

    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: mimeType,
      },
    };


    // ---------------------------------------
    // USER PROMPT
    // ---------------------------------------

    const finalPrompt =
      prompt &&
      prompt.trim()
        ? prompt
        : `
Analyze this image carefully.

Describe what is visible in the image.

Identify:
- objects
- people
- animals
- places
- colors
- text
- actions
- important details
- overall context

If there is text in the image, read it
and explain it.

If the user asks a specific question
about the image, answer that question
directly.

Only describe information that can
reasonably be determined from the image.
Do not invent details.
`;


    console.log(
      "Vision prompt:",
      finalPrompt
    );


    // ---------------------------------------
    // SEND IMAGE + TEXT TO GEMINI
    // ---------------------------------------

    const result =
      await model.generateContent([
        {
          text: finalPrompt,
        },

        imagePart,
      ]);


    const response =
      result.response;

    const text =
      response.text();


    // ---------------------------------------
    // VALIDATE RESPONSE
    // ---------------------------------------

    if (
      !text ||
      !text.trim()
    ) {
      throw new Error(
        "Gemini Vision returned an empty response."
      );
    }


    console.log(
      "Gemini Vision response received ✅"
    );

    return text;

  } catch (error) {

    console.error(
      "\n========== GEMINI VISION ERROR =========="
    );

    console.error(
      error?.message || error
    );

    throw error;
  }
};


// =========================================
// GROQ NORMAL TEXT GENERATION
// =========================================

const generateGroqText = async (prompt) => {
  console.log(
    "\n========== GROQ TEXT GENERATION =========="
  );

  console.log(
    "Model:",
    GROQ_MODEL
  );

  try {

    const completion =
      await groq.chat.completions.create({
        model: GROQ_MODEL,

        messages: [
          {
            role: "system",

            content:
              "You are NEXORA AI, a helpful, intelligent and friendly AI assistant. Give clear, accurate and useful answers. Use Markdown when it helps readability.",
          },

          {
            role: "user",

            content: prompt,
          },
        ],
      });


    const text =
      completion
        ?.choices?.[0]
        ?.message?.content;


    if (
      !text ||
      !text.trim()
    ) {
      throw new Error(
        "Groq returned an empty response."
      );
    }


    return text;

  } catch (error) {

    console.error(
      "\n========== GROQ ERROR =========="
    );

    console.error(
      error?.message || error
    );

    throw error;
  }
};


// =========================================
// GROQ IMAGE UNDERSTANDING
// =========================================

const generateGroqVisionResponse = async (
  prompt,
  uploadedImage
) => {

  console.log(
    "\n========== GROQ IMAGE ANALYSIS =========="
  );

  console.log(
    "Model:",
    GROQ_VISION_MODEL
  );

  try {

    if (
      !uploadedImage ||
      !uploadedImage.data
    ) {
      throw new Error(
        "Uploaded image data is missing."
      );
    }


    // ---------------------------------------
    // CLEAN BASE64
    // ---------------------------------------

    const base64Image =
      cleanBase64Image(
        uploadedImage.data
      );

    const mimeType =
      getImageMimeType(
        uploadedImage
      );


    console.log(
      "Image MIME type:",
      mimeType
    );


    // ---------------------------------------
    // PROMPT
    // ---------------------------------------

    const visionPrompt =
      prompt &&
      prompt.trim()
        ? prompt
        : "Describe this image in detail.";


    // ---------------------------------------
    // GROQ VISION
    // ---------------------------------------

    const completion =
      await groq.chat.completions.create({

        model:
          GROQ_VISION_MODEL,

        messages: [

          {
            role: "system",

            content:
              "You are NEXORA AI. Carefully analyze the user's image and answer questions about what is visible. Read visible text when possible. Do not invent details that cannot be determined from the image.",
          },

          {
            role: "user",

            content: [

              {
                type: "text",

                text:
                  visionPrompt,
              },

              {
                type: "image_url",

                image_url: {
                  url:
                    `data:${mimeType};base64,${base64Image}`,
                },
              },

            ],
          },

        ],
      });


    // ---------------------------------------
    // RESPONSE
    // ---------------------------------------

    const text =
      completion
        ?.choices?.[0]
        ?.message?.content;


    if (
      !text ||
      !text.trim()
    ) {
      throw new Error(
        "Groq Vision returned an empty response."
      );
    }


    console.log(
      "Groq Vision response received ✅"
    );


    return text;

  } catch (error) {

    console.error(
      "\n========== GROQ VISION ERROR =========="
    );

    console.error(
      error?.message || error
    );

    throw error;
  }
};


// =========================================
// MAIN AI RESPONSE
// =========================================

const generateAIResponse = async (
  message,
  uploadedImage = null
) => {

  console.log(
    "\n========================================"
  );

  console.log(
    "             NEXORA AI"
  );

  console.log(
    "========================================"
  );

  console.log(
    "User:",
    message
  );

  console.log(
    "Image:",
    uploadedImage
      ? "YES"
      : "NO"
  );


  // =======================================
  // UPLOADED IMAGE
  // =======================================

  if (uploadedImage) {

    console.log(
      "\nRequest Type: IMAGE ANALYSIS"
    );


    // ---------------------------------------
    // GEMINI VISION FIRST
    // ---------------------------------------

    try {

      console.log(
        "\nTrying Gemini Vision..."
      );


      const text =
        await generateVisionResponse(
          message,
          uploadedImage
        );


      console.log(
        "Gemini Vision successful ✅"
      );


      return {

        text,

        image: null,

        type: "text",

        provider:
          "gemini-vision",
      };

    } catch (
      geminiVisionError
    ) {

      console.log(
        "\nGemini Vision failed."
      );

      console.log(
        "Switching to Groq Vision..."
      );


      // -------------------------------------
      // GROQ VISION FALLBACK
      // -------------------------------------

      try {

        const text =
          await generateGroqVisionResponse(
            message,
            uploadedImage
          );


        console.log(
          "Groq Vision successful ✅"
        );


        return {

          text,

          image: null,

          type: "text",

          provider:
            "groq-vision",
        };

      } catch (
        groqVisionError
      ) {

        console.error(
          "\n========== ALL VISION PROVIDERS FAILED =========="
        );


        console.error(
          "Gemini Vision:",
          geminiVisionError
            ?.message ||
            geminiVisionError
        );


        console.error(
          "Groq Vision:",
          groqVisionError
            ?.message ||
            groqVisionError
        );


        throw new Error(
          "NEXORA AI could not analyze this image. Please try another image."
        );
      }
    }
  }


  // =======================================
  // IMAGE GENERATION
  // =======================================

  if (
    isImageRequest(message)
  ) {

    console.log(
      "\nRequest Type: IMAGE GENERATION"
    );


    const image =
      await generateImage(
        message
      );


    return {

      text:
        "Here is the image I created for you ✨",

      image,

      type: "image",

      provider:
        "pollinations",
    };
  }


  // =======================================
  // NORMAL TEXT REQUEST
  // =======================================

  console.log(
    "\nRequest Type: TEXT"
  );


  // =======================================
  // GEMINI FIRST
  // =======================================

  try {

    console.log(
      "\nTrying Gemini..."
    );


    const text =
      await generateText(
        message
      );


    console.log(
      "Gemini response successful ✅"
    );


    return {

      text,

      image: null,

      type: "text",

      provider:
        "gemini",
    };

  } catch (
    geminiError
  ) {

    console.log(
      "\nGemini failed."
    );

    console.log(
      "Switching to Groq fallback..."
    );


    // =====================================
    // GROQ FALLBACK
    // =====================================

    try {

      const text =
        await generateGroqText(
          message
        );


      console.log(
        "Groq response successful ✅"
      );


      return {

        text,

        image: null,

        type: "text",

        provider:
          "groq",
      };

    } catch (
      groqError
    ) {

      console.error(
        "\n========== ALL AI PROVIDERS FAILED =========="
      );


      console.error(
        "Gemini:",
        geminiError
          ?.message ||
          geminiError
      );


      console.error(
        "Groq:",
        groqError
          ?.message ||
          groqError
      );


      throw new Error(
        "NEXORA AI is temporarily unavailable. Please try again later."
      );
    }
  }
};


// =========================================
// EXPORTS
// =========================================

module.exports = {

  generateImage,

  generateText,

  generateVisionResponse,

  generateGroqText,

  generateGroqVisionResponse,

  generateAIResponse,

  isImageRequest,

};