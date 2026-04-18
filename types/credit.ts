export interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price: number;
  currency: string;
  isPopular?: boolean;
}

export interface UserCredits {
  remaining: number;
  total: number;
  lastUpdated: string;
}
