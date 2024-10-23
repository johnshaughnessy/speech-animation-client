import { on, send } from "./socket.ts";

export interface WebRTCConnection {
    pc: RTCPeerConnection;
    startWebRTC: () => void;
    stopWebRTC: () => void;
}

export function setupWebRTC(socket, anyEventCallback) {
    let connection: WebRTCConnection = {
        pc: null,
        startWebRTC: null,
        stopWebRTC: null,
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
            await stopWebRTC();
        }
    }

    async function onTrack(event) {
        anyEventCallback();
        window.stream = event.streams[0];
        const audio = document.getElementById("audio");
        if (event.track.kind === "audio" && !audio.srcObject && event.streams[0]) {
            audio.srcObject = event.streams[0];
        } else {
            console.warn("not adding track to audio elem");
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
            stopWebRTC();
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
                stopWebRTC();
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
            stopWebRTC();
        }
    }

    async function stopWebRTC() {
        // TODO: off("webrtc_sdp_answer");
        // TODO: off("webrtc_icecandidate");
        if (connection.pc) {
            await connection.pc.close();
            connection.pc = null;
        }
        anyEventCallback();
    }

    connection.startWebRTC = startWebRTC;
    connection.stopWebRTC = stopWebRTC;

    return connection;
}
