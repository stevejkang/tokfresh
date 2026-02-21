export interface SetupState {
  step: number;
  claudeRefreshToken: string | null;
  claudeAccessToken: string | null;
  startTime: string;
  timezone: string;
  notificationType: "none" | "slack" | "discord";
  notificationWebhook: string;
  notifyOnFailureOnly: boolean;
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  deploymentStatus: "idle" | "deploying" | "success" | "error";
  deploymentError: string | null;
  deploymentErrorCode: number | null;
}

export const INITIAL_SETUP_STATE: SetupState = {
  step: 1,
  claudeRefreshToken: null,
  claudeAccessToken: null,
  startTime: "06:00",
  timezone: "Asia/Seoul",
  notificationType: "none",
  notificationWebhook: "",
  notifyOnFailureOnly: false,
  cloudflareApiToken: "",
  cloudflareAccountId: "",
  deploymentStatus: "idle",
  deploymentError: null,
  deploymentErrorCode: null,
};
