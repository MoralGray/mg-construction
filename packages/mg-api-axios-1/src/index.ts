import axios, { type AxiosError, type AxiosInstance, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';
import { HttpErrorInterceptor } from './httpError.interceptor';
import type { ApiEndpointMethods, PathOptions } from './main.entity';

declare module 'axios' {
    export interface InternalAxiosRequestConfig {
        _retry?: boolean;
    }
}

class ApiClient {
    private axiosInstance: AxiosInstance;
    private basePath: string;

    constructor(basePath = 'http://localhost:3001') {
        this.basePath = basePath;
        this.axiosInstance = axios.create({
            baseURL: this.basePath,
        });

        this.setupInterceptors();
    }

    /**
     * - # Простой пример
     * - Используем: API.orders.get()
     * - В случае если есть id: API.orders.get({id}) // orders/1
     *
     * - # В случае если id в середине
     * - Указываем в URLS место id - $id
     * - orders/$id/some
     * - Вызываем API.orders.get({id}) // orders/1/some
     *
     * - # Фильтры
     * - Указываем объект внутри объекта filters
     * - API.orders.get({id, filters: {num: 1, abd: 'abd'}}); // orders/1?num=1&abc=abc
     *
     * - # SWR
     * - Для SWR нужна чистая строка.
     * - Чистую строку берем из URLS.
     * **/
    public createApi(definition: Record<string, string>) {
        const result: Record<string, ApiEndpointMethods> = {};
        for (const [key, value] of Object.entries(definition)) {
            result[key] = this.APIMethods(value);
        }
        return result;
    }

    private setupInterceptors(): void {
        // Request interceptor
        this.axiosInstance.interceptors.request.use(
            (config: InternalAxiosRequestConfig) => {
                // Токен проставляется автоматически через HTTPOnly куки
                return config;
            },
            (error: AxiosError) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor
        this.axiosInstance.interceptors.response.use(
            (response: AxiosResponse) => response,
            (error: AxiosError) => {
                const originalRequest = error.config;

                // Проверяем, что есть конфиг запроса и статус ошибки 401
                if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
                    originalRequest._retry = true;
                }

                HttpErrorInterceptor(error);
                return Promise.reject(error);
            }
        );
    }

    private async request<T = unknown>(method: string, api: string, data?: unknown, options?: PathOptions): Promise<T> {
        try {
            const url = this.getPath(api, options);
            const config: Partial<InternalAxiosRequestConfig> = { method, url, data: data };

            if (data instanceof FormData) {
                (config as Record<string, unknown>).headers = { 'Content-Type': 'multipart/form-data' };
            }

            config.data = data;
            // config.headers = { Timezone: Intl.DateTimeFormat().resolvedOptions().timeZone };

            const res = await this.axiosInstance(config);
            return res.data;
        } catch (error: unknown) {
            return Promise.reject(error);
        }
    }

    private getPath(api: string, options?: PathOptions): string {
        let path = api;

        if (typeof options === 'undefined') {
            return `${path}`;
        }

        // Обработка `$id` в пути
        const hasIdPlaceholder = api.includes('$id');
        if (hasIdPlaceholder && options.id != null) {
            path = path.replace('$id', String(options.id));
        } else if (!hasIdPlaceholder && options.id != null) {
            path = `${path}/${options.id}`;
        }

        // Обработка фильтров (если они есть)
        let queryString = '';
        if (options.filters) {
            const validFilters = Object.entries(options.filters)
                .filter(([_, value]) => value !== null && value !== undefined)
                .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`);

            if (validFilters.length > 0) {
                queryString = `?${validFilters.join('&')}`;
            }
        }

        return `${path}${queryString}`;
    }

    private APIMethods(baseUrl: string): ApiEndpointMethods {
        return {
            get: (options) => this.request('GET', baseUrl, undefined, options),
            post: (data, options) => this.request('POST', baseUrl, data, options),
            put: (data, options) => this.request('PUT', baseUrl, data, options),
            patch: (data, options) => this.request('PATCH', baseUrl, data, options),
            del: (options) => this.request('DELETE', baseUrl, undefined, options),
        };
    }

    // public SWRGetRequest<T>(url: string): Promise<T> {
    //   return this.axiosInstance
    //     .get<T>(url)
    //     .then((res: AxiosResponse<T>) => {
    //       return res.data;
    //     })
    //     .catch((error: AxiosError) => {
    //       console.error("Error in SWRGetRequest:", error);
    //       throw error;
    //     });
    // }
}

export { ApiClient };
