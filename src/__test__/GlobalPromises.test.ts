import { create, resolve } from '../GlobalPromises';
describe('GlobalPromises', () => {
    it('should reject a preexisting unresolved promise if a new promise of the same key is created', () => {
        const key = 'bananna';
        const first = create(key);
        const second = create(key);
        expect(first).rejects.toEqual(undefined);
        // cleanup
        resolve(key);
    });
    it('should resolve a new promise immediately if it\'s key was resolved before the promise was created', () => {
        // This allows the game to not get stuck waiting for a message that it has already received and proccessed
        // if it knows it should be recieving that message:
        const key = 'orange';
        resolve(key);
        const prom = create(key);
        expect(prom).resolves.toEqual(undefined);
    });
    it('should NOT resolve a second promise of the same key that was previously pre-resolved until it is resolved a second time', () => {
        const key = 'orange';
        resolve(key);
        // Create a apromise that will resolve immediately due to pre-resolve
        create(key);
        // create a second promise that should not resolve yet because resolve(key) has only
        // been invoked once so far
        const prom2 = create(key);
        const immediateResolveValue = 1;
        expect(Promise.race([prom2, Promise.resolve(immediateResolveValue)])).resolves.toEqual(immediateResolveValue);
        //cleanup
        resolve(key);

    });
    it('should allow for resolving a promise by key', () => {
        const key = 'grape';
        const prom = create(key);
        resolve(key);
        expect(prom).resolves.toEqual(undefined);
    });
    it('should allow for multiple promises of the same key so long as ALL of the previous promises of the same key have already been resolved', () => {
        const key = 'kiwi';
        const first = create(key);
        resolve(key);
        const second = create(key);
        resolve(key);
        const third = create(key);
        resolve(key);
        expect(first).resolves.toEqual(undefined);
        expect(second).resolves.toEqual(undefined);
        expect(third).resolves.toEqual(undefined);

    });


});