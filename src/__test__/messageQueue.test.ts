import { makeContainer, processNextInQueue } from '../messageQueue';

describe('processNextInQueue', () => {
    it('should process the queue sequentially until the queue is empty', async () => {
        const container = makeContainer();
        // The queue which will be processed
        container.queue = [1000, 1];
        // Set to ready so it will begin processing

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
                        if (container.queue.length == 0) {
                            resolveProcessing();
                        }
                        resolve();
                    }, n)
                })
            }
            processNextInQueue(container, handleNumber);
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
        const container = makeContainer();
        container.queue = []

        // This should never be invoked, since the queue is empty
        const handle = jest.fn(() => new Promise((resolve) => {
            // Making handle resolve after a delay ensures that
            // (if the test would fail) it won't enter an infinite
            // callback loop that would prevent jest from throwing
            // the proper error message for this test
            setTimeout(resolve, 500);
        }));

        processNextInQueue(container, handle);

        // If this expectation fails, it is because the queue did
        // not stop processing once it was empty
        expect(handle).not.toHaveBeenCalled();
    });
    it('should not process in parallel even when invoked multiple times', async () => {
        const container = makeContainer();
        // The queue which will be processed
        container.queue = [1000, 1]
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
                        if (container.queue.length == 0) {
                            resolveProcessing();
                        }
                        resolve();
                    }, n)
                })
            }
            processNextInQueue(container, handleNumber);
            // Invoke a second time to prove that multiple invokations
            // won't process the queue in parallel
            // This invokation should short circuit (exit without acting) due to the 
            // internal logic of processNextInQueue
            processNextInQueue(container, handleNumber);
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
    describe("when the queue is replaced while processing is in progress", () => {
        it("should finish processing the current message before moving onto the contents of the newly replaced queue", async () => {
            const container = makeContainer();
            // The queue which will be processed
            container.queue = [0, 1, 10, 2, 3, 4]
            // An array to store the numbers that have been processed, in the order
            // in which they finished processing
            let result: number[] = [];

            await new Promise<void>((resolveProcessing) => {

                function handleNumber(n: number) {
                    return new Promise<void>((resolve, _reject) => {
                        // Replace the queue so the test can assert that
                        // the current value of 'n' will finish processing
                        // and then the queue will pick up with the first
                        // value of the new queue
                        if (n === 10) {
                            container.queue = ['a', 'b', 'c']
                        }
                        setTimeout(() => {
                            // Add the processed element to the result array
                            result.push(n);
                            // The queue is done processing
                            if (container.queue.length == 0) {
                                resolveProcessing();
                            }
                            resolve();
                        }, n)
                    })
                }
                processNextInQueue(container, handleNumber);
            })
            const actual = result;
            const expected = [0, 1, 10, 'a', 'b', 'c'];
            expect(actual).toEqual(expected);

        })

    });

})