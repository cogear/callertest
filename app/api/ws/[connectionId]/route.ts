import { ApiGatewayManagementApi } from '@aws-sdk/client-apigatewaymanagementapi';
import { NextResponse } from 'next/server';
import WebSocket from 'ws';
import { getSignedUrl } from '../../../lib/elevenlabs';
import type { TwilioMessage, ElevenLabsMessage } from '../../../../types';

// Initialize AWS API Gateway Management API client
const createApiGatewayClient = (endpoint: string) => {
    return new ApiGatewayManagementApi({
        endpoint,
        region: process.env.AWS_REGION || 'us-east-1',
    });
};

export async function POST(
    request: Request,
    { params }: { params: { connectionId: string } }
) {
    const { connectionId } = params;
    const apiGateway = createApiGatewayClient(process.env.WEBSOCKET_API_ENDPOINT!);

    let elevenLabsWs: WebSocket | null = null;

    try {
        // Get the message from the request body
        const message: TwilioMessage = await request.json();

        // Handle different message types
        switch (message.event) {
            case 'start':
                // Initialize ElevenLabs WebSocket connection
                const signedUrl = await getSignedUrl();
                elevenLabsWs = new WebSocket(signedUrl);

                elevenLabsWs.on('open', () => {
                    console.log('[ElevenLabs] Connected');

                    // Send initial configuration if there are custom parameters
                    if (message.start?.customParameters?.prompt) {
                        const config = {
                            type: 'conversation_initiation_client_data',
                            conversation_config_override: {
                                agent: {
                                    prompt: { prompt: message.start.customParameters.prompt },
                                    first_message: "Hello! How can I help you today?",
                                },
                            }
                        };
                        elevenLabsWs?.send(JSON.stringify(config));
                    }
                });

                elevenLabsWs.on('message', async (data) => {
                    try {
                        const elevenLabsMessage: ElevenLabsMessage = JSON.parse(data.toString());

                        switch (elevenLabsMessage.type) {
                            case 'audio':
                                if (elevenLabsMessage.audio_event?.audio_base_64) {
                                    await apiGateway.postToConnection({
                                        ConnectionId: connectionId,
                                        Data: JSON.stringify({
                                            event: 'media',
                                            streamSid: message.start?.streamSid,
                                            media: {
                                                payload: elevenLabsMessage.audio_event.audio_base_64
                                            }
                                        })
                                    });
                                }
                                break;

                            case 'ping':
                                if (elevenLabsMessage.ping_event?.event_id) {
                                    elevenLabsWs?.send(JSON.stringify({
                                        type: 'pong',
                                        event_id: elevenLabsMessage.ping_event.event_id
                                    }));
                                }
                                break;
                        }
                    } catch (error) {
                        console.error('[ElevenLabs] Error processing message:', error);
                    }
                });
                break;

            case 'media':
                if (elevenLabsWs?.readyState === WebSocket.OPEN && message.media?.payload) {
                    const audioMessage = {
                        user_audio_chunk: Buffer.from(message.media.payload, 'base64').toString('base64')
                    };
                    elevenLabsWs.send(JSON.stringify(audioMessage));
                }
                break;

            case 'stop':
                if (elevenLabsWs) {
                    elevenLabsWs.close();
                    elevenLabsWs = null;
                }
                break;
        }

        return new NextResponse('OK');
    } catch (error) {
        console.error('Error handling WebSocket message:', error);
        return new NextResponse('Error', { status: 500 });
    }
}