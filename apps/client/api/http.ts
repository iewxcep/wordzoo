import type { $Fetch } from "ofetch";

import { useRuntimeConfig } from "#app";
import { ofetch } from "ofetch";

let http: $Fetch;
const startedAtMap = new WeakMap<object, number>();

export function setupHttp() {
  if (http) return http;

  const config = useRuntimeConfig();
  const baseURL = config.public.apiBase as string;

  http = ofetch.create({
    baseURL,
    headers: { "Content-Type": "application/json" },
    onRequest({ request, options }) {
      startedAtMap.set(options, Date.now());
      console.log(`[http] --> ${options.method || "GET"} ${request}`);
    },
    onResponse({ request, options, response }) {
      const startedAt = startedAtMap.get(options) ?? Date.now();
      console.log(
        `[http] <-- ${response.status} ${request} (${Date.now() - startedAt}ms)`,
      );
    },
    async onResponseError({ request, response }) {
      console.error(
        `[http] <-- ${response.status} ${request} body:`,
        response._data,
      );
      const { message } = response._data;
      if (Array.isArray(message)) {
        message.forEach((item) => {
          httpStatusErrorHandler?.(item, response.status);
        });
      } else {
        httpStatusErrorHandler?.(message, response.status);
      }
      return Promise.reject(response._data);
    },
    retry: 3,
    retryDelay: 1000,
  });
}

type HttpStatusErrorHandler = (message: string, statusCode: number) => void;
let httpStatusErrorHandler: HttpStatusErrorHandler;

export function injectHttpStatusErrorHandler(handler: HttpStatusErrorHandler) {
  httpStatusErrorHandler = handler;
}

export function getHttp() {
  if (!http) {
    throw new Error("HTTP client not initialized. Call setupHttp first.");
  }
  return http;
}
