import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PortalMessage {
  id: string;
  buyer_id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export function usePortalMessages(buyerId: string) {
  const [messages, setMessages] = useState<PortalMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch existing messages on mount
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from("buyer_portal_messages")
          .select("*")
          .eq("buyer_id", buyerId)
          .order("created_at", { ascending: true });

        if (error) {
          console.error("Error fetching portal messages:", error);
        } else {
          setMessages(data as PortalMessage[] || []);
        }
      } catch (err) {
        console.error("Error fetching portal messages:", err);
      } finally {
        setIsLoading(false);
      }
    };

    if (buyerId) {
      fetchMessages();
    }
  }, [buyerId]);

  // Add a message to the database and local state
  const addMessage = useCallback(async (role: "user" | "assistant", content: string) => {
    const newMessage: Omit<PortalMessage, "id"> = {
      buyer_id: buyerId,
      role,
      content,
      created_at: new Date().toISOString(),
    };

    // Optimistically add to local state
    const tempId = `temp-${Date.now()}`;
    const tempMessage: PortalMessage = { ...newMessage, id: tempId };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const { data, error } = await supabase
        .from("buyer_portal_messages")
        .insert({
          buyer_id: buyerId,
          role,
          content,
        })
        .select()
        .single();

      if (error) {
        console.error("Error saving message:", error);
        // Keep the temp message but log error
      } else if (data) {
        // Replace temp message with real one
        setMessages(prev =>
          prev.map(m => m.id === tempId ? (data as PortalMessage) : m)
        );
      }
    } catch (err) {
      console.error("Error saving message:", err);
    }
  }, [buyerId]);

  // Update the last assistant message (for streaming)
  const updateLastAssistantMessage = useCallback((content: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
        newMessages[lastIndex] = { ...newMessages[lastIndex], content };
      }
      return newMessages;
    });
  }, []);

  // Finalize the last assistant message (save to DB after streaming complete)
  const finalizeLastAssistantMessage = useCallback(async (content: string) => {
    setMessages(prev => {
      const newMessages = [...prev];
      const lastIndex = newMessages.length - 1;
      if (lastIndex >= 0 && newMessages[lastIndex].role === "assistant") {
        newMessages[lastIndex] = { ...newMessages[lastIndex], content };
      }
      return newMessages;
    });

    // Save to database
    try {
      const { error } = await supabase
        .from("buyer_portal_messages")
        .insert({
          buyer_id: buyerId,
          role: "assistant",
          content,
        });

      if (error) {
        console.error("Error saving assistant message:", error);
      }
    } catch (err) {
      console.error("Error saving assistant message:", err);
    }
  }, [buyerId]);

  return {
    messages,
    isLoading,
    addMessage,
    updateLastAssistantMessage,
    finalizeLastAssistantMessage,
    setMessages,
  };
}
