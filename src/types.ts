// types.ts
export interface BiddingItem {
   id: number;
  itemName: string;
  itemPrice: number;
  timeWindowHours: number;
  timeWindowMinutes: number;
  state: 'draft' | 'published'
}

export interface DerivedBiddingItem {
  itemName: string;
  itemPrice: number;
  timeWindow: string; // Representing the time window as a formatted string (e.g., "2h 30m")
}
