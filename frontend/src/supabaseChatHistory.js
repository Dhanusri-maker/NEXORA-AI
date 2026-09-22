import { supabase } from "./lib/supabase";

// Get current logged-in user
const getUser = async () => {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
};

// GET ALL CHATS
export const getSupabaseChats = async () => {
  const user = await getUser();

  if (!user) return [];

  const { data, error } = await supabase
    .from("chats")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Get chats error:", error);
    return [];
  }

  return data || [];
};

// CREATE CHAT
export const createSupabaseChat = async (title = "New Chat") => {
  const user = await getUser();

  if (!user) {
    throw new Error("User is not logged in");
  }

  const { data, error } = await supabase
    .from("chats")
    .insert([
      {
        user_id: user.id,
        title,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// DELETE CHAT
export const deleteSupabaseChat = async (chatId) => {
  const { error } = await supabase
    .from("chats")
    .delete()
    .eq("id", chatId);

  if (error) {
    throw error;
  }

  return true;
};

// GET MESSAGES
export const getSupabaseMessages = async (chatId) => {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Get messages error:", error);
    return [];
  }

  return data || [];
};

// SAVE MESSAGE
export const saveSupabaseMessage = async ({
  chatId,
  role,
  content,
  imageUrl = null,
}) => {
  const { data, error } = await supabase
    .from("messages")
    .insert([
      {
        chat_id: chatId,
        role,
        content,
        image_url: imageUrl,
      },
    ])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

// UPDATE CHAT TITLE
export const updateSupabaseChat = async (chatId, title) => {
  const { data, error } = await supabase
    .from("chats")
    .update({
      title,
    })
    .eq("id", chatId)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};