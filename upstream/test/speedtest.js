const path = require('path')
const fs = require('fs')
const diff_match_patch = require('../diff_match_patch_uncompressed')

const v1 = fs.readFileSync(path.join(__dirname, 'v1.txt'), 'utf-8')
const v2 = fs.readFileSync(path.join(__dirname, 'v2.txt'), 'utf-8')

const dmp = new diff_match_patch()
dmp.Diff_Timeout = 0

// No warmup loop since it risks triggering an 'unresponsive script' dialog
// in client-side JavaScript
const ms_start = new Date().getTime()
const d = dmp.diff_main(v1, v2, false)
const ms_end = new Date().getTime()

console.log(dmp.patch_make(d).toString())
console.log(`Time: ${(ms_end - ms_start) / 1000}s`)
