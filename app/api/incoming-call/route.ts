import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { verifyTwilioRequest } from '../../lib/twilio';

export async function POST(request: Request) {
    // Verify the request is from Twilio
    const isValid = await verifyTwilioRequest(request);
    if (!isValid) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const twimlResponse = new twilio.twiml.VoiceResponse();
    twimlResponse.connect().stream({
        url: `wss://${request.headers.get('host')}/api/ws/media-stream`
    });

    return new NextResponse(twimlResponse.toString(), {
        headers: {
            'Content-Type': 'text/xml',
        },
    });
}