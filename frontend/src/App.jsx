import { useEffect, useRef, useState } from "react";
import axios from "axios";

import ReactMarkdown from "react-markdown";

import {
  Prism as SyntaxHighlighter,
} from "react-syntax-highlighter";

import {
  oneDark,
} from "react-syntax-highlighter/dist/esm/styles/prism";

import "./App.css";

import Login from "./Login";

import { supabase } from "./lib/supabase";

import {
  getSupabaseChats,
  createSupabaseChat,
  updateSupabaseChat,
  deleteSupabaseChat,
  getSupabaseMessages,
  saveSupabaseMessage,
} from "./supabaseChatHistory";


function App() {

  const [session, setSession] = useState(null);

  const [authLoading, setAuthLoading] = useState(true);

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([]);

  const [loading, setLoading] = useState(false);

  const [chats, setChats] = useState([]);

  const [activeChatId, setActiveChatId] = useState(null);

  const [selectedImage, setSelectedImage] = useState(null);

  const [imagePreview, setImagePreview] = useState(null);

  const [copiedMessage, setCopiedMessage] = useState(null);

  const [searchText, setSearchText] = useState("");

  const [showSettings, setShowSettings] = useState(false);

  const [showHelp, setShowHelp] = useState(false);

  const [showUpgrade, setShowUpgrade] = useState(false);

  const fileInputRef = useRef(null);

  const messagesEndRef = useRef(null);


  /* =================================
     AUTH SESSION
  ================================= */

  useEffect(() => {

    let mounted = true;

    const loadSession = async () => {

      const {
        data,
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error(
          "Session error:",
          error
        );
      }

      if (mounted) {
        setSession(data?.session || null);
        setAuthLoading(false);
      }

    };

    loadSession();

    const {
      data: listener,
    } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {

        if (mounted) {
          setSession(
            currentSession || null
          );

          setAuthLoading(false);
        }

      }
    );

    return () => {

      mounted = false;

      listener?.subscription?.unsubscribe();

    };

  }, []);


  /* =================================
     LOAD CHATS
  ================================= */

  useEffect(() => {

    if (!session?.user) {
      setChats([]);
      setActiveChatId(null);
      setMessages([]);
      return;
    }

    const loadChats = async () => {

      try {

        const data =
          await getSupabaseChats();

        setChats(data || []);

        if (data && data.length > 0) {

          setActiveChatId(data[0].id);

        } else {

          const newChat =
            await createSupabaseChat(
              "New Chat"
            );

          setChats([newChat]);

          setActiveChatId(
            newChat.id
          );

        }

      } catch (error) {

        console.error(
          "Load chats error:",
          error
        );

      }

    };

    loadChats();

  }, [session]);


  /* =================================
     LOAD ACTIVE CHAT MESSAGES
  ================================= */

  useEffect(() => {

    if (!activeChatId) {
      setMessages([]);
      return;
    }

    const loadMessages = async () => {

      try {

        const data =
          await getSupabaseMessages(
            activeChatId
          );

        const formatted =
          (data || []).map((item) => ({
            id: item.id,
            role: item.role,
            text: item.content || "",
            image:
              item.image_url || null,
          }));

        setMessages(formatted);

      } catch (error) {

        console.error(
          "Load messages error:",
          error
        );

        setMessages([]);

      }

    };

    loadMessages();

  }, [activeChatId]);


  /* =================================
     AUTO SCROLL TO LATEST MESSAGE
  ================================= */

  useEffect(() => {

    if (messagesEndRef.current) {

      messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });

    }

  }, [messages, loading]);


  /* =================================
     CLEAR IMAGE
  ================================= */

  const clearImage = () => {

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);

    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

  };


  /* =================================
     SELECT IMAGE
  ================================= */

  const selectImage = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      alert(
        "Please select an image file."
      );

      return;

    }

    if (file.size > 10 * 1024 * 1024) {

      alert(
        "Please choose an image smaller than 10 MB."
      );

      return;

    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);

    setImagePreview(
      URL.createObjectURL(file)
    );

  };


  /* =================================
     FILE TO BASE64
  ================================= */

  const toBase64 = (file) => {

    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();

        reader.onload = () => {

          const result =
            String(reader.result);

          resolve(
            result.split(",")[1] ||
            result
          );

        };

        reader.onerror = reject;

        reader.readAsDataURL(file);

      }
    );

  };

  /* =================================
     NEW CHAT
  ================================= */

  const newChat = async () => {

    if (loading) return;

    try {

      const chat =
        await createSupabaseChat(
          "New Chat"
        );

      setChats((prev) => [
        chat,
        ...prev,
      ]);

      setActiveChatId(chat.id);

      setMessages([]);

      setMessage("");

      clearImage();

    } catch (error) {

      console.error(
        "New chat error:",
        error
      );

      alert(
        "Unable to create new chat."
      );

    }

  };


  /* =================================
     OPEN CHAT
  ================================= */

  const openChat = (chatId) => {

    if (loading) return;

    setActiveChatId(chatId);

    setMessage("");

    clearImage();

  };


  /* =================================
     DELETE CHAT
  ================================= */

  const removeChat = async (
    event,
    chatId
  ) => {

    event.stopPropagation();

    if (loading) return;

    try {

      await deleteSupabaseChat(
        chatId
      );

      const remaining =
        chats.filter(
          (chat) =>
            chat.id !== chatId
        );

      setChats(remaining);

      if (chatId === activeChatId) {

        if (remaining.length > 0) {

          setActiveChatId(
            remaining[0].id
          );

        } else {

          const chat =
            await createSupabaseChat(
              "New Chat"
            );

          setChats([chat]);

          setActiveChatId(
            chat.id
          );

          setMessages([]);

        }

        clearImage();

      }

    } catch (error) {

      console.error(
        "Delete chat error:",
        error
      );

      alert(
        "Unable to delete chat."
      );

    }

  };


  /* =================================
     UPDATE CHAT TITLE
  ================================= */

  const updateTitleIfNeeded = async (
    chatId,
    text
  ) => {

    const chat =
      chats.find(
        (item) =>
          item.id === chatId
      );

    if (
      !chat ||
      chat.title !== "New Chat"
    ) {
      return;
    }

    const cleanText =
      text.trim();

    if (!cleanText) return;

    let title =
      cleanText.substring(
        0,
        42
      );

    if (cleanText.length > 42) {
      title += "...";
    }

    try {

      const updated =
        await updateSupabaseChat(
          chatId,
          title
        );

      setChats((prev) =>
        prev.map((item) =>
          item.id === chatId
            ? {
                ...item,
                title:
                  updated?.title ||
                  title,
              }
            : item
        )
      );

    } catch (error) {

      console.error(
        "Update title error:",
        error
      );

    }

  };


  /* =================================
     COPY NORMAL MESSAGE
  ================================= */

  const copyMessage = async (
    text,
    index
  ) => {

    if (!text) return;

    try {

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {

        await navigator.clipboard.writeText(
          text
        );

      } else {

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value = text;

        textarea.style.position =
          "fixed";

        textarea.style.left =
          "-9999px";

        document.body.appendChild(
          textarea
        );

        textarea.focus();

        textarea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textarea
        );

      }

      setCopiedMessage(index);

      setTimeout(() => {

        setCopiedMessage(null);

      }, 1500);

    } catch (error) {

      console.error(
        "Copy message failed:",
        error
      );

      alert(
        "Copy failed. Please try again."
      );

    }

  };


  /* =================================
     COPY CODE
  ================================= */

  const copyCode = async (
    codeText
  ) => {

    if (!codeText) return;

    try {

      if (
        navigator.clipboard &&
        window.isSecureContext
      ) {

        await navigator.clipboard.writeText(
          codeText
        );

      } else {

        const textarea =
          document.createElement(
            "textarea"
          );

        textarea.value =
          codeText;

        textarea.style.position =
          "fixed";

        textarea.style.left =
          "-9999px";

        document.body.appendChild(
          textarea
        );

        textarea.focus();

        textarea.select();

        document.execCommand(
          "copy"
        );

        document.body.removeChild(
          textarea
        );

      }

      alert(
        "Code copied! 📋"
      );

    } catch (error) {

      console.error(
        "Copy code failed:",
        error
      );

      alert(
        "Code copy failed."
      );

    }

  };


  /* =================================
     COPY IMAGE
  ================================= */

  const copyImage = async (
    imageUrl
  ) => {

    try {

      const response =
        await fetch(imageUrl);

      const blob =
        await response.blob();

      if (
        navigator.clipboard &&
        window.ClipboardItem
      ) {

        await navigator.clipboard.write([
          new ClipboardItem({
            [blob.type]:
              blob,
          }),
        ]);

        alert(
          "Image copied! 📋"
        );

      } else {

        alert(
          "Image copy is not supported in this browser."
        );

      }

    } catch (error) {

      console.error(
        "Copy image failed:",
        error
      );

      alert(
        "Image copy failed."
      );

    }

  };


  /* =================================
     DOWNLOAD IMAGE
  ================================= */

  const downloadImage = async (
    imageUrl
  ) => {

    try {

      const response =
        await fetch(imageUrl);

      const blob =
        await response.blob();

      const url =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      link.href = url;

      link.download =
        "NEXORA-AI-image.png";

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      window.URL.revokeObjectURL(
        url
      );

    } catch (error) {

      console.error(
        "Download failed:",
        error
      );

      alert(
        "Image download failed."
      );

    }

  };

  /* =================================
     SHARE IMAGE
  ================================= */

  const shareImage = async (
    imageUrl
  ) => {

    try {

      const response =
        await fetch(imageUrl);

      const blob =
        await response.blob();

      const file =
        new File(
          [blob],
          "NEXORA-AI-image.png",
          {
            type:
              blob.type ||
              "image/png",
          }
        );

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({
          files: [file],
        })
      ) {

        await navigator.share({
          title:
            "NEXORA AI",

          text:
            "Created with NEXORA AI ✨",

          files: [file],
        });

      } else if (
        navigator.share
      ) {

        await navigator.share({
          title:
            "NEXORA AI",

          text:
            "Created with NEXORA AI ✨",

          url: imageUrl,
        });

      } else {

        alert(
          "Sharing is not supported on this device."
        );

      }

    } catch (error) {

      if (
        error?.name ===
        "AbortError"
      ) {
        return;
      }

      console.error(
        "Share failed:",
        error
      );

    }

  };


  /* =================================
     SEND MESSAGE
  ================================= */

  const sendMessage = async () => {

    if (
      (
        !message.trim() &&
        !selectedImage
      ) ||
      loading
    ) {
      return;
    }

    const userText =
      message.trim();

    let uploadedImage = null;

    try {

      /* -----------------------------
         CONVERT IMAGE
      ----------------------------- */

      if (selectedImage) {

        uploadedImage = {
          data:
            await toBase64(
              selectedImage
            ),

          mimeType:
            selectedImage.type,
        };

      }


      /* -----------------------------
         USER MESSAGE
      ----------------------------- */

      const userMessage = {
        role: "user",

        text:
          userText ||
          "Please analyze this image.",

        image:
          imagePreview || null,
      };


      const currentMessages =
        [
          ...messages,
          userMessage,
        ];


      setMessages(
        currentMessages
      );

      setMessage("");

      const imageToClear =
        imagePreview;

      clearImage();

      setLoading(true);


      /* -----------------------------
         UPDATE CHAT TITLE
      ----------------------------- */

      if (
        userText &&
        activeChatId
      ) {

        await updateTitleIfNeeded(
          activeChatId,
          userText
        );

      }


      /* -----------------------------
         SAVE USER MESSAGE
      ----------------------------- */

      if (activeChatId) {

        try {

          await saveSupabaseMessage({
            chatId:
              activeChatId,

            role:
              "user",

            content:
              userMessage.text,

            imageUrl:
              imageToClear ||
              null,
          });

        } catch (saveError) {

          console.error(
            "Save user message error:",
            saveError
          );

        }

      }


      /* -----------------------------
         AI REQUEST
      ----------------------------- */

      const response =
        await axios.post(
          "https://nexora-ai-0h7b.onrender.com/api/chat",
          {
            message:
              userText ||
              "Please analyze this uploaded image.",

            image:
              uploadedImage,
          },
          {
            maxContentLength:
              Infinity,

            maxBodyLength:
              Infinity,
          }
        );


      /* -----------------------------
         AI MESSAGE
      ----------------------------- */

      const aiMessage = {
        role: "ai",

        text:
          response.data?.reply ||
          "Sorry, I couldn't generate a response.",

        image:
          response.data?.image ||
          null,
      };


      setMessages((prev) => [
        ...prev,
        aiMessage,
      ]);


      /* -----------------------------
         SAVE AI MESSAGE
      ----------------------------- */

      if (activeChatId) {

        try {

          await saveSupabaseMessage({
            chatId:
              activeChatId,

            role:
              "ai",

            content:
              aiMessage.text,

            imageUrl:
              aiMessage.image ||
              null,
          });

        } catch (saveError) {

          console.error(
            "Save AI message error:",
            saveError
          );

        }

      }

    } catch (error) {

      console.error(
        "NEXORA ERROR:",
        error
      );


      const errorMessage = {
        role: "ai",

        text:
          error.response?.data?.error ||
          "Sorry, I couldn't connect to NEXORA AI.",

        image:
          null,
      };


      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);


      if (activeChatId) {

        try {

          await saveSupabaseMessage({
            chatId:
              activeChatId,

            role:
              "ai",

            content:
              errorMessage.text,

            imageUrl:
              null,
          });

        } catch (saveError) {

          console.error(
            "Save error message failed:",
            saveError
          );

        }

      }

    } finally {

      setLoading(false);

    }

  };


  /* =================================
     SUGGESTION
  ================================= */

  const suggest = (text) => {

    setMessage(text);

  };


  /* =================================
     SEARCH CHATS
  ================================= */

  const filteredChats =
    chats.filter((chat) => {

      if (!searchText.trim()) {
        return true;
      }

      return chat.title
        ?.toLowerCase()
        .includes(
          searchText
            .toLowerCase()
        );

    });


  const todayChats =
    filteredChats.filter(
      (chat) => {

        const date =
          new Date(
            chat.created_at
          );

        const today =
          new Date();

        return (
          date.toDateString() ===
          today.toDateString()
        );

      }
    );


  const previousChats =
    filteredChats.filter(
      (chat) => {

        const date =
          new Date(
            chat.created_at
          );

        const today =
          new Date();

        return (
          date.toDateString() !==
          today.toDateString()
        );

      }
    );

    /* =================================
     MARKDOWN RENDERER
  ================================= */

  const markdown = (text) => {

    return (
      <ReactMarkdown
        components={{

          code({
            inline,
            className,
            children,
            ...props
          }) {

            const match =
              /language-(\w+)/.exec(
                className || ""
              );


            const codeText =
              String(children).replace(
                /\n$/,
                ""
              );


            if (
              !inline &&
              match
            ) {

              return (
                <div className="code-block-wrapper">

                  <div className="code-block-header">

                    <span>
                      {match[1]}
                    </span>

                    <button
                      type="button"
                      className="code-copy-btn"
                      onClick={() =>
                        copyCode(
                          codeText
                        )
                      }
                    >
                      📋 Copy
                    </button>

                  </div>


                  <SyntaxHighlighter
                    style={oneDark}
                    language={
                      match[1]
                    }
                    PreTag="div"
                    wrapLongLines
                    customStyle={{
                      margin: 0,
                      borderRadius:
                        "0 0 12px 12px",
                    }}
                    {...props}
                  >
                    {codeText}
                  </SyntaxHighlighter>

                </div>
              );

            }


            return (
              <code
                className={
                  className
                }
                {...props}
              >
                {children}
              </code>
            );

          },


          p({ children }) {

            return (
              <p>
                {children}
              </p>
            );

          },


          strong({
            children,
          }) {

            return (
              <strong>
                {children}
              </strong>
            );

          },


          a({
            children,
            href,
          }) {

            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
              >
                {children}
              </a>
            );

          },

        }}
      >
        {text || ""}
      </ReactMarkdown>
    );

  };


  /* =================================
     CHAT ITEM
  ================================= */

  const chatItems = (
    list
  ) => {

    if (!list.length) {

      return (
        <div className="no-chats">
          No chats yet
        </div>
      );

    }


    return list.map(
      (chat) => (

        <div
          key={chat.id}
          className={
            `chat-item ${
              chat.id ===
              activeChatId
                ? "active"
                : ""
            }`
          }
          onClick={() =>
            openChat(chat.id)
          }
        >

          <span className="chat-icon">
            💬
          </span>


          <span className="chat-title">
            {chat.title ||
              "New Chat"}
          </span>


          <button
            type="button"
            className="chat-delete"
            onClick={(event) =>
              removeChat(
                event,
                chat.id
              )
            }
          >
            ×
          </button>

        </div>

      )
    );

  };


  /* =================================
     LOGOUT
  ================================= */

  const handleLogout =
    async () => {

      try {

        await supabase.auth.signOut();

      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

      }

    };


  /* =================================
     AUTH LOADING
  ================================= */

  if (authLoading) {

    return (
      <div className="nexora-loading">
        <div>
          <div className="loading-logo">
            N
          </div>

          <h2>
            NEXORA AI
          </h2>

          <p>
            Loading...
          </p>
        </div>
      </div>
    );

  }


  /* =================================
     LOGIN
  ================================= */

  if (!session) {

    return <Login />;

  }

  /* =================================
     MAIN UI
  ================================= */

  return (

    <div className="nexora-app">


      {/* =================================
          SIDEBAR
      ================================= */}

      <aside className="sidebar">


        {/* BRAND */}

        <div className="sidebar-brand">

          <div className="brand-logo">
            N
          </div>

          <div className="brand-text">

            <strong>
              NEXORA
            </strong>

            <span>
              AI
            </span>

          </div>

        </div>


        {/* NEW CHAT */}

        <button
          type="button"
          className="new-chat-btn"
          onClick={newChat}
          disabled={loading}
        >
          <span>
            ＋
          </span>

          New Chat
        </button>


        {/* SEARCH */}

        <div className="chat-search">

          <span>
            🔍
          </span>

          <input
            value={searchText}
            onChange={(event) =>
              setSearchText(
                event.target.value
              )
            }
            placeholder="Search chats..."
          />

        </div>


        {/* CHAT LIST */}

        <div className="sidebar-chats">


          {todayChats.length > 0 && (

            <div className="chat-group">

              <div className="section-title">
                TODAY
              </div>

              {chatItems(
                todayChats
              )}

            </div>

          )}


          {previousChats.length > 0 && (

            <div className="chat-group">

              <div className="section-title">
                PREVIOUS CHATS
              </div>

              {chatItems(
                previousChats
              )}

            </div>

          )}


          {todayChats.length === 0 &&
            previousChats.length === 0 && (

              <div className="no-search-result">
                No chats found
              </div>

            )}

        </div>


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">


          <button
            type="button"
            className="side-item"
            onClick={() =>
              setShowSettings(true)
            }
          >

            <span>
              ⚙
            </span>

            Settings

          </button>


          <button
            type="button"
            className="side-item"
            onClick={() =>
              setShowHelp(true)
            }
          >

            <span>
              ?
            </span>

            Help

          </button>


          <button
            type="button"
            className="side-item"
            onClick={() =>
              setShowUpgrade(true)
            }
          >

            <span>
              ⚡
            </span>

            Upgrade

          </button>


          {/* PROFILE */}

          <div className="profile">

            <div className="profile-avatar">

              {session.user.email
                ?.charAt(0)
                .toUpperCase() ||
                "U"}

            </div>


            <div className="profile-info">

              <strong>
                {session.user.email}
              </strong>

              <small>
                Free plan
              </small>

            </div>


            <button
              type="button"
              className="logout-btn"
              onClick={
                handleLogout
              }
              title="Logout"
            >
              ↪
            </button>

          </div>

        </div>

      </aside>


      {/* =================================
          MAIN
      ================================= */}

      <main className="main">


        {/* TOP BAR */}

        <header className="topbar">

          <div className="topbar-title">

            <strong>
              {messages.length > 0
                ? (
                    chats.find(
                      (chat) =>
                        chat.id ===
                        activeChatId
                    )?.title ||
                    "Chat"
                  )
                : "NEXORA AI"}
            </strong>

            <span>
              Your intelligent AI assistant
            </span>

          </div>


          <button
            type="button"
            className="top-new-chat"
            onClick={newChat}
          >
            ＋ New Chat
          </button>

        </header>


        {/* =================================
            CONTENT
        ================================= */}

        <section
          className={
            `content ${
              messages.length > 0
                ? "chat-active"
                : "empty-chat"
            }`
          }
        >


          {/* =================================
              EMPTY / HOME
          ================================= */}

          {messages.length === 0 ? (

            <div className="home-screen">


              <div className="home-badge">
                ✦ AI POWERED
              </div>


              <h1>
                What can I help you
                <br />

                <span>
                  with today?
                </span>
              </h1>


              <p className="home-description">
                Ask questions, analyze images,
                create images, write code,
                or explore anything with NEXORA AI.
              </p>


              <div className="features">


                <button
                  type="button"
                  className="feature-card"
                  onClick={() =>
                    suggest(
                      "Explain something to me in a simple way"
                    )
                  }
                >

                  <div className="feature-icon">
                    💡
                  </div>

                  <h3>
                    Learn something
                  </h3>

                  <p>
                    Get simple explanations
                  </p>

                </button>


                <button
                  type="button"
                  className="feature-card"
                  onClick={() =>
                    suggest(
                      "Write something for me"
                    )
                  }
                >

                  <div className="feature-icon">
                    ✍️
                  </div>

                  <h3>
                    Write for me
                  </h3>

                  <p>
                    Emails, ideas and content
                  </p>

                </button>


                <button
                  type="button"
                  className="feature-card"
                  onClick={() =>
                    suggest(
                      "Create an image of a futuristic city"
                    )
                  }
                >

                  <div className="feature-icon">
                    🎨
                  </div>

                  <h3>
                    Create an image
                  </h3>

                  <p>
                    Generate AI images
                  </p>

                </button>


                <button
                  type="button"
                  className="feature-card"
                  onClick={() =>
                    suggest(
                      "Help me write code"
                    )
                  }
                >

                  <div className="feature-icon">
                    💻
                  </div>

                  <h3>
                    Code with AI
                  </h3>

                  <p>
                    Build and debug code
                  </p>

                </button>


              </div>


              <div className="quick-actions">

                <button
                  type="button"
                  onClick={() =>
                    suggest(
                      "Give me some unique AI project ideas"
                    )
                  }
                >
                  🚀 Project ideas
                </button>


                <button
                  type="button"
                  onClick={() =>
                    suggest(
                      "Help me learn JavaScript"
                    )
                  }
                >
                  💡 Learn JavaScript
                </button>


                <button
                  type="button"
                  onClick={() =>
                    suggest(
                      "Give me some interesting space facts"
                    )
                  }
                >
                  🌌 Space facts
                </button>

              </div>

            </div>

          ) : (

            /* =================================
               CHAT MESSAGES
            ================================= */

            <div className="messages-area">

              <div className="messages-list">

                {messages.map(
                  (item, index) => (

                    <div
                      key={
                        item.id ||
                        index
                      }
                      className={
                        item.role ===
                        "user"
                          ? "message-row user-row"
                          : "message-row ai-row"
                      }
                    >

                      <div
                        className={
                          item.role ===
                          "user"
                            ? "message-bubble user-message"
                            : "message-bubble ai-message"
                        }
                      >


                        {/* IMAGE */}

                        {item.image && (

                          <>

                            <img
                              src={
                                item.image
                              }
                              alt={
                                item.role ===
                                "user"
                                  ? "Uploaded"
                                  : "Generated by NEXORA AI"
                              }
                              className={
                                item.role ===
                                "user"
                                  ? "chat-image user-image"
                                  : "chat-image ai-image"
                              }
                            />


                            {/* AI IMAGE ACTIONS */}

                            {item.role ===
                              "ai" && (

                              <div className="image-actions">

                                <button
                                  type="button"
                                  onClick={() =>
                                    copyImage(
                                      item.image
                                    )
                                  }
                                >
                                  📋 Copy
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    shareImage(
                                      item.image
                                    )
                                  }
                                >
                                  📤 Share
                                </button>


                                <button
                                  type="button"
                                  onClick={() =>
                                    downloadImage(
                                      item.image
                                    )
                                  }
                                >
                                  ⬇️ Download
                                </button>

                              </div>

                            )}

                          </>

                        )}


                        {/* TEXT */}

                        {item.text && (

                          item.role ===
                          "ai"

                            ? (
                              <div className="markdown-content">

                                {markdown(
                                  item.text
                                )}

                              </div>
                            )

                            : (
                              <div className="user-text">
                                {item.text}
                              </div>
                            )

                        )}


                        {/* AI MESSAGE COPY */}

                        {item.role ===
                          "ai" &&
                          item.text && (

                          <button
                            type="button"
                            className="message-copy-btn"
                            onClick={() =>
                              copyMessage(
                                item.text,
                                index
                              )
                            }
                          >

                            {copiedMessage ===
                            index
                              ? "✓ Copied"
                              : "📋 Copy"}

                          </button>

                        )}

                      </div>

                    </div>

                  )
                )}


                {/* THINKING */}

                {loading && (

                  <div className="message-row ai-row">

                    <div className="message-bubble ai-message thinking">

                      <span>
                        NEXORA is thinking
                      </span>

                      <span className="thinking-dots">
                        <i>.</i>
                        <i>.</i>
                        <i>.</i>
                      </span>

                    </div>

                  </div>

                )}


                <div
                  ref={
                    messagesEndRef
                  }
                />

              </div>

            </div>

          )}


          {/* =================================
              INPUT AREA
          ================================= */}

          <div className="chat-container">


            {/* IMAGE PREVIEW */}

            {imagePreview && (

              <div className="image-preview-wrapper">

                <img
                  src={
                    imagePreview
                  }
                  alt="Selected"
                  className="image-preview"
                />

                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={
                    clearImage
                  }
                >
                  ×
                </button>

              </div>

            )}


            {/* INPUT */}

            <div className="chat-input">

              <input
                ref={
                  fileInputRef
                }
                type="file"
                accept="image/*"
                onChange={
                  selectImage
                }
                style={{
                  display:
                    "none",
                }}
              />


              <button
                type="button"
                className="attach-btn"
                onClick={() =>
                  fileInputRef.current?.click()
                }
                disabled={
                  loading
                }
                title="Upload image"
              >
                📎
              </button>


              <input
                value={
                  message
                }
                onChange={(event) =>
                  setMessage(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {

                  if (
                    event.key ===
                      "Enter" &&
                    !event.shiftKey
                  ) {

                    event.preventDefault();

                    sendMessage();

                  }

                }}
                placeholder={
                  selectedImage
                    ? "Ask something about this image..."
                    : "Message NEXORA AI..."
                }
                disabled={
                  loading
                }
              />


              <button
                type="button"
                className="send-btn"
                onClick={
                  sendMessage
                }
                disabled={
                  loading ||
                  (
                    !message.trim() &&
                    !selectedImage
                  )
                }
              >
                ➤
              </button>

            </div>


            {/* INPUT INFO */}

            

            

          </div>


        </section>

      </main>

      {/* =================================
          SETTINGS MODAL
      ================================= */}

      {showSettings && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowSettings(false)
          }
        >

          <div
            className="modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setShowSettings(false)
              }
            >
              ×
            </button>


            <h2>
              Settings
            </h2>

            <p>
              NEXORA AI settings
            </p>


            <div className="setting-row">

              <span>
                Account
              </span>

              <strong>
                {session.user.email}
              </strong>

            </div>


            <div className="setting-row">

              <span>
                Plan
              </span>

              <strong>
                Free plan
              </strong>

            </div>


          </div>

        </div>

      )}


      {/* =================================
          HELP MODAL
      ================================= */}

      {showHelp && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowHelp(false)
          }
        >

          <div
            className="modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setShowHelp(false)
              }
            >
              ×
            </button>


            <h2>
              Help
            </h2>


            <p>
              Ask NEXORA AI anything,
              upload an image, create
              AI images, or ask for code.
            </p>


            <div className="help-list">

              <div>
                💬 Ask a question
              </div>

              <div>
                📎 Upload an image
              </div>

              <div>
                🎨 Create an AI image
              </div>

              <div>
                💻 Ask for coding help
              </div>

            </div>

          </div>

        </div>

      )}


      {/* =================================
          UPGRADE MODAL
      ================================= */}

      {showUpgrade && (

        <div
          className="modal-overlay"
          onClick={() =>
            setShowUpgrade(false)
          }
        >

          <div
            className="modal-box"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setShowUpgrade(false)
              }
            >
              ×
            </button>


            <h2>
              NEXORA AI
            </h2>


            <p>
              Premium features can be
              added here in the future.
            </p>


            <button
              type="button"
              className="modal-action-btn"
              onClick={() =>
                setShowUpgrade(false)
              }
            >
              Continue with Free Plan
            </button>

          </div>

        </div>

      )}

    </div>

  );

}


export default App;