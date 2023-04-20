import { apply } from '../apply.js'
import { make } from '../make.js'
import { stringify } from '../stringify.js'

const sourceText = `速ヒマヤレ誌相ルなあね日諸せ変評ホ真攻同潔ク作先た員勝どそ際接レゅ自17浅ッ実情スヤ籍認ス重力務鳥の。8平はートご多乗12青國暮整ル通国うれけこ能新ロコラハ元横ミ休探ミソ梓批ざょにね薬展むい本隣ば禁抗ワアミ部真えくト提知週むすほ。査ル人形ルおじつ政謙減セヲモ読見れレぞえ録精てざ定第ぐゆとス務接産ヤ写馬エモス聞氏サヘマ有午ごね客岡ヘロ修彩枝雨父のけリド。

住ゅなぜ日16語約セヤチ任政崎ソオユ枠体ぞン古91一専泉給12関モリレネ解透ぴゃラぼ転地す球北ドざう記番重投ぼづ。期ゃ更緒リだすし夫内オ代他られくド潤刊本クヘフ伊一ウムニヘ感週け出入ば勇起ょ関図ぜ覧説めわぶ室訪おがト強車傾町コ本喰杜椿榎ほれた。暮る生的更芸窓どさはむ近問ラ入必ラニス療心コウ怒応りめけひ載総ア北吾ヌイヘ主最ニ余記エツヤ州5念稼め化浮ヌリ済毎養ぜぼ。`

describe('utf8 indicies', () => {
  test('adjusts indices, applies cleanly', () => {
    const source = sourceText
    const target = `${source}. EOL.`
    const patches = make(source, target)
    const patch = stringify(patches)
    expect(patch).toMatchInlineSnapshot(`
      "@@ -1032,8 +1032,14 @@
       %E3%83%8C%E3%83%AA%E6%B8%88%E6%AF%8E%E9%A4%8A%E3%81%9C%E3%81%BC%E3%80%82
      +. EOL.
      "
    `)

    const [result] = apply(patch, source)
    expect(result).toEqual(target)
  })

  test('adjusts indices, applies cleanly, with multiple occurences of the same string', () => {
    const source = [sourceText, sourceText, sourceText].join('\n\n')
    const target = [`${sourceText}. EOL.`, sourceText, sourceText].join('\n\n')

    const patches = make(source, target)
    const patch = stringify(patches)
    expect(patch).toMatchInlineSnapshot(`
      "@@ -1010,32 +1010,38 @@
       %E3%83%A4%E5%B7%9E5%E5%BF%B5%E7%A8%BC%E3%82%81%E5%8C%96%E6%B5%AE%E3%83%8C%E3%83%AA%E6%B8%88%E6%AF%8E%E9%A4%8A%E3%81%9C%E3%81%BC%E3%80%82
      +. EOL.
       %0A%0A%E9%80%9F%E3%83%92%E3%83%9E%E3%83%A4%E3%83%AC%E8%AA%8C%E7%9B%B8%E3%83%AB%E3%81%AA%E3%81%82%E3%81%AD%E6%97%A5%E8%AB%B8%E3%81%9B
      "
    `)

    const [result] = apply(patch, source)
    expect(result).toEqual(target)
  })
})
