- main goal: simple ADN easy way to deal with code, versioning sharing, the zef DHS
- allow using ZefValueHashes instead of actual values for e.g. return vals, within side effects etc.
- execute zef code in env with logging: log all effects
- md TOML header to allow setting e.g. whether compiled svelte should be embedded in the md file, criteria for when a value is printed literally vs its hash. Or show the outer entity and only replace some field values with hashes.

- back the zef MD file with a hash store / graph: store hashed values, images, version control, dependencies etc. in here
- dependency tracking between code blocks in MD file: allow sequential, imperative execution flow of blocks / cells: executing a block can modify the namespace seen by later blocks (is it useful to express this in FX?)
- history tracking: versioning of each code block? And text? At which level of granularity? On saves?
- automatic syncing policy with a specified store (local / group-specific / global)
- should the zef VSCode plugin be enabled for all md files or only .zef.md? Configurable?
- separate panel to visualize history? Inspired by git UIs? But more fine grained?
- how should the VCS work? On file saves? Separate shortcut?
- allow Obsidian syntax for transclusions? e.g. code blocks backed by "files" or a versioned zef function in the DB?
- allow including code blocks / MD snippets etc. via:
  a. fixed hashes
  b. entity snapshorts (uid, but pinned version)
  c. eternal uids (latest version)
  d. files (?)

  
