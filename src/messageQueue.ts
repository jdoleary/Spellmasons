

export function processNextInQueue<T>(container: MessageQueueContainer<T>, callback: (x: any) => any) {
    // Only allow the next message to be processed if it is not
    // already processing (this ensures only one message is processed at a time)
    if (!container._isProcessing) {
        // if there is a message in the queue to be processed
        if (container.queue.length) {
            container._isProcessing = true;
            callback(container.queue.splice(0, 1)[0])
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
    // It's value should only be changed inside of this module.
    _isProcessing: boolean
}