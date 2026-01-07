// White-label configuration for brokerage customization
// Update these values to customize the platform for different brokerages

export interface WhiteLabelConfig {
  brokerage: {
    name: string;
    shortName: string; // 2-3 letter abbreviation for logo
    logoUrl?: string; // Optional custom logo URL (overrides shortName)
  };
  colors?: {
    primary?: string;
    accent?: string;
  };
  support: {
    email: string;
    phone?: string;
    chatEnabled: boolean;
  };
}

export const whiteLabelConfig: WhiteLabelConfig = {
  brokerage: {
    name: "HomeGuide",
    shortName: "HG",
    // logoUrl: "/path/to/logo.svg", // Uncomment to use custom logo
  },
  support: {
    email: "support@homeguide.com",
    phone: "1-800-HOME-GDE",
    chatEnabled: true,
  },
};
