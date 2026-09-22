// =====================================================
// NEXORA CHAT HISTORY
// =====================================================

const STORAGE_KEY = "nexora_chat_history";


// =====================================================
// GET ALL CHATS
// =====================================================

export function getChats() {

  try {

    const saved =
      localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return [];
    }

    return JSON.parse(saved);

  } catch (error) {

    console.error(
      "Failed to load chats:",
      error
    );

    return [];

  }

}


// =====================================================
// SAVE ALL CHATS
// =====================================================

function saveChats(chats) {

  try {

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(chats)
    );

  } catch (error) {

    console.error(
      "Failed to save chats:",
      error
    );

  }

}


// =====================================================
// CREATE NEW CHAT
// =====================================================

export function createChat() {

  const newChat = {

    id:
      Date.now().toString() +
      Math.random()
        .toString(36)
        .substring(2, 9),

    title: "New Chat",

    messages: [],

    createdAt:
      new Date().toISOString(),

    updatedAt:
      new Date().toISOString()

  };


  const chats = getChats();

  const updatedChats = [
    newChat,
    ...chats
  ];


  saveChats(updatedChats);


  return newChat;

}


// =====================================================
// UPDATE CHAT
// =====================================================

export function updateChat(
  chatId,
  updates
) {

  const chats = getChats();


  const updatedChats =
    chats.map((chat) => {

      if (chat.id !== chatId) {
        return chat;
      }


      return {

        ...chat,

        ...updates,

        updatedAt:
          new Date().toISOString()

      };

    });


  saveChats(updatedChats);


  return updatedChats;

}


// =====================================================
// DELETE CHAT
// =====================================================

export function deleteChat(chatId) {

  const chats = getChats();


  const updatedChats =
    chats.filter(
      (chat) =>
        chat.id !== chatId
    );


  saveChats(updatedChats);


  return updatedChats;

}


// =====================================================
// GENERATE CHAT TITLE
// =====================================================

export function generateChatTitle(
  message
) {

  if (!message) {
    return "New Chat";
  }


  let title =
    message
      .trim()
      .replace(/\s+/g, " ");


  // Remove markdown symbols

  title =
    title.replace(
      /[#*_`~]/g,
      ""
    );


  // Maximum title length

  if (title.length > 32) {

    title =
      title.substring(
        0,
        32
      ) + "...";

  }


  if (!title.trim()) {
    return "New Chat";
  }


  return title;

}