# Store runtime adapter

## Contract and decision

The current [[ET.MarkdownDocument('🍃-2f98572f9b3e572db42b')|Zef Store service]] replaces the retired HashStoreGet/HashStorePut service. Native local coordination supplies configured storage, Halo lookup, and retention. A JSON-like WebSocket request is not a replacement for the private native-binary Store protocol.

The extension uses a fixed-operation Python subprocess adapter and the managed Zef runtime. It sends plain JSON on stdin; Python constructs and executes SaveToHashStore or RetrieveFromHashStore using Zef's supported native transport. No Python source is evaluated. No database is provisioned, no legacy store is searched, and no remote publication destination is selected by the extension.

Inputs are typed image bytes or a typed Merkle hash. Save returns a Merkle hash plus a physical-merge receipt; retrieve returns the value directly. SVG uses UTF-8 text in Zef's JSON-like representation, whereas raster images use base64. Text entities retain literal content fields. Receipt database handles are deliberately excluded from the bridge response because they are unnecessary and not supported by every JSON-like codec.

## Review and operational bounds

Reusing Zef avoids maintaining another binary value codec in TypeScript. A one-request subprocess is simpler than a second persistent kernel and isolates runtime failures from notebook execution. The cost is interpreter startup per operation; results are cached in the extension. Requests are queued with four active subprocesses and at most 128 waiting requests. Each active request has a 40-second deadline and bounded output. Disposal rejects queued work and terminates active subprocesses. Timed-out saves are not automatically retried: their outcome may be unknown.

The default interpreter is the installer-managed Zef virtual environment on macOS or Linux. Set `ZEF_STORE_PYTHON` to an explicit Python executable for development or other installations. Notebook interpreter selection is independent: plotting must not require Zef in that notebook environment. Zef itself honors its normal local Tokolosh environment/configuration. The old WebSocket URL override is not used for Store requests.

The connection check verifies local Tokolosh connectivity, not Store provisioning or authorization. Actual operation errors appear in the settings status and temporary debug log. Local notebook PNGs remain renderable even if storage fails. Hash references from the retired store are not automatically migrated; an identical-looking reference does not prove that its content exists in the configured current Store.

## Verification

Run `npm run test:store` for request/response, error, subprocess, and figure-rendering regressions. Run `ZEF_STORE_LIVE_TEST=1 npm run test:tokolosh` to require real PNG and Unicode SVG save/retrieve round trips through local Tokolosh. The live test writes small immutable test images to the configured Store; it does not provision or alter configuration. Without that environment variable the Tokolosh test runs only its pure checks.
