// https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/readyState
export const WebSocketReadyState = [
    {
        status: "CONNECTING", // 0
        description: "Socket has been created. The connection is not yet open.",
    },
    {
        status: "OPEN", // 1
        description: "The connection is open and ready to communicate.",
    },
    {
        status: "CLOSING", // 2
        description: "The connection is in the process of closing.",
    },
    {
        status: "CLOSED", // 3
        description: "The connection is closed or couldn't be opened.",
    },
];

export interface Socket {
    ws: WebSocket;
    sessionId: string;
    listeners: any[];
    openListeners: any[];
}

export function connect(url: string, sessionId: string, openListeners = [], listeners = []) {
    const socket: Socket = {
        ws: new WebSocket(url),
        sessionId,
        listeners,
        openListeners,
    };

    socket.ws.onopen = () => {
        socket.openListeners.forEach((listener) => {
            listener();
        });
    };

    socket.ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        const { name, data } = message;
        let didHaveListener = false;
        socket.listeners.forEach((listener) => {
            if (listener.name === name) {
                didHaveListener = true;

                listener.callback(data);
            }
        });
        if (!didHaveListener) {
            console.warn("No listener found for message.", message);
        }
    };

    // TODO: Consider handling `onclose` and `onerror`.
    socket.ws.onclose = (e) => {
        console.error("Socket closed.");
        console.error(e);
    };

    socket.ws.onerror = (e) => {
        console.error("Socket error.");
        console.error(e);
    };

    return socket;
}

export function send(socket, name, data = null) {
    if (!socket || !socket.ws) {
        console.error("Socket is not connected. Cannot send message.");
        return;
    }
    if (socket.ws.readyState !== WebSocket.OPEN) {
        console.error("Socket is not open. Cannot send message.");
        return;
    }
    const message: Message = {
        session_id: socket.sessionId,
        name,
        data,
    };
    socket.ws.send(JSON.stringify(message));
}

export function on(socket, name, callback) {
    // Check if a listener with this name already exists. If so, log an error.
    const existingListener = socket.listeners.find((listener) => listener.name === name);
    if (existingListener && name !== "disconnect") {
        console.error("A listener with the same name exists.", existingListener);
        return;
    }
    socket.listeners.push({ name, callback });
}

export function onConnect(socket, callback) {
    socket.openListeners.push(callback);
    if (socket.ws.readyState === WebSocket.OPEN) {
        callback();
    }
}
