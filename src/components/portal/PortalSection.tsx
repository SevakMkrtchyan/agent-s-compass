import { cn } from "@/lib/utils";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

interface PortalSectionProps {
  title: string;
  children: React.ReactNode;
  status?: "completed" | "current" | "upcoming";
  collapsible?: boolean;
  defaultExpanded?: boolean;
}

export function PortalSection({ 
  title, 
  children, 
  status = "current",
  collapsible = false,
  defaultExpanded = true,
}: PortalSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const isCompleted = status === "completed";
  const isCurrent = status === "current";
  const isUpcoming = status === "upcoming";

  return (
    <section 
      className={cn(
        "transition-all duration-300",
        isCompleted && "opacity-60",
        isUpcoming && "opacity-40"
      )}
    >
      {/* Section header */}
      <div 
        className={cn(
          "flex items-center gap-3 mb-4",
          collapsible && "cursor-pointer"
        )}
        onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
      >
        {/* Status indicator */}
        <div className={cn(
          "flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center",
          isCompleted && "bg-green-500/20",
          isCurrent && "bg-primary/20",
          isUpcoming && "bg-muted"
        )}>
          {isCompleted ? (
            <Check className="w-3 h-3 text-green-600" />
          ) : (
            <div className={cn(
              "w-2 h-2 rounded-full",
              isCurrent && "bg-primary",
              isUpcoming && "bg-muted-foreground/30"
            )} />
          )}
        </div>

        <h2 className={cn(
          "text-lg font-medium flex-1",
          isCurrent && "text-foreground",
          isCompleted && "text-foreground/70",
          isUpcoming && "text-muted-foreground"
        )}>
          {title}
        </h2>

        {collapsible && (
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Section content */}
      {(!collapsible || isExpanded) && (
        <div className={cn(
          "pl-8", // Align with title after status indicator
          isCurrent && "text-foreground",
          isCompleted && "text-foreground/60",
          isUpcoming && "text-muted-foreground"
        )}>
          {children}
        </div>
      )}
    </section>
  );
}

// Sub-component for section content blocks
interface SectionContentProps {
  children: React.ReactNode;
  className?: string;
}

export function SectionContent({ children, className }: SectionContentProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {children}
    </div>
  );
}

// Sub-component for markdown content
interface SectionMarkdownProps {
  content: string;
}

export function SectionMarkdown({ content }: SectionMarkdownProps) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-2 prose-p:leading-relaxed prose-ul:my-2 prose-li:my-0.5 prose-headings:my-2.5 prose-headings:font-medium prose-h2:text-sm prose-h3:text-sm">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
