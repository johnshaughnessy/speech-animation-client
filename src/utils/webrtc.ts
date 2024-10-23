import { on, send } from "./socket.ts";

export interface WebRTCConnection {
    pc: RTCPeerConnection;
    startWebRTC: () => void;
    closeWebRTC: () => void;
}

export function setupWebRTC(socket) {
    let connection: WebRTCConnection = {
        pc: null,
        startWebRTC: null,
        closeWebRTC: null,
    };

    async function onIceCandidate(event) {
        if (event.candidate) {
            send(socket, "webrtc_candidate_message", { candidate: event.candidate });
        }
    }
    async function onConnectionStateChange(event) {
        if (connection.pc.connectionState === "disconnected" || connection.pc.connectionState === "failed") {
            await closeWebRTC();
        }
    }

    async function onTrack(event) {
        const audio = document.getElementById("audio");
        if (event.track.kind === "audio" && !audio.srcObject && event.streams[0]) {
            audio.srcObject = event.streams[0];
        }
    }

    async function getMediaStream() {
        try {
            return await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: false,
            });
        } catch (error) {
            return null;
        }
    }

    async function startWebRTC() {
        on(socket, "disconnect", () => {
            closeWebRTC();
        });

        on(socket, "session_response", async (data) => {
            const description = new RTCSessionDescription(data);
            await connection.pc.setRemoteDescription(description);
        });

        on(socket, "candidate_response", async (data) => {
            const candidate = new RTCIceCandidate(data.candidate);
            await connection.pc.addIceCandidate(candidate);
        });

        try {
            connection.pc = new RTCPeerConnection({
                iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
            });
            connection.pc.onicecandidate = onIceCandidate;
            connection.pc.onconnectionstatechange = onConnectionStateChange;
            connection.pc.ontrack = onTrack;
            const stream = await getMediaStream();
            if (!stream) {
                closeWebRTC();
                return;
            }
            stream.getTracks().forEach((track) => {
                connection.pc.addTrack(track, stream);
            });
            const offer = await connection.pc.createOffer();
            await connection.pc.setLocalDescription(offer);
            await send(socket, "webrtc_session_message", { sdp: offer });
        } catch (error) {
            console.error("Error starting WebRTC:", error);
            closeWebRTC();
        }
    }

    async function closeWebRTC() {
        if (connection.pc) {
            await connection.pc.close();
            connection.pc = null;
        }
    }

    connection.startWebRTC = startWebRTC;
    connection.closeWebRTC = closeWebRTC;

    return connection;
}
