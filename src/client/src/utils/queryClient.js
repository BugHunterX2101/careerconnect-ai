import { QueryClient } from 'react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
      cacheTime: 10 * 60 * 1000
    },
    mutations: {
      retry: 0
    }
  }
});

// Dashboard and analytics data changes often.
queryClient.setQueryDefaults(['dashboard'], {
  staleTime: 2 * 60 * 1000
});
queryClient.setQueryDefaults(['dashboard', 'analytics'], {
  staleTime: 60 * 1000
});

// Jobs and profile can remain cached a bit longer.
queryClient.setQueryDefaults(['jobs'], {
  staleTime: 3 * 60 * 1000
});
queryClient.setQueryDefaults(['profile'], {
  staleTime: 5 * 60 * 1000
});
queryClient.setQueryDefaults(['notifications'], {
  staleTime: 30 * 1000
});

export default queryClient;
