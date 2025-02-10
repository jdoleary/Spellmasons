// @ts-ignore: Import is fine
import SimplePeer from "simple-peer/simplepeer.min.js";

let socket: WebSocket;
export function sendToHub(socket: WebSocket, data: any) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error('Attempted to send data without valid hub connection. Data:', data);
    return;
  }
  console.debug('Send to hub', data);
  socket.send(JSON.stringify(data));
}

let connectionPromise: Promise<WebSocket> | undefined;
export function ensureConnectionToHub(wsHubUrl: string,
  handlers: { onData: (data: any, socket: WebSocket) => void, onError: (data: any, socket: WebSocket) => void }
): Promise<WebSocket> {
  // TODO: Handle if wsHubUrl changes from current connection
  if (socket && socket.readyState == WebSocket.CLOSING) {
    connectionPromise = undefined;
    return Promise.reject('Attempting to ensure connection but Socket is Closing');
  }
  if (socket && socket.readyState == WebSocket.CONNECTING) {
    if (connectionPromise) {
      return connectionPromise;
    } else {
      return Promise.reject('Something is wrong... socket is in CONNECTING state but there is no connectionPromise');
    }
  }
  if (socket && socket.readyState == WebSocket.OPEN) {
    return Promise.resolve(socket);
  }
  if (!socket || socket.readyState == WebSocket.CLOSED) {
    connectionPromise = new Promise((res, rej) => {
      socket = new WebSocket(wsHubUrl);
      socket.addEventListener("close", (_) => { console.log('Disconnected from hub.') });
      socket.addEventListener("error", (event) => {
        handlers.onError(event, socket);
        rej(event);
      });
      socket.addEventListener("open", (_) => {
        res(socket);
      });
      socket.addEventListener("message", (event) => {
        console.log("Message from server ", event, event.data);
        try {
          handlers.onData(JSON.parse(event.data), socket);
        } catch (e) {
          handlers.onError(e, socket);
          console.error('Unhandled message parse error', e)
        }
      });
    });
    return connectionPromise;
  }
  return Promise.reject('Err: Connect to hub, unexpected path.');
}