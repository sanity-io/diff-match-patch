// Changes extensions of built code from `.js` to `.cjs`

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptsDir = fileURLToPath(new URL('.', import.meta.url))
const cjsPath = path.join(scriptsDir, '..', 'lib', 'cjs')

if (!fs.existsSync(cjsPath)) {
  console.error(`[error] ESM path does not exist (${cjsPath})`)
  process.exit(1)
}

readDir(cjsPath)
  .filter((item) => path.extname(item) === '.js')
  .forEach((jsPath) => {
    const cjsPath = jsPath.replace(/\.js$/, '.cjs')
    fs.renameSync(jsPath, cjsPath)
    console.log(`${jsPath} => ${cjsPath}`)
  })

function readDir(dir) {
  const contents = fs.readdirSync(dir, { withFileTypes: true })
  return contents.flatMap((item) => {
    const itemPath = path.join(dir, item.name)
    return item.isDirectory() ? readDir(itemPath) : itemPath
  })
}
