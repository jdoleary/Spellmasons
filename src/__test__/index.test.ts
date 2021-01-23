import {describe, it, expect} from '@jest/globals'
import {a} from '../index'

describe('test',() => {
    it('test',()=>{
        expect(a).toBe(8)
    })
})