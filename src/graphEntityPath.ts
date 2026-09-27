import * as path from 'path';

const ENTITY = /^ET\.[A-Za-z][A-Za-z0-9_]*\('🍃-[0-9a-f]+'\)$/;

type GraphState = { __type?: string; __uid?: string; root_uid?: string; path?: string };
type TrackingRule = { root_uid?: string; root?: string };

export function parseEntityInput(input: string): string | undefined {
    const value = input.trim();
    return ENTITY.test(value) ? value : undefined;
}

export function resolveGraphPath(showJson: string, trackingJson: string, entity: string): string {
    const show = JSON.parse(showJson);
    const state: GraphState | undefined = show?.data?.result?.state;
    if (!show?.ok || show?.data?.result?.exists !== true ||
        `${state?.__type}('${state?.__uid}')` !== entity ||
        !state?.root_uid || !state?.path) {
        throw new Error('Entity not found in the committed graph, or it has no tracked file path.');
    }

    const rules: TrackingRule[] | undefined = JSON.parse(trackingJson)?.data?.rules;
    const roots = [...new Set(rules?.filter(rule => rule.root_uid === state.root_uid).map(rule => rule.root) ?? [])];
    if (roots.length !== 1 || !roots[0] || !path.isAbsolute(roots[0])) {
        throw new Error('No unique local tracking root is configured for this entity.');
    }
    const relative = state.path.replace(/\\/g, '/');
    if (path.posix.isAbsolute(relative) || relative.split('/').some(part => part === '..' || part === '.')) {
        throw new Error('The graph returned an unsafe file path.');
    }
    const root = path.resolve(roots[0]);
    const target = path.resolve(root, relative);
    if (target === root || !target.startsWith(root + path.sep)) {
        throw new Error('The graph returned a path outside the tracking root.');
    }
    return target;
}
