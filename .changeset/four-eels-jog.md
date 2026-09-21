---
"@sanity/diff-match-patch": patch
---

fix: count astral characters as 4 utf8 bytes, not 7

Stringified patch headers counted every character outside the Basic
Multilingual Plane as 7 utf8 bytes instead of 4, inflating utf8
offsets/lengths for byte-oriented consumers.
