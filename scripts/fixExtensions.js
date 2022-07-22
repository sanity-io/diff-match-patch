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
    // Rename .js files to .cjs so we can serve both CommonJS and ESModules
    // from the same package without having node whine about it
    const cjsPath = jsPath.replace(/\.js$/, '.cjs')
    fs.renameSync(jsPath, cjsPath)
    console.log(`${jsPath} => ${cjsPath}`)

    // Rewrite .js require statements to .cjs.
    // Yes, this is very hacky. Yes, we should have the build to do this
    // right in the first place.
    const cjsContent = fs.readFileSync(cjsPath, 'utf8')
    fs.writeFileSync(
      cjsPath,
      cjsContent.replace(/require\("(.*)\.js"\)/g, 'require("$1.cjs")'),
    )

    // The file.d.ts needs to be file.cjs.d.ts to work :/
    const fromDtsPath = jsPath.replace(/\.js$/, '.d.ts')
    const toDtsPath = jsPath.replace(/\.js$/, '.cjs.d.ts')
    fs.renameSync(fromDtsPath, toDtsPath)

    // d.ts files also needs to import from .cjs :/
    const dtsContent = fs.readFileSync(toDtsPath, 'utf8')
    fs.writeFileSync(
      toDtsPath,
      dtsContent
        .replace(/import (.*?) from '(.*)\.js'/g, "import $1 from '$2.cjs'")
        .replace(/export (.*?) from '(.*)\.js'/g, "export $1 from '$2.cjs'"),
    )

    // Source maps also needs to be file.cjs.map
    const fromMapPath = jsPath.replace(/\.js$/, '.js.map')
    const mapPath = jsPath.replace(/\.js$/, '.cjs.map')
    fs.renameSync(fromMapPath, mapPath)

    // Aaand sourcemaps needs to reference .cjs instead of .js
    const newMap = rewriteMap(JSON.parse(fs.readFileSync(mapPath, 'utf8')))
    fs.writeFileSync(mapPath, JSON.stringify(newMap))
  })

function readDir(dir) {
  const contents = fs.readdirSync(dir, { withFileTypes: true })
  return contents.flatMap((item) => {
    const itemPath = path.join(dir, item.name)
    return item.isDirectory() ? readDir(itemPath) : itemPath
  })
}

function rewriteMap(map) {
  map.file = map.file.replace(/\.js$/, '.cjs')
  return map
}
