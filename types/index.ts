export interface TwilioMessage {
    event: 'start' | 'media' | 'stop';
    start?: {
        streamSid: string;
        callSid: string;
        customParameters?: Record<string, string>;
    };
    media?: {
        payload: string;
    };
}

export interface ElevenLabsMessage {
    type: string;
    audio_event?: {
        audio_base_64: string;
    };
    ping_event?: {
        event_id: string;
    };
}