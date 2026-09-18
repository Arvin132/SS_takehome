import { QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'

import App from './App.tsx'
import { ApiError } from './api/client'
import { queryKeys } from './api/queries'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      retry: (failureCount, error) =>
        !(error instanceof ApiError && error.isUnauthorized) && failureCount < 2,
    },
  },
  // A rejected session anywhere in the app drops the user back to the login screen.
  queryCache: new QueryCache({
    onError: (error, query) => {
      const isSessionProbe = query.queryKey[0] === queryKeys.session[0]
      if (error instanceof ApiError && error.isUnauthorized && !isSessionProbe) {
        queryClient.setQueryData(queryKeys.session, null)
      }
    },
  }),
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
