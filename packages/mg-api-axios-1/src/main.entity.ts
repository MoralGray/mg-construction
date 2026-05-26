export interface PathOptions {
    id?: string | number | null;
    filters?: Record<string, string | number | boolean | null | undefined> | null;
}

export type ApiEndpointMethods<T = unknown> = {
    get: (options?: PathOptions) => Promise<T>;
    post: (data: unknown, options?: PathOptions) => Promise<T>;
    put: (data: unknown, options?: PathOptions) => Promise<T>;
    patch: (data: unknown, options?: PathOptions) => Promise<T>;
    del: (options?: PathOptions) => Promise<T>;
};
