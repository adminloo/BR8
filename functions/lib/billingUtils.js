"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.disableBillingForProject = void 0;
const billing_1 = require("@google-cloud/billing");
async function disableBillingForProject() {
    try {
        const billingClient = new billing_1.CloudBillingClient();
        const projectId = process.env.GOOGLE_CLOUD_PROJECT || "iosbr2";
        const [project] = await billingClient.getProjectBillingInfo({
            name: `projects/${projectId}`,
        });
        if (project.billingAccountName) {
            await billingClient.updateProjectBillingInfo({
                name: `projects/${projectId}`,
                projectBillingInfo: {
                    billingAccountName: "",
                },
            });
            console.log(`Billing disabled for project: ${projectId}`);
            return true;
        }
        else {
            console.log(`Billing already disabled for project: ${projectId}`);
            return true;
        }
    }
    catch (error) {
        console.error("Error disabling billing:", error);
        return false;
    }
}
exports.disableBillingForProject = disableBillingForProject;
//# sourceMappingURL=billingUtils.js.map