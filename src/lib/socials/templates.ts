export const SOCIAL_TEMPLATES = [
  { id: "default", label: "Default" },
] as const;

export type SocialTemplateId = (typeof SOCIAL_TEMPLATES)[number]["id"];
