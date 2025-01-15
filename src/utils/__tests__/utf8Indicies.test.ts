import {describe, expect, test} from 'vitest'

import {apply} from '../../patch/apply.js'
import {make} from '../../patch/make.js'
import {parse} from '../../patch/parse.js'
import {stringify} from '../../patch/stringify.js'
import {adjustIndiciesToUcs2} from '../../utils/utf8Indices.js'

const sourceText = `速ヒマヤレ誌相ルなあね日諸せ変評ホ真攻同潔ク作先た員勝どそ際接レゅ自17浅ッ実情スヤ籍認ス重力務鳥の。8平はートご多乗12青國暮整ル通国うれけこ能新ロコラハ元横ミ休探ミソ梓批ざょにね薬展むい本隣ば禁抗ワアミ部真えくト提知週むすほ。査ル人形ルおじつ政謙減セヲモ読見れレぞえ録精てざ定第ぐゆとス務接産ヤ写馬エモス聞氏サヘマ有午ごね客岡ヘロ修彩枝雨父のけリド。

住ゅなぜ日16語約セヤチ任政崎ソオユ枠体ぞン古91一専泉給12関モリレネ解透ぴゃラぼ転地す球北ドざう記番重投ぼづ。期ゃ更緒リだすし夫内オ代他られくド潤刊本クヘフ伊一ウムニヘ感週け出入ば勇起ょ関図ぜ覧説めわぶ室訪おがト強車傾町コ本喰杜椿榎ほれた。暮る生的更芸窓どさはむ近問ラ入必ラニス療心コウ怒応りめけひ載総ア北吾ヌイヘ主最ニ余記エツヤ州5念稼め化浮ヌリ済毎養ぜぼ。`

