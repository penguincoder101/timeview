export interface TimelineEvent {
  id: string;
  title: string;
  date: string;
  year: number;
  description: string;
  shortDescription?: string;
  imageUrl: string;
  detailsUrl?: string;
  tags?: string[];
  dateObject?: Date;
  relatedTopicId?: string;
}

export interface Topic {
  id: string;
  name: string;
  events: TimelineEvent[];
  defaultDisplayMode?: TimelineDisplayMode;
}

export type TopicId = string;

export type PageType = 'topicSelection' | 'timelineView';

export type TimeDirection = 'forward' | 'backward' | 'none';

export type TimelineDisplayMode = 'years' | 'days';

export interface NewEventForm {
  id?: string;
  title: string;
  date: string;
  year: string;
  description: string;
  shortDescription: string;
  imageUrl: string;
  detailsUrl: string;
  tags: string;
}

export interface NewTopicForm {
  id?: string;
  name: string;
  events: NewEventForm[];
  defaultDisplayMode?: TimelineDisplayMode;
}