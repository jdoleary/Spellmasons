import { processNextInQueue } from '../messageQueue';

describe('processNextInQueue', () => {
    it('should process the queue sequentially until the queue is empty', async () => {
        // The queue which will be processed
        let queue = [1000, 1]
        // An array to store the numbers that have been processed, in the order
        // in which they finished processing
        let result: number[] = [];

        await new Promise<void>((resolveProcessing) => {

            // The handler is set up to wait n milliseconds before resolving
            // and since element 0 of the queue is much bigger than element 1,
            // it will take longer to resolve.
            function handleNumber(n: number) {
                return new Promise<void>((resolve, _reject) => {
                    setTimeout(() => {
                        // Add the processed number to the result array
                        result.push(n);
                        // The queue is done processing
                        if (queue.length == 0) {
                            resolveProcessing();
                        }
                        resolve();
                    }, n)
                })
            }
            processNextInQueue(queue, handleNumber);
        })


        const actual = result;
        // Since element 0 will take longer to resolve, if the
        // 'actual' array is still in order, that proves that
        // the queue waited for the first to complete before processing
        // the second
        const expected = [1000, 1];
        expect(actual).toEqual(expected);
    });
    it('should not recurse infinitely if the queue is empty', () => {
        let queue: number[] = []

        // This should never be invoked, since the queue is empty
        const handle = jest.fn(() => new Promise((resolve) => {
            // Making handle resolve after a delay ensures that
            // (if the test would fail) it won't enter an infinite
            // callback loop that would prevent jest from throwing
            // the proper error message for this test
            setTimeout(resolve, 500);
        }));

        processNextInQueue(queue, handle);

        // If this expectation fails, it is because the queue did
        // not stop processing once it was empty
        expect(handle).not.toHaveBeenCalled();
    });
    it('should not process in parallel even when invoked multiple times', async () => {
        // The queue which will be processed
        let queue = [1000, 1]
        // An array to store the numbers that have been processed, in the order
        // in which they finished processing
        let result: number[] = [];

        await new Promise<void>((resolveProcessing) => {

            // The handler is set up to wait n milliseconds before resolving
            // and since element 0 of the queue is much bigger than element 1,
            // it will take longer to resolve.
            function handleNumber(n: number) {
                return new Promise<void>((resolve, _reject) => {
                    setTimeout(() => {
                        // Add the processed number to the result array
                        result.push(n);
                        // The queue is done processing
                        if (queue.length == 0) {
                            resolveProcessing();
                        }
                        resolve();
                    }, n)
                })
            }
            processNextInQueue(queue, handleNumber);
            // Invoke a second time to prove that multiple invokations
            // won't process the queue in parallel
            // This invokation should short circuit (exit without acting) due to the 
            // internal logic of processNextInQueue
            processNextInQueue(queue, handleNumber);
        })


        const actual = result;
        // Since element 0 will take longer to resolve, if the
        // 'actual' array is still in order, that proves that
        // the queue waited for the first to complete before processing
        // the second
        const expected = [1000, 1];
        // If this assertion fails because the array is out of order then
        // the queue is processing in parallel, but it should not be!
        // The queue must process sequentially, as it is intended to
        expect(actual).toEqual(expected);

    });

})