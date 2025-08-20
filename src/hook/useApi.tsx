import axios, { type AxiosRequestConfig, type AxiosResponse } from "axios";
import type { MutableRefObject } from "react";
import { notifyError } from "../utils/useutils";
import qs from "qs";

// USAGE

// makeRequest("POST", "/api/users", { name: "John", age: 30 }, undefined, token, undefined, "urlencoded");

type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
type Params = Record<string, any> | null;
type Token = string | null;
type AbortControllerRef = MutableRefObject<AbortController | null>;
type ContentType = "json" | "urlencoded" | "multipart";

 const logout =()=> {
  localStorage.removeItem('ok');
  localStorage.removeItem('ok_admin_token');
  window.location.reload()
 }

const makeRequest = async <T = any>(
  method: RequestMethod,
  api: string,
  params?: Params,
  cb?: any,
  token?: Token,
  abortController?: any,
  contentType: ContentType = "json"
): Promise<{ res?: T; error?: string }> => {
  // Don't attempt request if user is offline
  if (!navigator.onLine) {
    const errorMsg = "You are currently offline. Please check your internet connection.";
    notifyError(errorMsg);
    return { error: errorMsg };
  }

  const headers: Record<string, string> = {};
  let processedData: Params | string | null = params ?? null;

  // Set the appropriate content type and format data accordingly
  if (contentType === "json") {
    headers["Content-Type"] = "application/json";
    // JSON data doesn't need special processing
  } else if (contentType === "urlencoded") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    // Convert data to URL-encoded format
    processedData = params ? qs.stringify(params) : null as string | null;
  } else if (contentType === "multipart") {
    if (params) {
      const formData = new FormData();
      Object.entries(params).forEach(([key, value]) => {
        // Handle file uploads
        if (value instanceof File) {
          formData.append(key, value);
        } 
        // Handle arrays
        else if (Array.isArray(value)) {
          value.forEach(item => {
            formData.append(`${key}[]`, item);
          });
        } 
        // Handle normal values
        else {
          formData.append(key, String(value));
        }
      });
      processedData = formData;
    }
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const config: AxiosRequestConfig = {
    method,
    url: api,
    headers,
    signal: abortController?.current?.signal,
  };

  // Place data in the appropriate property based on the request method
  if (method === "GET") {
    config.params = processedData;
  } else {
    config.data = processedData;
  }

  try {
    const response: AxiosResponse<T> = await axios(config);
    cb?.(); // execute callback if provided
    return { res: response.data };
  } catch (error: any) {
    cb?.(); // still execute callback on error



    if (axios.isAxiosError(error)) {
      const errMsg:any = error.message;

      if (errMsg === "Network Error") {
        const errorMsg = "Could not connect to the server. Please check your internet and try again.";
        notifyError(errorMsg);
        return { error: errorMsg };
      }

      const errorRes = error.response?.data;

      if (errorRes?.message === "Too many requests. Please try again in a minute.") {
        const errorMsg = "Too many requests. Please try again in a minute.";
        notifyError(errorMsg);
        return { error: errorMsg };
      }

      if (errorRes?.error === "jwt expired") {
        logout();
        const errorMsg = "Session expired. Please log in again.";
        notifyError(errorMsg);
        return { error: errorMsg };
      }

      if (errorRes?.error === "page not found") {
        window.location.href = "/page-not-found";
        return { error: "Page not found" };
      }
     

      if (errorRes?.error) {
        notifyError(errorRes.error);
        return { error: errorRes.error };
      }
    }

    const unexpectedError = `Unexpected error occurred: ${String(error)}`;
    notifyError(unexpectedError);
    return { error: unexpectedError };
  }
};

export { makeRequest };