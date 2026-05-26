import type { AxiosError } from 'axios';

function UnhandledError(_error: AxiosError) {}

function Error401(_error: AxiosError) {}

function Error503(_error: AxiosError) {}

function HTTPError(error: AxiosError) {
    switch (error?.status) {
        case 401:
            Error401(error);
            break;
        case 503:
            Error503(error);
            break;
        default:
            UnhandledError(error);
            break;
    }
}

export function HttpErrorInterceptor(error: AxiosError) {
    HTTPError(error);
}
