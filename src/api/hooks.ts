import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { request } from "./client";
import { useApi } from "./provider";
export function useData<T>(path: string, enabled = true) {
  const { ready, serverUrl } = useApi();
  return useQuery({
    queryKey: ["snowmilk", serverUrl, path],
    queryFn: ({ signal }) => request<T>(path, { signal }),
    enabled: ready && enabled,
    staleTime: 30000,
    retry: 1,
  });
}
export function useSave<T = unknown>(onSuccess?: (data: T) => void) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      path,
      method = "POST",
      body,
    }: {
      path: string;
      method?: string;
      body?: unknown;
    }) => request<T>(path, { method, body }),
    onSuccess: (data) => {
      void client.invalidateQueries({ queryKey: ["snowmilk"] });
      onSuccess?.(data);
    },
  });
}
