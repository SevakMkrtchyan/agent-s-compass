import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface StreamingTextProps {
  content: string;
  isComplete: boolean;
  className?: string;
  speed?: number; // chars per tick
}

export function StreamingText({
  content,
  isComplete,
  className,
  speed = 3,
}: StreamingTextProps) {
  const [displayedContent, setDisplayedContent] = useState("");
  const [showCursor, setShowCursor] = useState(true);
  const contentRef = useRef("");
  const displayedRef = useRef("");

  // When content changes, update the ref
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Typewriter effect
  useEffect(() => {
    if (!content) {
      setDisplayedContent("");
      displayedRef.current = "";
      return;
    }

    const interval = setInterval(() => {
      if (displayedRef.current.length < contentRef.current.length) {
        const nextChars = contentRef.current.slice(
          displayedRef.current.length,
          displayedRef.current.length + speed
        );
        displayedRef.current += nextChars;
        setDisplayedContent(displayedRef.current);
      } else if (isComplete) {
        clearInterval(interval);
        setShowCursor(false);
      }
    }, 30);

    return () => clearInterval(interval);
  }, [content, isComplete, speed]);

  // Cursor blink
  useEffect(() => {
    if (isComplete && displayedRef.current.length >= contentRef.current.length) {
      setShowCursor(false);
      return;
    }

    const cursorInterval = setInterval(() => {
      setShowCursor((prev) => !prev);
    }, 530);

    return () => clearInterval(cursorInterval);
  }, [isComplete]);

  // Parse basic markdown
  const renderMarkdown = (text: string) => {
    // Split by lines for block-level elements
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];

    lines.forEach((line, i) => {
      // Headers
      if (line.startsWith("## ")) {
        elements.push(
          <h3 key={i} className="font-semibold text-foreground mt-3 mb-1.5 first:mt-0">
            {parseInline(line.slice(3))}
          </h3>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h2 key={i} className="font-bold text-lg text-foreground mt-4 mb-2 first:mt-0">
            {parseInline(line.slice(2))}
          </h2>
        );
      }
      // Bullet points
      else if (line.startsWith("- ") || line.startsWith("• ")) {
        elements.push(
          <li key={i} className="ml-4 text-foreground/90">
            {parseInline(line.slice(2))}
          </li>
        );
      }
      // Numbered lists
      else if (/^\d+\.\s/.test(line)) {
        const content = line.replace(/^\d+\.\s/, "");
        elements.push(
          <li key={i} className="ml-4 text-foreground/90 list-decimal">
            {parseInline(content)}
          </li>
        );
      }
      // Empty lines
      else if (line.trim() === "") {
        elements.push(<br key={i} />);
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={i} className="text-foreground/90">
            {parseInline(line)}
          </p>
        );
      }
    });

    return elements;
  };

  // Parse inline markdown (bold, italic)
  const parseInline = (text: string): (string | JSX.Element)[] => {
    const parts: (string | JSX.Element)[] = [];
    let remaining = text;
    let keyCounter = 0;

    while (remaining.length > 0) {
      // Bold **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      if (boldMatch && boldMatch.index !== undefined) {
        if (boldMatch.index > 0) {
          parts.push(remaining.slice(0, boldMatch.index));
        }
        parts.push(
          <strong key={keyCounter++} className="font-semibold text-foreground">
            {boldMatch[1]}
          </strong>
        );
        remaining = remaining.slice(boldMatch.index + boldMatch[0].length);
        continue;
      }

      // No more matches
      parts.push(remaining);
      break;
    }

    return parts;
  };

  return (
    <div className={cn("leading-relaxed space-y-1", className)}>
      {renderMarkdown(displayedContent)}
      {showCursor && (
        <span className="inline-block w-0.5 h-4 bg-accent animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  );
}

// Thinking dots animation
export function ThinkingDots() {
  return (
    <div className="flex items-center gap-1 py-2">
      <span className="text-sm text-muted-foreground">Thinking</span>
      <div className="flex gap-0.5">
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}
