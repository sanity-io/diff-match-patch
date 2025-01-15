/* eslint-disable no-console */
import {readFileSync} from 'node:fs'
import {join as joinPath} from 'node:path'

import {diff} from '../src/diff/diff.js'
import {make} from '../src/patch/make.js'
import {stringify} from '../src/patch/stringify.js'

const v1 = readFileSync(joinPath(__dirname, 'v1.txt'), 'utf-8')
const v2 = readFileSync(joinPath(__dirname, 'v2.txt'), 'utf-8')

// No warmup loop since it risks triggering an 'unresponsive script' dialog
// in client-side JavaScript
const start = Date.now()
const d = diff(v1, v2, {checkLines: false})
const end = Date.now()

console.log(stringify(make(d)))
console.log(`Time: ${(end - start) / 1000}s`)
