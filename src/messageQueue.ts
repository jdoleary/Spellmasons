import { raceTimeout } from "./Promise";
import { MESSAGE_TYPES } from "./types/MessageTypes";


export function processNextInQueue<T>(container: MessageQueueContainer<T>, callback: (x: any) => Promise<void>) {
    // Only allow the next message to be processed if it is not
    // already processing (this ensures only one message is processed at a time)
    if (!container._isProcessing) {
        // if there is a message in the queue to be processed
        if (container.queue.length) {
            container._isProcessing = true;
            const message = container.queue.splice(0, 1)[0];
            let messageDebug = '';
            try {
                // @ts-ignore
                messageDebug = !message ? "" : `${message.type}: ${MESSAGE_TYPES[message.payload?.type]}; ${message.payload?.cards}}`
            } catch (e) {
                console.error(e)
            }
            // If a message takes over 5 minutes to process, just carry on so
            // the queue doesn't get blocked.  This _should_ never happen but it is possible
            // and we want to protect against that possibility
            raceTimeout(5 * 60 * 1000, `Message in Queue timed out: ${messageDebug}`, callback(message))
                .then(() => {
                    // Set processing to false (done), so the next message can be processed
                    container._isProcessing = false;
                    // When finished processing, process the next one
                    processNextInQueue(container, callback)
                });
        }
    }

}
export function makeContainer<T>(): MessageQueueContainer<T> {
    return {
        queue: [],
        _isProcessing: false
    };
}
export interface MessageQueueContainer<T> {
    queue: T[],
    // isProcessing is true if the queue is processing a message and awaiting that message's resolution
    // It's value should only be changed inside of this module, which is why it is preceeded by 
    // an underscore
    _isProcessing: boolean
}