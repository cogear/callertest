import twilio from 'twilio';

if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Missing Twilio credentials');
}

export const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

export async function verifyTwilioRequest(request: Request): Promise<boolean> {
    const signature = request.headers.get('X-Twilio-Signature');
    if (!signature) return false;

    const url = request.url;
    const params = Object.fromEntries(new URLSearchParams(url.split('?')[1] || ''));

    return twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN!,
        signature,
        url,
        params
    );
}
