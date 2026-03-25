import { registerPlugin } from '@capacitor/core';

interface SmsSenderPlugin {
    sendSms(options: { numbers: string[]; message: string }): Promise<{ sent: number; total: number }>;
}

const SmsSender = registerPlugin<SmsSenderPlugin>('SmsSender');

/**
 * Silently sends an emergency SMS from the user's device to all provided phone numbers.
 * Falls back gracefully on non-Android platforms.
 */
export async function sendEmergencySms(
    phoneNumbers: string[],
    message: string
): Promise<void> {
    try {
        const validNumbers = phoneNumbers.filter(n => n && n.trim().length > 0);
        if (validNumbers.length === 0) {
            console.warn('No valid phone numbers to send SMS to');
            return;
        }
        const result = await SmsSender.sendSms({ numbers: validNumbers, message });
        console.log(`✅ SMS sent to ${result.sent}/${result.total} contacts`);
    } catch (err) {
        console.error('❌ Failed to send emergency SMS:', err);
        // Don't throw — SMS failure shouldn't block the SOS alert
    }
}
