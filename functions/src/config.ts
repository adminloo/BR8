// Configuration constants for the Firebase Functions

export const discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";

// Threshold for disabling billing (as a fraction of budget)
export const DISABLE_BILLING_THRESHOLD = 0.9; // 90% of budget 