import { expect } from 'chai'
import * as yaml from './foo.yaml'
import * as txt from './bar.txt'

it('can import text files', function() {
    expect(yaml).to.equal('foo: bar\n')
    expect(txt).to.equal('Hello world!\n')
})
