"use strict";

/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import * as admin from "firebase-admin";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onRequest } from "firebase-functions/v2/https";
import { onMessagePublished } from "firebase-functions/v2/pubsub";
import fetch from "node-fetch";
import * as nodemailer from "nodemailer";
import { disableBillingForProject } from "./billingUtils";
import { DISABLE_BILLING_THRESHOLD, discordWebhookUrl } from "./config";

// Initialize Firebase Admin
admin.initializeApp();

// Configure nodemailer with your email service
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "LooLabsAdmi@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "wqda sspy tbbm czpj",
  },
});

// Function to verify or reject a bathroom
export const verifyBathroom = onRequest(async (req, res) => {
  try {
    const {id, action} = req.query;

    if (!id || !action || (action !== "approve" && action !== "reject")) {
      res.status(400).send("Invalid parameters");
      return;
    }

    const db = admin.firestore();

    // Get the pending bathroom
    const pendingRef = db.collection("pendingBathrooms").doc(id as string);
    const pendingDoc = await pendingRef.get();

    if (!pendingDoc.exists) {
      res.status(404).send("Bathroom not found");
      return;
    }

    const bathroomData = pendingDoc.data();

    if (action === "approve") {
      // Create a new bathroom document with auto-generated ID
      const verifiedRef = db.collection("bathrooms").doc();
      const now = admin.firestore.FieldValue.serverTimestamp();

      // Prepare the approved bathroom data
      const approvedBathroomData = {
        ...bathroomData,
        id: verifiedRef.id, // Use the auto-generated Firestore ID
        status: "VERIFIED",
        sourcePendingId: id, // Keep traceability back to pending record
        verifiedAt: now,
        updatedAt: now,
        ratingCount: bathroomData?.ratingCount || 1,
        totalRating: bathroomData?.totalRating || 3,
        // Ensure required fields are present
        isAccessible: Boolean(bathroomData?.isAccessible),
        hasChangingTables: Boolean(bathroomData?.hasChangingTables),
        requiresKey: Boolean(bathroomData?.requiresKey),
      };

      // Use a transaction to ensure atomicity
      await db.runTransaction(async (transaction) => {
        // Create the new bathroom document
        transaction.set(verifiedRef, approvedBathroomData);
        // Delete the pending document
        transaction.delete(pendingRef);
      });

      console.log(`Successfully approved pending bathroom ${id} -> ${verifiedRef.id}`);
      res.send(`Bathroom approved successfully! New ID: ${verifiedRef.id}`);
    } else {
      // Mark as rejected
      await pendingRef.update({
        status: "REJECTED",
        rejectedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      res.send("Bathroom rejected.");
    }
  } catch (error) {
    console.error("Error verifying bathroom:", error);
    res.status(500).send("Error processing verification");
  }
});

// Function to handle new bathroom submissions
export const onNewBathroomSubmission = onDocumentCreated("pendingBathrooms/{bathroomId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const newBathroom = snapshot.data();
  const {bathroomId} = event.params;

  // Generate Google Maps URL for verification
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${newBathroom.latitude},${newBathroom.longitude}`;

  // Get the Cloud Function URL for verification
  const functionBaseUrl = "https://us-central1-iosbr2.cloudfunctions.net/verifyBathroom";

  // Format the database info for email
  const databaseInfo = JSON.stringify(newBathroom, null, 2);

  const emailContent = `
New Bathroom Submission:
Name: ${newBathroom.name}
Address: ${newBathroom.address || "Not provided"}
Description: ${newBathroom.description || "Not provided"}
Accessibility Features:
- Wheelchair Accessible: ${newBathroom.isWheelchairAccessible ? "Yes" : "No"}
- Changing Table: ${newBathroom.changingTable ? "Yes" : "No"}
- Requires Key/Code: ${newBathroom.requiresKeyCode ? "Yes" : "No"}
- Free to Use: ${newBathroom.isFree ? "Yes" : "No"}
Hours of Operation: ${newBathroom.hours || "Not provided"}
City ID: ${newBathroom.cityId}
Location: ${googleMapsUrl}
Submitter Email: ${newBathroom.submitterEmail || "Not provided"}
Additional Notes: ${newBathroom.submitterNotes || "None"}

To verify this bathroom, click one of these links:
✅ APPROVE: ${functionBaseUrl}?id=${bathroomId}&action=approve
❌ REJECT: ${functionBaseUrl}?id=${bathroomId}&action=reject

To verify location on Google Maps: ${googleMapsUrl}

Raw Database Info:
${databaseInfo}
`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER || "LooLabsAdmi@gmail.com",
      to: process.env.EMAIL_USER || "LooLabsAdmi@gmail.com",
      subject: `New Bathroom Submission: ${newBathroom.name}`,
      text: emailContent,
    });
    console.log(`Email sent successfully for bathroom: ${bathroomId}`);
  } catch (error) {
    console.error("Error sending email:", error);
  }
});

// Function to handle bathroom reports
export const onBathroomReport = onDocumentCreated("reports/{reportId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.log("No data associated with the event");
    return;
  }

  const reportData = snapshot.data();
  const bathroomId = reportData.bathroomId;

  // Try different bathroom collections
  const collections = ["bathrooms", "FinalBathrooms", "bathrooms-official", "bathrooms-user"];
  let bathroomData = null;

  for (const collectionName of collections) {
    const bathroomRef = admin.firestore().collection(collectionName).doc(bathroomId);
    const bathroomDoc = await bathroomRef.get();
    if (bathroomDoc.exists) {
      bathroomData = bathroomDoc.data();
      break;
    }
  }

  if (!bathroomData) {
    console.error("No bathroom found for ID:", bathroomId);
    return;
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${bathroomData.latitude},${bathroomData.longitude}`;
  const databaseInfo = JSON.stringify(bathroomData, null, 2);

  const emailContent = `
Bathroom Report Received:

Bathroom Details:
Name: ${bathroomData.name}
Address: ${bathroomData.address || "Not provided"}
ID: ${bathroomId}

Report Information:
Type: ${reportData.type}
Details: ${reportData.details}
Submitted: ${new Date().toLocaleString()}

Current Bathroom Status:
- Wheelchair Accessible: ${bathroomData.isAccessible ? "Yes" : "No"}
- Changing Tables: ${bathroomData.hasChangingTables ? "Yes" : "No"}
- Requires Key/Code: ${bathroomData.requiresKey ? "Yes" : "No"}

Location: ${googleMapsUrl}

Raw Database Info:
${databaseInfo}
`;

  // Create reusable transporter object using SMTP transport
  const reportTransporter = nodemailer.createTransporter({
    service: "gmail",
    auth: {
      user: "loolabsadmi@gmail.com",
      pass: process.env.EMAIL_PASSWORD || "wqda sspy tbbm czpj"
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  try {
    await reportTransporter.sendMail({
      from: "\"LooLabs Reports\" <loolabsadmi@gmail.com>",
      to: "loolabsadmi@gmail.com",
      subject: `Bathroom Report: ${bathroomData.name} - ${reportData.type}`,
      text: emailContent,
    });
    console.log(`Report email sent successfully for bathroom: ${bathroomId}`);

    // Update the report document to mark email as sent
    const reportRef = admin.firestore().collection("reports").doc(snapshot.id);
    await reportRef.update({
      emailSent: true,
      emailSentAt: admin.firestore.FieldValue.serverTimestamp()
    });
  } catch (error) {
    console.error("Error sending report email:", error);
    // Log the error details to help with debugging
    const reportRef = admin.firestore().collection("reports").doc(snapshot.id);
    await reportRef.update({
      emailError: error instanceof Error ? error.message : "Unknown error",
      emailErrorAt: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});

async function sendDiscordAlert(message: string) {
  if (!discordWebhookUrl) return;

  try {
    await fetch(discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        content: message
      })
    });
  } catch (error) {
    console.error("Error sending Discord alert:", error);
  }
}

// Function to handle billing alerts
export const stopBillingPubSub = onMessagePublished("loo_cap_billing", async (event) => {
  const data = event.data.message.json;
  const {budgetAmount, costAmount, costIntervalStart} = data;

  const alert = `🚨 Cost Alert:
Budget Amount: $${budgetAmount}
Current Cost: $${costAmount}
Billing Period Start: ${new Date(costIntervalStart).toLocaleDateString()}`;

  await sendDiscordAlert(alert);

  const fractionConsumed = costAmount / budgetAmount;

  if (fractionConsumed >= DISABLE_BILLING_THRESHOLD) {
    const billingMessage = `⚠️ Billing automatically disabled because costs ($${costAmount}) exceeded budget ($${budgetAmount})`;
    console.log(billingMessage);
    await sendDiscordAlert(billingMessage);

    const billingResponse = await disableBillingForProject();
    if (billingResponse) {
      await sendDiscordAlert("✅ Successfully disabled billing");
    } else {
      await sendDiscordAlert("❌ Failed to disable billing");
    }
  }
}); 