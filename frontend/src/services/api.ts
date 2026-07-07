const API_BASE_URL = "http://localhost:8000/api/v1";

interface RequestOptions extends RequestInit {
  token?: string | null;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, ...customOptions } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  // Inject token if available
  const activeToken = token || localStorage.getItem("token");
  if (activeToken) {
    headers["Authorization"] = `Bearer ${activeToken}`;
  }

  const config = {
    ...customOptions,
    headers: {
      ...headers,
      ...customOptions.headers,
    },
  };

  const response = await fetch(`${API_BASE_URL}${path}`, config);

  if (response.status === 204) {
    return {} as T;
  }

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || "Something went wrong");
  }

  return data as T;
}

export const api = {
  auth: {
    login: async (email: string, password: str) => {
      // Standard OAuth2 form URL encoded request
      const formData = new URLSearchParams();
      formData.append("username", email);
      formData.append("password", password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || "Failed to authenticate");
      }
      return data; // returns { access_token, token_type }
    },
    register: async (userData: any) => {
      return request<any>("/auth/register", {
        method: "POST",
        body: JSON.stringify(userData),
      });
    },
  },
  user: {
    getMe: async () => {
      return request<any>("/users/me");
    },
    updateMe: async (userData: any) => {
      return request<any>("/users/me", {
        method: "PUT",
        body: JSON.stringify(userData),
      });
    },
  },
  watchlists: {
    getWatchlists: async () => {
      return request<any[]>("/watchlists");
    },
    createWatchlist: async (name: string) => {
      return request<any>("/watchlists", {
        method: "POST",
        body: JSON.stringify({ name }),
      });
    },
    deleteWatchlist: async (id: number) => {
      return request<any>(`/watchlists/${id}`, {
        method: "DELETE",
      });
    },
    addItem: async (watchlistId: number, symbol: string) => {
      return request<any>(`/watchlists/${watchlistId}/items`, {
        method: "POST",
        body: JSON.stringify({ symbol }),
      });
    },
    removeItem: async (watchlistId: number, symbol: string) => {
      return request<any>(`/watchlists/${watchlistId}/items/${symbol}`, {
        method: "DELETE",
      });
    },
  },
  stocks: {
    search: async (query: string) => {
      return request<any[]>(`/stocks/search?q=${encodeURIComponent(query)}`);
    },
    getInfo: async (symbol: string) => {
      return request<any>(`/stocks/${symbol}/info`);
    },
    getHistory: async (symbol: string, period = "1mo", interval = "1d") => {
      return request<any[]>(`/stocks/${symbol}/history?period=${period}&interval=${interval}`);
    },
    getAnalysis: async (symbol: string, period = "1y", interval = "1d") => {
      return request<any>(`/stocks/${symbol}/analysis?period=${period}&interval=${interval}`);
    },
    getAiSummary: async (symbol: string, period = "1y", interval = "1d") => {
      return request<any>(`/stocks/${symbol}/ai-summary?period=${period}&interval=${interval}`);
    },
  },
};
