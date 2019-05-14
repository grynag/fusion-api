import uuid from "uuid/v1";
import { IAuthContainer } from "../../auth/AuthContainer";
import IHttpClient from "./IHttpClient";
import { HttpResponse } from "./HttpResponse";
import {
    HttpClientError,
    HttpClientParseError,
    HttpClientRequestFailedError,
} from "./HttpClientError";
import ensureRequestInit from "./ensureRequestInit";

// Export interface, response and error types
export {
    IHttpClient,
    HttpResponse,
    HttpClientError,
    HttpClientParseError,
    HttpClientRequestFailedError,
};

export default class HttpClient implements IHttpClient {
    private authContainer: IAuthContainer;
    private requestsInProgress: { [key: string]: Promise<HttpResponse<any>> } = {};
    private sessionId = uuid();

    constructor(authContainer: IAuthContainer) {
        this.authContainer = authContainer;
    }

    async getAsync<T, TExpectedErrorResponse>(
        url: string,
        init?: RequestInit
    ): Promise<HttpResponse<T>> {
        // Reuse GET requests in progress
        const requestInProgress = this.getRequestInProgress<T>(url);
        if (requestInProgress) {
            return await requestInProgress;
        }

        init = ensureRequestInit(init, init => ({ ...init, method: "GET" }));

        const request = this.performFetchAsync<T, TExpectedErrorResponse>(url, init);
        this.requestsInProgress[url] = request;

        const response = await request;
        delete this.requestsInProgress[url];

        return response;
    }

    async postAsync<TBody, TResponse, TExpectedErrorResponse>(
        url: string,
        body: TBody,
        init?: RequestInit
    ): Promise<HttpResponse<TResponse>> {
        init = ensureRequestInit(init, init => ({
            ...init,
            method: "POST",
            body: JSON.stringify(body),
        }));

        return await this.performFetchAsync<TResponse, TExpectedErrorResponse>(url, init);
    }

    async putAsync<TBody, TResponse, TExpectedErrorResponse>(
        url: string,
        body: TBody,
        init?: RequestInit
    ): Promise<HttpResponse<TResponse>> {
        init = ensureRequestInit(init, init => ({
            ...init,
            method: "PUT",
            body: JSON.stringify(body),
        }));

        return await this.performFetchAsync<TResponse, TExpectedErrorResponse>(url, init);
    }

    private getRequestInProgress<T>(url: string): Promise<HttpResponse<T>> {
        return this.requestsInProgress[url] as Promise<HttpResponse<T>>;
    }

    private addSessionIdHeader(init: RequestInit): RequestInit {
        return {
            ...init,
            headers: new Headers({
                ...init.headers,
                "X-Session-Id": this.sessionId,
            }),
        };
    }

    private addAcceptJsonHeader(init: RequestInit): RequestInit {
        return {
            ...init,
            headers: new Headers({
                ...init.headers,
                Accept: "application/json",
            }),
        };
    }

    private addRefreshHeader(init: RequestInit): RequestInit {
        return {
            ...init,
            headers: new Headers({
                ...init.headers,
                "x-pp-refresh": "application/json",
            }),
        };
    }

    private async addAuthHeaderAsync(url: string, init: RequestInit): Promise<RequestInit> {
        const token = await this.authContainer.acquireTokenAsync(url);

        const headers = new Headers({
            ...init.headers,
            Authorization: "Bearer " + token,
        });

        return {
            ...init,
            headers,
        };
    }

    private async transformRequestAsync(url: string, init: RequestInit): Promise<RequestInit> {
        const requestWithSessionId = this.addSessionIdHeader(init);
        const requestWithAcceptJson = this.addAcceptJsonHeader(requestWithSessionId);
        const requestWithAuthToken = await this.addAuthHeaderAsync(url, requestWithAcceptJson);

        return requestWithAuthToken;
    }

    private async parseResponseAsync<T>(response: Response): Promise<T> {
        try {
            const json = await response.json();
            return json as T;
        } catch (parseError) {
            // Add more info
            throw new HttpClientParseError(response);
        }
    }

    private responseIsRefreshable(response: Response): boolean {
        return response.headers.get("x-pp-is-refreshable") !== null;
    }

    private async performFetchAsync<T, TExpectedErrorResponse>(
        url: string,
        init: RequestInit
    ): Promise<HttpResponse<T>> {
        try {
            const options = await this.transformRequestAsync(url, init);

            const response = await fetch(url, options);

            // TODO: Track dependency with app insight

            if (!response.ok) {
                // Add more info
                const errorResponse = await this.parseResponseAsync<TExpectedErrorResponse>(
                    response
                );

                throw new HttpClientRequestFailedError(url, response.status, errorResponse);
            }

            const data = await this.parseResponseAsync<T>(response);

            let refreshPromise: Promise<HttpResponse<T>> | null = null;
            if (this.responseIsRefreshable(response)) {
                const refreshOptions = this.addRefreshHeader(options);
                refreshPromise = this.performFetchAsync(url, refreshOptions);
            }

            // TODO: Update cache status?

            return {
                data,
                status: response.status,
                headers: response.headers,
                refreshPromise,
            };
        } catch (error) {
            if (error instanceof HttpClientRequestFailedError) {
                // TODO: Add to notification center?
                // TODO: Update cache status?
                throw error;
            }

            // Add more info
            throw new HttpClientError();
        }
    }
}
