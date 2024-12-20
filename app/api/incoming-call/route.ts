import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
    try {
        console.log('Incoming call request received');

        // Create TwiML response
        const twiml = new twilio.twiml.VoiceResponse();
        console.log('Creating TwiML response');

        // Add Stream to TwiML
        const host = request.headers.get('host');
        console.log('Host:', host);

        twiml.connect().stream({
            url: `wss://${host}/api/ws/media-stream`
        });

        console.log('TwiML generated:', twiml.toString());

        // Return response
        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    } catch (error) {
        // Log the full error
        console.error('Error in incoming-call route:', error);

        // Return a basic TwiML response in case of error
        const errorTwiml = new twilio.twiml.VoiceResponse();
        errorTwiml.say('Sorry, there was an error processing your call.');

        return new NextResponse(errorTwiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
            status: 500
        });
    }
}