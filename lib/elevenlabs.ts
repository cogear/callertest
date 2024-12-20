export async function getSignedUrl() {
    try {
        const response = await fetch(
            `https://api.elevenlabs.io/v1/convai/conversation/get_signed_url?agent_id=${process.env.ELEVENLABS_AGENT_ID}`,
            {
                method: 'GET',
                headers: {
                    'xi-api-key': process.env.ELEVENLABS_API_KEY!
                }
            }
        );

        if (!response.ok) {
            throw new Error(`Failed to get signed URL: ${response.statusText}`);
        }

        const data = await response.json();
        return data.signed_url;
    } catch (error) {
        console.error("Error getting signed URL:", error);
        throw error;
    }
}