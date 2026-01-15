import { useState, useCallback, useRef } from "react";
import type { Buyer } from "@/types";

interface BuyerContext {
  name: string;
  email?: string;
  currentStage: number;
  financingConfirmed: boolean;
  buyerType?: string;
  marketContext?: string;
  recentActivity?: string[];
}

interface UseAgentGPTStreamReturn {
  isStreaming: boolean;
  streamedContent: string;
  error: string | null;
  streamArtifact: (command: string, buyer: Buyer) => Promise<void>;
  streamThinking: (command: string, buyer: Buyer) => Promise<void>;
  cancelStream: () => void;
  clearStream: () => void;
  clearError: () => void;
}

function buyerToContext(buyer: Buyer): BuyerContext {
  return {
    name: buyer.name,
    email: buyer.email,
    currentStage: buyer.currentStage,
    financingConfirmed: buyer.financingConfirmed,
    buyerType: buyer.buyerType,
    marketContext: buyer.marketContext,
    recentActivity: [],
  };
}

export function useAgentGPTStream(): UseAgentGPTStreamReturn {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const clearError = useCallback(() => setError(null), []);
  const clearStream = useCallback(() => setStreamedContent(""), []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  const streamFromClaude = async (
    command: string,
    intent: "artifact" | "thinking",
    buyerContext: BuyerContext
  ) => {
    // Cancel any existing stream
    cancelStream();

    setIsStreaming(true);
    setStreamedContent("");
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/agentgpt-stream`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ command, intent, buyerContext }),
          signal: abortControllerRef.current.signal,
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to start stream");
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Parse SSE events from Anthropic
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6).trim();
            if (data === "[DONE]") continue;

            try {
              const parsed = JSON.parse(data);
              
              // Anthropic streaming format
              if (parsed.type === "content_block_delta" && parsed.delta?.text) {
                setStreamedContent((prev) => prev + parsed.delta.text);
              }
            } catch {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.startsWith("data: ")) {
        const data = buffer.slice(6).trim();
        if (data && data !== "[DONE]") {
          try {
            const parsed = JSON.parse(data);
            if (parsed.type === "content_block_delta" && parsed.delta?.text) {
              setStreamedContent((prev) => prev + parsed.delta.text);
            }
          } catch {
            // Ignore
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Stream was cancelled
        return;
      }
      const message = err instanceof Error ? err.message : "Stream failed";
      setError(message);
      throw err;
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const streamArtifact = useCallback(async (command: string, buyer: Buyer) => {
    const context = buyerToContext(buyer);
    await streamFromClaude(command, "artifact", context);
  }, []);

  const streamThinking = useCallback(async (command: string, buyer: Buyer) => {
    const context = buyerToContext(buyer);
    await streamFromClaude(command, "thinking", context);
  }, []);

  return {
    isStreaming,
    streamedContent,
    error,
    streamArtifact,
    streamThinking,
    cancelStream,
    clearStream,
    clearError,
  };
}
