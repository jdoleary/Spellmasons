export const simplePeerConf = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478?transport=udp' },
        { urls: 'turn:161.35.249.127:3478', username: 'spell', credential: 'masons' }
    ]
}