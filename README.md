# search-refiner

## Goals
This was a project I took on personally back in 2019 with a few goals:
1. Get more familiar with `Browser Extension APIs`
2. Get more familiar with `Natural Language Processing`
3. Try to start learning `Rust`
4. Try to start working with `WebAssembly (WASM)`
5. Create a browser extension that provided some basic semantic analysis to search engine results

## Basic intended features:
1. Adding icon(s) next each search result on the search page which provided information derived from NLP such as sentiment and eventually wikipedia-style standards (that was the idea anyway)
2. Adding domains which are excluded by default from search results as an alternative to search engine syntax

## Where it is now:
I had to abandon it in a half-formed state due to other life priorities. I still have published it here as I was proud to be able to:

1. Implement an interface to a rust-based NLP library and use tokenization and classification to score sentiments on each search result
2. Leverage `wasm-pack` with Rust to compile Rust code into WebAssembly and utilize it at browser runtime
3. Successfully build a browser extension that leverages WASM and is able to populate dynamic UI into the page using `MutationObservers`
