// Quote types to adapt API responses
export interface QuoteOwner {
  id: number;
  name: string;
  email: string;
  role: "ADMIN" | "REGULAR";
}

export interface Quote {
  id: number;
  text: string;
  owner: QuoteOwner;
  createdAt: string;
  updatedAt: string;
}

// Keep only core quote entities here. Request/response shapes live in services.
