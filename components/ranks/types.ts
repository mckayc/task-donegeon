export interface Rank {
  id:string;
  name: string;
  xpThreshold: number;
  iconType: 'emoji' | 'image';
  icon: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}