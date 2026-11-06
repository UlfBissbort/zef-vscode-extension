#!/usr/bin/env python3
"""One bounded JSON request per process; native Store transport stays in Zef.

No eval, remote endpoint overrides, database provisioning, or legacy store fallback.
"""
import json
import sys
import time
from contextlib import redirect_stdout


def execute(request):
    from zef import FX, collect, from_json_like, run, to_json, to_json_like

    FX = FX({
        'FX.SaveToHashStore': FX('d4809e48d0'),
        'FX.RetrieveFromHashStore': FX('8210e83a93'),
        'FX.ConnectToTokolosh': FX('3bf4eff694'),
        'FX.TokoloshStatus': FX('cb9617e3c9'),
    })
    operation = request.get('operation')
    if operation == 'probe':
        status = FX.ConnectToTokolosh() | run
        deadline = time.monotonic() + 5
        while str(status.state) in ('connecting', 'not_attempted', 'reconnecting') and time.monotonic() < deadline:
            time.sleep(0.05)
            status = FX.TokoloshStatus() | run
        if str(status.state) != 'connected':
            raise RuntimeError(f'Tokolosh connection is {status.state}; check the Zef installation and local daemon')
        return {'state': 'connected', 'socket_path': str(status.socket_path)}
    command = request['command']
    if operation != 'execute' or command.get('__type') not in ('FX.SaveToHashStore', 'FX.RetrieveFromHashStore'):
        raise ValueError('Unsupported Store operation')
    # Only the two fixed local operations are accepted. No arbitrary FX or where.
    if command['__type'] == 'FX.SaveToHashStore':
        if set(command) != {'__type', 'value'}:
            raise ValueError('Unexpected save fields')
        value = command['value'] | from_json_like | collect
        saved = FX.SaveToHashStore(value=value) | run
        # Serialize fields separately: database handles in the receipt are not
        # supported by all JSON-like codecs. Do not expose local DB identities.
        return {
            'hash': json.loads(str(saved['hash'] | to_json_like | to_json | collect)),
            'receipt': {'status': str(saved['receipt'].status), 'guarantee': str(saved['receipt'].guarantee)},
        }
    if set(command) != {'__type', 'hash'}:
        raise ValueError('Unexpected retrieve fields')
    hash_value = command['hash'] | from_json_like | collect
    value = FX.RetrieveFromHashStore(hash=hash_value) | run
    return json.loads(str(value | to_json_like | to_json | collect))


def main():
    # Reserve stdout for the protocol, including while importing the runtime.
    try:
        request = json.loads(sys.stdin.read(48 * 1024 * 1024 + 1))
        with redirect_stdout(sys.stderr):
            result = execute(request)
        response = {'ok': True, 'result': result}
    except Exception as error:
        response = {'ok': False, 'error': str(error)}
    print(json.dumps(response), flush=True)


if __name__ == '__main__':
    main()
