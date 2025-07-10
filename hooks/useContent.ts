import { useState, useEffect } from "react";
import { ContentConfig, defaultContent } from "../lib/content";

export function useContent() {
  const [content, setContent] = useState<ContentConfig>(defaultContent);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch("/api/content");
        if (response.ok) {
          const data = await response.json();
          setContent(data);
        }
      } catch (error) {
        console.error("Error fetching content:", error);
        // Keep default content on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  return { content, isLoading };
}
