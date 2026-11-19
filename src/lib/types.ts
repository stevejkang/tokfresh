export interface SetupState {
  step: number;
  claudeRefreshToken: string | null;
  claudeAccessToken: string | null;
  claudeEmail: string | null;
  claudeLoginExpiresAt: number | null;
  claudeLoginLifetimeDays: number | null;
  reminderToken: string | null;
  reminderOptOut: boolean;
  reminderUseClaudeEmail: boolean;
  reminderEmail: string;
  startTime: string;
  timezone: string;
  notificationType: "none" | "slack" | "discord";
  notificationWebhook: string;
  notifyOnFailureOnly: boolean;
  cloudflareApiToken: string;
  cloudflareAccountId: string;
  enableLogs: boolean;
  enableTraces: boolean;
  deploymentStatus: "idle" | "deploying" | "success" | "error";
  deploymentError: string | null;
  deploymentErrorCode: number | null;
  workerName: string | null;
}

export const INITIAL_SETUP_STATE: SetupState = {
  step: 1,
  claudeRefreshToken: null,
  claudeAccessToken: null,
  claudeEmail: null,
  claudeLoginExpiresAt: null,
  claudeLoginLifetimeDays: null,
  reminderToken: null,
  reminderOptOut: false,
  reminderUseClaudeEmail: true,
  reminderEmail: "",
  startTime: "06:00",
  timezone: "Asia/Seoul",
  notificationType: "none",
  notificationWebhook: "",
  notifyOnFailureOnly: false,
  cloudflareApiToken: "",
  cloudflareAccountId: "",
  enableLogs: true,
  enableTraces: true,
  deploymentStatus: "idle",
  deploymentError: null,
  deploymentErrorCode: null,
  workerName: null,
};
