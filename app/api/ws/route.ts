import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);

    if (request.headers.get('upgrade') !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    try {
        const upgradeHeader = request.headers.get('upgrade');
        const connectionHeader = request.headers.get('connection');
        const keyHeader = request.headers.get('sec-websocket-key');
        const versionHeader = request.headers.get('sec-websocket-version');

        if (!upgradeHeader || !connectionHeader?.toLowerCase().includes('upgrade') || !keyHeader || !versionHeader) {
            return new Response('Invalid WebSocket upgrade request', { status: 400 });
        }

        const acceptKey = await createAcceptKey(keyHeader);

        const headers = new Headers({
            'Upgrade': 'websocket',
            'Connection': 'Upgrade',
            'Sec-WebSocket-Accept': acceptKey,
        });

        return new Response(null, { status: 101, headers });
    } catch (error) {
        console.error('WebSocket setup error:', error);
        return new Response('WebSocket setup failed', { status: 500 });
    }
}

async function createAcceptKey(key: string): Promise<string> {
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const acceptKey = key + GUID;
    const hashBuffer = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(acceptKey));

    // Convert buffer to base64 without spreading
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashString = hashArray.map(b => String.fromCharCode(b)).join('');
    return btoa(hashString);
}