import { describe, it, expect } from "vitest";
import { getVersionInequality } from '../networkUtil';
describe('networkUtil', () => {
    describe('isClientVersionBehind', () => {
        [
            {
                clientVersion: '1.0.0',
                serverVersion: '1.0.0',
                expected: 'equal',
            },
            // behind by minor version
            {
                clientVersion: '1.1.0',
                serverVersion: '1.0.0',
                expected: 'server behind',
            },
            // behind by minor version
            {
                clientVersion: '1.0.0',
                serverVersion: '1.1.0',
                expected: 'client behind',
            },
            // behind by major version
            {
                clientVersion: '2.0.0',
                serverVersion: '1.1.0',
                expected: 'server behind',
            },
            // behind by major while minor is equal
            {
                clientVersion: '2.0.0',
                serverVersion: '1.0.0',
                expected: 'server behind',
            },
            // behind by major version
            {
                clientVersion: '1.90.0',
                serverVersion: '2.0.0',
                expected: 'client behind',
            },
            // Check for integer comparison, not string comparison
            {
                clientVersion: '1.5.0',
                serverVersion: '1.400.0',
                expected: 'client behind',
            },
        ].forEach(({ clientVersion, serverVersion, expected }) => {
            it(`should return "${expected}" for ${clientVersion} isBehind ${serverVersion}`, () => {
                const actual = getVersionInequality(clientVersion, serverVersion);
                expect(actual).toEqual(expected);
            });
        });

    });
});