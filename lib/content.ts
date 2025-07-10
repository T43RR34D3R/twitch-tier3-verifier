// Editable content configuration
export interface ContentConfig {
  mainPage: {
    title: string;
    subtitle: string;
    signInPrompt: string;
  };
  accountPage: {
    title: string;
  };
  signinPage: {
    title: string;
  };
}

// Default content
export const defaultContent: ContentConfig = {
  mainPage: {
    title: "Tier 3 Verification",
    subtitle: "Verify your Tier 3 subscription to access exclusive content",
    signInPrompt: "Please sign in with your Twitch account to verify your subscription status.",
  },
  accountPage: {
    title: "Your Twitch Account",
  },
  signinPage: {
    title: "Sign in to continue",
  },
};

// Simple file-based storage (in a real app, use a database)
let currentContent: ContentConfig = { ...defaultContent };

export function getContent(): ContentConfig {
  return currentContent;
}

export function updateContent(newContent: Partial<ContentConfig>): ContentConfig {
  currentContent = {
    mainPage: { ...currentContent.mainPage, ...newContent.mainPage },
    accountPage: { ...currentContent.accountPage, ...newContent.accountPage },
    signinPage: { ...currentContent.signinPage, ...newContent.signinPage },
  };
  return currentContent;
}
