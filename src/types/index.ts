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
  organizationId?: string;
  createdBy?: string;
  isPublic?: boolean;
}

export type TopicId = string;

export type PageType = 'topicSelection' | 'timelineView' | 'addTopic' | 'editTopic' | 'adminPage' | 'globalAdmin' | 'orgAdmin' | 'authPage';

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
  organizationId?: string;
  isPublic?: boolean;
}

// User and Organization types
export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: 'super_admin' | 'standard_user';
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  role: 'org_admin' | 'org_editor' | 'org_viewer';
  permissions?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  user?: UserProfile;
  organization?: Organization;
}

export type OrganizationRole = 'org_admin' | 'org_editor' | 'org_viewer';
export type GlobalRole = 'super_admin' | 'standard_user';