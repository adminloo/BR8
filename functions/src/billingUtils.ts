import { CloudBillingClient } from "@google-cloud/billing";

export async function disableBillingForProject(): Promise<boolean> {
  try {
    const billingClient = new CloudBillingClient();
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
    } else {
      console.log(`Billing already disabled for project: ${projectId}`);
      return true;
    }
  } catch (error) {
    console.error("Error disabling billing:", error);
    return false;
  }
} 