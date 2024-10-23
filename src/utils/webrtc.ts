import { on, send } from "./socket.ts";

export interface WebRTCConnection {
    pc: RTCPeerConnection;
    startWebRTC: () => void;
    closeWebRTC: () => void;
}

export function setupWebRTC(socket, anyEventCallback) {
    let connection: WebRTCConnection = {
        pc: null,
        startWebRTC: null,
        closeWebRTC: null,
    };

    async function onIceCandidate(event) {
        anyEventCallback();
        if (event.candidate) {
            send(socket, "webrtc_icecandidate", { candidate: event.candidate });
        }
    }
    async function onConnectionStateChange(event) {
        anyEventCallback();
        if (connection.pc.connectionState === "disconnected" || connection.pc.connectionState === "failed") {
            await closeWebRTC();
        }
    }

    async function onTrack(event) {
        anyEventCallback();
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
            console.error("Error getting media stream:", error);
            return null;
        }
    }

    async function startWebRTC() {
        on(socket, "disconnect", () => {
            closeWebRTC();
        });

        on(socket, "webrtc_sdp_answer", async (data) => {
            anyEventCallback();
            const description = new RTCSessionDescription(data);
            await connection.pc.setRemoteDescription(description);
        });

        on(socket, "webrtc_icecandidate", async (data) => {
            anyEventCallback();
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
            anyEventCallback();
            const offer = await connection.pc.createOffer();
            anyEventCallback();
            await connection.pc.setLocalDescription(offer);
            anyEventCallback();
            await send(socket, "webrtc_sdp_offer", { sdp: offer });
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
        anyEventCallback();
    }

    connection.startWebRTC = startWebRTC;
    connection.closeWebRTC = closeWebRTC;

    return connection;
}
