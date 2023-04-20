/* eslint-disable no-console */
/* eslint-disable no-sync */
import * as path from 'path'

import * as fs from 'fs'

import {diff} from '../src/diff/diff'
import {make} from '../src/patch/make'
import {stringify} from '../src/patch/stringify'

const v1 = fs.readFileSync(path.join(__dirname, 'v1.txt'), 'utf-8')
const v2 = fs.readFileSync(path.join(__dirname, 'v2.txt'), 'utf-8')

// No warmup loop since it risks triggering an 'unresponsive script' dialog
// in client-side JavaScript
const start = Date.now()
const d = diff(v1, v2, {checkLines: false})
const end = Date.now()

console.log(stringify(make(d)))
console.log(`Time: ${(end - start) / 1000}s`)