describe('utf8 indicies', () => {
  test('ascii indicies do not need to be adjusted', () => {
    const source = 'ascii is pretty simple stuff, but obviously not great for multilingual text'
    const target = 'ascii is pretty simple stuff, but you probably want utf-8 for multilingual'
    const patch = make(source, target)
    const stringified = stringify(patch)
    const before = parse(stringified)
    const after = adjustIndiciesToUcs2(before, source)
    expect(after).toEqual(before)
  })

  test('can adjust utf8 indicies to ucs2 correctly on stable source', () => {
    const source = 'Blåbærsyltetøy er det beste man kan putte på brødskiva'
    const target = 'Blåbærsyltetøy er det beste man kan putte på skiva, men ost er også bra'
    const patch = make(source, target)
    const stringified = stringify(patch)
    const before = parse(stringified)
    const after = adjustIndiciesToUcs2(before, source)
    expect(after).toEqual(patch)
  })

  test('can adjust utf8 indicies to ucs2 on best-effort basis on shorter input', () => {
    const length = 40
    const source = 'Blåbærsyltetøy er det beste man kan putte på brødskiva'
    const target = 'Blåbærsyltetøy er det beste man kan putte på skiva, men ost er også bra'
    const patch = make(source, target)
    const stringified = stringify(patch)
    const before = parse(stringified)
    const after = adjustIndiciesToUcs2(before, source.slice(0, length))
    expect(after).toEqual([{...patch[0], start1: 40, start2: 40}])
  })

  test('can adjust utf8 indicies to ucs2 on best-effort basis on longer input', () => {
    const source = 'Blåbærsyltetøy er det beste man kan putte på brødskiva når man skal på skogstur'
    const target = 'Blåbærsyltetøy er det beste man kan putte på skiva, men ost er også bra'
    const patch = make(source, target)
    const stringified = stringify(patch)
    const before = parse(stringified)
    const after = adjustIndiciesToUcs2(before, source)
    expect(after).toEqual(patch)
  })

  test('uses utf8 indicies, and applies patches cleanly', () => {
    const source = 'Dette blir gøy.'
    const target = 'Dette blir ækkelt.'
    const patches = make(source, target)
    const patch = stringify(patches)
    expect(patch).toMatchInlineSnapshot(`
      "@@ -8,9 +8,12 @@
       lir 
      -g%C3%B8y
      +%C3%A6kkelt
       .
      "
    `)

    const [result] = apply(parse(patch), source)
    expect(result).toEqual(target)
  })

  test('adjusts indices, applies cleanly', () => {
    const source = sourceText
    const target = `${source}. EOL.`
    const patches = make(source, target, {margin: 1})
    const patch = stringify(patches)
    expect(patch).toMatchInlineSnapshot(`
      "@@ -1047,9 +1047,15 @@
       %E3%81%9C%E3%81%BC%E3%80%82
      +. EOL.
      "
    `)

    const [result] = apply(parse(patch), source)
    expect(result).toEqual(target)
  })

  test('adjusts indices, applies cleanly, with multiple occurences of the same string', () => {
    const source = [sourceText, sourceText, sourceText].join('\n\n')
    const target = [`${sourceText}. EOL.`, sourceText, sourceText].join('\n\n')

    const patches = make(source, target)
    const patch = stringify(patches)
    expect(patch).toMatchInlineSnapshot(`
      "@@ -1010,90 +1010,96 @@
       %E3%83%A4%E5%B7%9E5%E5%BF%B5%E7%A8%BC%E3%82%81%E5%8C%96%E6%B5%AE%E3%83%8C%E3%83%AA%E6%B8%88%E6%AF%8E%E9%A4%8A%E3%81%9C%E3%81%BC%E3%80%82
      +. EOL.
       %0A%0A%E9%80%9F%E3%83%92%E3%83%9E%E3%83%A4%E3%83%AC%E8%AA%8C%E7%9B%B8%E3%83%AB%E3%81%AA%E3%81%82%E3%81%AD%E6%97%A5%E8%AB%B8%E3%81%9B
      "
    `)

    const [result] = apply(parse(patch), source)
    expect(result).toEqual(target)
  })

  test('adjusts indices, applies cleanly, non-utf8', () => {
    const source = `Portable Text is a agnostic abstraction of "rich text" that can be stringified into any markup language, for instance HTML, Markdown, SSML, XML, etc. It's designed to be efficient for collaboration, and makes it possible to enrich rich text with data structures in depth.\n\nPortable Text is built on the idea of rich text as an array of blocks, themselves arrays of children spans. Each block can have a style and a set of mark dfinitions, which describe data structures distributed on the children spans. Portable Text also allows for inserting arbitrary data objects in the array, only requiring _type-key. Portable Text also allows for custom objects in the root array, enabling rendering environments to mix rich text with custom content types.\n\nPortable Text is a combination of arrays and objects. In its simplest form it's an array of objects with an array of children. Some definitions: \n- Block: Typically recognized as a section of a text, e.g. a paragraph or a heading.\n- Span: Piece of text with a set of marks, e.g. bold or italic.\n- Mark: A mark is a data structure that can be appliad to a span, e.g. a link or a comment.\n- Mark definition: A mark definition is a structure that describes a mark, a link or a comment.`
    const target = `Portable Text is an agnostic abstraction of rich text that can be serialized into pretty much any markup language, be it HTML, Markdown, SSML, XML, etc. It is designed to be efficient for real-time collaborative interfaces, and makes it possible to annotate rich text with additional data structures recursively.\n\nPortable Text is built on the idea of rich text as an array of blocks, themselves arrays of child spans. Each block can have a style and a set of mark definitions, which describe data structures that can be applied on the children spans. Portable Text also allows for inserting arbitrary data objects in the array, only requiring _type-key. Portable Text also allows for custom content objects in the root array, enabling editing- and rendering environments to mix rich text with custom content types.\n\nPortable Text is a recursive composition of arrays and objects. In its simplest form it's an array of objects of a type with an array of children. Some definitions: \n- Block: A block is what's typically recognized as a section of a text, e.g. a paragraph or a heading.\n- Span: A span is a piece of text with a set of marks, e.g. bold or italic.\n- Mark: A mark is a data structure that can be applied to a span, e.g. a link or a comment.\n- Mark definition: A mark definition is a data structure that describes a mark, e.g. a link or a comment.`
    const patches = make(source, target)
    const patch = stringify(patches)
    const [result] = apply(parse(patch), source)
    expect(result).toEqual(target)
  })
})
