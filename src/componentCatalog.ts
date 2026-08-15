import * as fs from 'fs';
import * as path from 'path';
import { RegisteredZefSvelteComponent, registeredZefSvelteComponents } from './generated/zefSvelteComponentCatalog';

export interface ResolvedZefSvelteComponent {
    registration: RegisteredZefSvelteComponent;
    source: string;
}

/** Pure exact-match dispatch over the catalogue generated during extension compilation. */
export function resolveZefSvelteComponent(entityType: string): RegisteredZefSvelteComponent | undefined {
    return registeredZefSvelteComponents.find(component => component.dispatchedOn.includes(entityType));
}

/** Read only a component path that was registered during extension compilation. */
export function loadZefSvelteComponent(extensionPath: string, entityType: string): ResolvedZefSvelteComponent | undefined {
    const registration = resolveZefSvelteComponent(entityType);
    if (!registration) return undefined;

    const componentPath = path.resolve(extensionPath, registration.relativePath);
    const componentsRoot = path.resolve(extensionPath, 'zef-svelte-components') + path.sep;
    if (!componentPath.startsWith(componentsRoot)) {
        throw new Error(`Invalid registered component path: ${registration.relativePath}`);
    }

    return { registration, source: fs.readFileSync(componentPath, 'utf8') };
}
