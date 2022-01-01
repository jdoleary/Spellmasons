
let processingQueue = false;
export function processNextInQueue(queue: any[], callback: (x: any) => any) {
    // Only allow the next message to be processed if it is not
    // already processing (this ensures only one message is processed at a time)
    if (!processingQueue) {
        // if there is a message in the queue to be processed
        if (queue.length) {
            processingQueue = true;
            callback(queue.splice(0, 1)[0])
                .then(() => {
                    // Set processing to false (done), so the next message can be processed
                    processingQueue = false;
                    // When finished processing, process the next one
                    processNextInQueue(queue, callback)
                });
        }
    }

}