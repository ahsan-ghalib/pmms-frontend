import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import axiosInstance from './axios';

if (typeof window !== 'undefined') {
    window.Pusher = Pusher;
    Pusher.logToConsole = true;

    // We initialize Echo but we don't connect immediately unless configured.
    // Ensure you have these variables in your .env.local
    window.Echo = new Echo({
        broadcaster: 'reverb',
        key: process.env.NEXT_PUBLIC_REVERB_APP_KEY || 'b7855095813f08cdeb54',
        wsHost: process.env.NEXT_PUBLIC_REVERB_HOST || '127.0.0.1',
        wsPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 8080,
        wssPort: process.env.NEXT_PUBLIC_REVERB_PORT ?? 443,
        forceTLS: (process.env.NEXT_PUBLIC_REVERB_SCHEME ?? 'http') === 'https',
        enabledTransports: ['ws', 'wss'],
        authorizer: (channel, options) => {
            return {
                authorize: (socketId, callback) => {
                    axiosInstance.post('/broadcasting/auth', {
                        socket_id: socketId,
                        channel_name: channel.name
                    })
                    .then(response => {
                        callback(false, response.data);
                    })
                    .catch(error => {
                        callback(true, error);
                    });
                }
            };
        },
    });
}

export default typeof window !== 'undefined' ? window.Echo : null;
