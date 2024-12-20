import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    // Log all headers for debugging
    console.log('Incoming headers:', Object.fromEntries(request.headers.entries()));

    if (request.headers.get('upgrade') !== 'websocket') {
        console.log('Not a WebSocket upgrade request');
        return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    try {
        const webSocketKey = request.headers.get('sec-websocket-key');
        const webSocketProtocol = request.headers.get('sec-websocket-protocol');

        console.log('WebSocket Key:', webSocketKey);
        console.log('WebSocket Protocol:', webSocketProtocol);

        if (!webSocketProtocol?.includes('twilio-media-stream-protocol-0.1.0')) {
            console.log('Protocol mismatch:', webSocketProtocol);
            return new Response('Unsupported protocol', { status: 400 });
        }

        if (!webSocketKey) {
            console.log('Missing WebSocket key');
            return new Response('Missing Sec-WebSocket-Key', { status: 400 });
        }

        const acceptKey = await createAcceptValue(webSocketKey);
        console.log('Generated Accept Key:', acceptKey);

        const headers = new Headers({
            'Upgrade': 'websocket',
            'Connection': 'Upgrade',
            'Sec-WebSocket-Accept': acceptKey,
            'Sec-WebSocket-Protocol': 'twilio-media-stream-protocol-0.1.0'
        });

        return new Response(null, {
            status: 101,
            headers: headers
        });
    } catch (error) {
        console.error('WebSocket setup error:', error);
        return new Response('WebSocket setup failed', { status: 500 });
    }
}

async function createAcceptValue(webSocketKey: string): Promise<string> {
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const encoder = new TextEncoder();
    const data = encoder.encode(webSocketKey + GUID);
    const hash = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(hash));
    const hashString = hashArray.map(byte => String.fromCharCode(byte)).join('');
    return btoa(hashString);
}