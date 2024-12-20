import { NextRequest, NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: NextRequest) {
    try {
        console.log('Incoming call request received');

        const twiml = new twilio.twiml.VoiceResponse();
        const host = request.headers.get('host');
        console.log('Host:', host);

        // Construct WebSocket URL with protocol specification
        const wsUrl = `wss://${host}/api/ws`;
        console.log('WebSocket URL:', wsUrl);

        twiml.connect().stream({
            url: wsUrl,
            track: 'inbound_track'
        }).addParameter('protocol', 'twilio-media-stream-protocol-0.1.0');

        console.log('TwiML generated:', twiml.toString());

        return new NextResponse(twiml.toString(), {
            headers: {
                'Content-Type': 'text/xml',
            },
        });
    } catch (error) {
        console.error('Error in incoming-call route:', error);

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