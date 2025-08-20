"use strict";
// Configuration constants for the Firebase Functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISABLE_BILLING_THRESHOLD = exports.discordWebhookUrl = void 0;
exports.discordWebhookUrl = process.env.DISCORD_WEBHOOK_URL || "";
// Threshold for disabling billing (as a fraction of budget)
exports.DISABLE_BILLING_THRESHOLD = 0.9; // 90% of budget 
//# sourceMappingURL=config.js.map