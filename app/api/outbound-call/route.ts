import { NextResponse } from 'next/server';
import { twilioClient } from '../../lib/twilio';

export async function POST(request: Request) {
    const { number, prompt } = await request.json();

    if (!number) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    try {
        const call = await twilioClient.calls.create({
            from: process.env.TWILIO_PHONE_NUMBER!,
            to: number,
            url: `https://${request.headers.get('host')}/api/outbound-call-twiml?prompt=${encodeURIComponent(prompt || '')}`
        });

        return NextResponse.json({
            success: true,
            message: 'Call initiated',
            callSid: call.sid
        });
    } catch (error) {
        console.error('Error initiating outbound call:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to initiate call'
        }, { status: 500 });
    }
}