export interface MediaItem {
  id: number;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  name?: string;
  price?: string;
  images?: {
    model1?: string;
    [key: string]: string | undefined;
  };
}

export type FeedMode = 'afProducts' | 'myPhotos';
