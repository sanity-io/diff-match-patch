# @sanity/diff-match-patch

A TypeScript fork of the JavaScript version of [google/diff-match-patch](https://github.com/google/diff-match-patch), that includes a few long-standing pull requests, fixing [certain bugs](#significant-changes) and with an API more familiar to the JavaScript ecosystem.

### What is it?

The Diff Match and Patch libraries offer robust algorithms to perform the
operations required for synchronizing plain text.

1. Diff:
   - Compare two blocks of plain text and efficiently return a list of differences.
   - [Diff Demo](https://neil.fraser.name/software/diff_match_patch/demos/diff.html)
2. Match:
   - Given a search string, find its best fuzzy match in a block of plain text. Weighted for both accuracy and location.
   - [Match Demo](https://neil.fraser.name/software/diff_match_patch/demos/match.html)
3. Patch:
   - Apply a list of patches onto plain text. Use best-effort to apply patch even when the underlying text doesn't match.
   - [Patch Demo](https://neil.fraser.name/software/diff_match_patch/demos/patch.html)

Originally built in 2006 to power Google Docs, this library is now available in C++, C#, Dart, Java, JavaScript, Lua, Objective C, and Python.

### API

#### Creating and applying patches

```ts
import {
  makePatches,
  applyPatches,
  stringifyPatches,
} from '@sanity/diff-match-patch'

// Make array of diffs in internal array format, eg tuples of `[DiffType, string]`
const patches = makePatches('from this', 'to this')

// Make unidiff-formatted (string) patch
const patch = stringifyPatches(patches)

// Apply the patch (either the unidiff-formatted or the internal array representation)
const newValue = applyPatches('from this', patches)
```

#### Creating diffs

```ts
import { makeDiff } from '@sanity/diff-match-patch'

// Make an array of diff tuples, eg `[DiffType, string]`
const diff = makeDiff('from this', 'to this')
```

#### Matching text

```ts
import { match } from '@sanity/diff-match-patch'

// Find position in text for the given pattern, at the approximate location given
const position = match('some text to match against', 'match', 9)
```

### Algorithms

This library implements [Myer's diff algorithm](https://neil.fraser.name/writing/diff/myers.pdf) which is generally considered to be the best general-purpose diff. A layer of [pre-diff speedups and post-diff cleanups](https://neil.fraser.name/writing/diff/) surround the diff algorithm, improving both performance and output quality.

This library also implements a [Bitap matching algorithm](https://neil.fraser.name/writing/patch/bitap.ps) at the heart of a [flexible matching and patching strategy](https://neil.fraser.name/writing/patch/).

### Significant changes

This fork has a few modifications to [the original](https://github.com/google/diff-match-patch):

- API has changed - individual methods are exposed as importable functions instead of being attached to a `DiffMatchPatch` prototype
- Includes a fix for surrogate pair handling, by [Dennis Snell](https://github.com/google/diff-match-patch/pull/80)
- Uses modern tooling for code compilation and testing
