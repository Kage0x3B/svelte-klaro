import { getCookie, setCookie, deleteCookie } from './utils/cookies.js';
import type { ConsentManager } from '$lib/klaro/consent-manager.js';
import type { Constructable } from '$lib/klaro/types/util-types.js';

export type KlaroStorageMethod = 'test' | 'cookie' | 'localStorage' | 'sessionStorage';

export interface IKlaroStore {
    get(): string | null;

    set(value: string): void;

    delete(): void;
}

export class TestStore implements IKlaroStore {
    private value: string | null = null;

    get(): string | null {
        return this.value;
    }

    set(value: string | null) {
        this.value = value;
    }

    delete(): void {
        this.value = null;
    }
}

export class CookieStore implements IKlaroStore {
    private readonly cookieName: string;
    private readonly cookieDomain: string | null;
    private readonly cookiePath: string | null;
    private readonly cookieExpiresAfterDays: number;

    constructor(manager: ConsentManager) {
        this.cookieName = manager.storageName;
        this.cookieDomain = manager.cookieDomain ?? null;
        this.cookiePath = manager.cookiePath ?? null;
        this.cookieExpiresAfterDays = manager.cookieExpiresAfterDays;
    }

    get(): string | null {
        const cookie = getCookie(this.cookieName);
        return cookie ? cookie.value : null;
    }

    set(value: string): void {
        return setCookie(
            this.cookieName,
            value,
            this.cookieExpiresAfterDays,
            this.cookieDomain ?? undefined,
            this.cookiePath ?? undefined
        );
    }

    delete() {
        return deleteCookie(this.cookieName);
    }
}

class StorageStore implements IKlaroStore {
    private readonly key: string;

    constructor(
        manager: ConsentManager,
        private readonly handle: {
            getItem: (key: string) => string | null;
            setItem: (key: string, value: string) => void;
            removeItem: (key: string) => void;
        }
    ) {
        this.key = manager.storageName;
    }

    get(): string | null {
        return this.handle.getItem(this.key);
    }

    getWithKey(key: string): string | null {
        return this.handle.getItem(key);
    }

    set(value: string): void {
        return this.handle.setItem(this.key, value);
    }

    setWithKey(key: string, value: string): void {
        return this.handle.setItem(key, value);
    }

    delete(): void {
        return this.handle.removeItem(this.key);
    }

    deleteWithKey(key: string): void {
        return this.handle.removeItem(key);
    }
}

export class LocalStorageStore extends StorageStore {
    constructor(manager: ConsentManager) {
        super(manager, localStorage);
    }
}

export class SessionStorageStore extends StorageStore {
    constructor(manager: ConsentManager) {
        super(manager, sessionStorage);
    }
}

// TODO: Does this prevent tree-shaking?
export const availableStores: Record<KlaroStorageMethod, Constructable<IKlaroStore>> = {
    cookie: CookieStore,
    test: TestStore,
    localStorage: LocalStorageStore,
    sessionStorage: SessionStorageStore
};
