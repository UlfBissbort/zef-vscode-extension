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
  b. entity snapshots (uid, but pinned version)
  c. eternal uids (latest version)
  d. files (?)

- allow linking to other zef md docs: but not via local files, but via the DHS and the hash / uid system. What should the syntax be?
- allow user to give metadata feedback in Zef View? e.g. rating of components etc.
- make writing zef exercises / tutorials easy from within zef md files? Render them nicely in Zef View?

## Controlling Systems from Zef MD
- use 



## Zef MD docs as Scratch
- Automatic Tracking of all that is done in an MD doc: file can be discarded, all Zef MD docs are automatically tracked and stored e.g. in user's vault. With full history and versioning, tracking of evaluations and side effects.

## Sharing
- full zef md docs
- parts of zef md docs: code blocks, sections, paragraphs etc?


## Svelte Support
- allow specifying sample props for svelte components: for each component code block
- fixed value specified as
  - literal zef value
  - Zef signal
  - JSON?


## Zef Blog Integration
- use same UI theme in Zef MD View?
- make publishing easy
- same usage / rendering of Zef Components?



## LLM Agent Integration
- cli tool to allow agents to easily query and crawl the zef graph.
- with declarative rules on what they can see / do


## Defining a Full Zef App from Zef MD
- one more instance of running a bunch of managed FX
- mix languages / data definitions / UI components etc in same zef md doc
