import axios, {
  AxiosError,
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 60000,
});

request.interceptors.request.use(
  (requestConfig) => {
    const token = localStorage.getItem('token');
    requestConfig.headers.Authorization = token; // to be declared as:    `Bearer ${token}`;

    /*
      if (requestConfig.url?.includes("/suppliers/upload")) {
        console.log(" ====== upload attachment ====== ");
        requestConfig.headers.Authorization = "Bearer " + token;
        requestConfig.headers["Content-Type"] = "multipart/form-data";
        return requestConfig;
      }
  
      if (requestConfig.url?.includes("/suppliers/download_sample")) {
        console.log(" ====== download sample ====== ");
        requestConfig.headers.Authorization = "Bearer " + token;
        requestConfig.headers["Content-Disposition"] =
          "attachment; filename=SuppliersSampleForUpload.xlsx";
        requestConfig.headers["Content-Type"] = "application/octet-stream";
        requestConfig.responseType = "blob";
        return requestConfig;
      }
      */
    return requestConfig;
  },
  (error) => {
    return Promise.reject(error);
  },
);

export { request };
