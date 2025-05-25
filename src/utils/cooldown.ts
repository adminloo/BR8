import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const COOLDOWN_SECONDS = 90;
const STORAGE_KEY = 'lastBathroomSubmission';

export async function canSubmitBathroom(): Promise<boolean> {
  try {
    const lastSubmitted = await AsyncStorage.getItem(STORAGE_KEY);
    if (!lastSubmitted) {
      console.log('✅ No previous submission found - user can submit.');
      return true;
    }

    const elapsed = (Date.now() - parseInt(lastSubmitted, 10)) / 1000;
    console.log(`⏱️ Elapsed time since last submission: ${elapsed.toFixed(2)} seconds`);

    if (elapsed >= COOLDOWN_SECONDS) {
      console.log('✅ Cooldown period passed - user can submit.');
      return true;
    } else {
      console.log(`❌ Still in cooldown period (${elapsed.toFixed(2)}s < ${COOLDOWN_SECONDS}s)`);
      return false;
    }
  } catch (error) {
    console.error('⚠️ Error checking cooldown:', error);
    return true; // fail open if AsyncStorage breaks
  }
}

export async function updateLastSubmissionTime(): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, Date.now().toString());
    console.log('✅ Updated last submission timestamp');
  } catch (error) {
    console.error('⚠️ Error updating submission time:', error);
  }
}

export async function getRemainingCooldownSeconds(): Promise<number> {
  try {
    const lastSubmitted = await AsyncStorage.getItem(STORAGE_KEY);
    if (!lastSubmitted) return 0;

    const elapsed = (Date.now() - parseInt(lastSubmitted, 10)) / 1000;
    const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
    return Math.ceil(remaining);
  } catch (error) {
    console.error('⚠️ Error calculating remaining cooldown:', error);
    return 0;
  }
}

export function showCooldownAlert(remainingSeconds: number): void {
  Alert.alert(
    'Please Wait',
    `You can submit another bathroom in ${remainingSeconds} seconds.`
  );
} 