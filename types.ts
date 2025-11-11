
export enum Category {
  WarConflict = 'war_conflict',
  DiscoveryInvention = 'discovery_invention',
  Political = 'political',
  Cultural = 'cultural',
  Scientific = 'scientific',
  Technological = 'technological',
  SocialMovement = 'social_movement',
  Economic = 'economic',
  NaturalDisaster = 'natural_disaster',
  SpaceExploration = 'space_exploration',
}

export enum Era {
  Ancient = 'ancient',
  Medieval = 'medieval',
  Renaissance = 'renaissance',
  Enlightenment = 'enlightenment',
  Industrial = 'industrial',
  Modern = 'modern',
  Contemporary = 'contemporary',
}

export enum Significance {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Critical = 'critical',
}

export interface UserNote {
  user: string;
  note: string;
  createdAt: Date;
}

export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  summary: string;
  date: Date;
  year: number;
  category: Category;
  era: Era;
  location?: string;
  image_url: string;
  significance: Significance;
  favorited_by?: string[];
  user_notes?: UserNote[];
}
