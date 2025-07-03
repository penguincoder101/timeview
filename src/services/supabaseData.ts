import { supabase } from '../lib/supabase';
import { Topic, TimelineEvent } from '../types';

export interface DatabaseTopic {
  id: string;
  name: string;
  default_display_mode: 'years' | 'days';
  created_at: string;
  updated_at: string;
}

export interface DatabaseEvent {
  id: string;
  topic_id: string;
  title: string;
  date: string;
  year: number;
  description: string;
  short_description?: string;
  image_url: string;
  details_url?: string;
  tags?: string[];
  related_topic_id?: string;
  created_at: string;
  updated_at: string;
}

// Transform database topic to application topic
function transformDatabaseTopic(dbTopic: DatabaseTopic, events: TimelineEvent[]): Topic {
  return {
    id: dbTopic.id,
    name: dbTopic.name,
    defaultDisplayMode: dbTopic.default_display_mode,
    events: events
  };
}

// Transform database event to application event
function transformDatabaseEvent(dbEvent: DatabaseEvent): TimelineEvent {
  return {
    id: dbEvent.id,
    title: dbEvent.title,
    date: dbEvent.date,
    year: dbEvent.year,
    description: dbEvent.description,
    shortDescription: dbEvent.short_description,
    imageUrl: dbEvent.image_url,
    detailsUrl: dbEvent.details_url,
    tags: dbEvent.tags,
    relatedTopicId: dbEvent.related_topic_id
  };
}

// Fetch all topics with their events (public access)
export async function fetchTopics(): Promise<{ data: Topic[] | null; error: Error | null }> {
  try {
    // Fetch all topics
    const { data: topicsData, error: topicsError } = await supabase
      .from('topics')
      .select('*')
      .order('name');

    if (topicsError) {
      throw new Error(`Failed to fetch topics: ${topicsError.message}`);
    }

    if (!topicsData) {
      return { data: [], error: null };
    }

    // Fetch all events for the topics
    const topicIds = topicsData.map(t => t.id);
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('topic_id', topicIds)
      .order('year');

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    // Group events by topic
    const eventsByTopic = new Map<string, TimelineEvent[]>();
    
    if (eventsData) {
      eventsData.forEach((dbEvent: DatabaseEvent) => {
        const event = transformDatabaseEvent(dbEvent);
        if (!eventsByTopic.has(dbEvent.topic_id)) {
          eventsByTopic.set(dbEvent.topic_id, []);
        }
        eventsByTopic.get(dbEvent.topic_id)!.push(event);
      });
    }

    // Transform topics with their events
    const topics = topicsData.map((dbTopic: DatabaseTopic) => {
      const events = eventsByTopic.get(dbTopic.id) || [];
      return transformDatabaseTopic(dbTopic, events);
    });

    return { data: topics, error: null };
  } catch (error) {
    console.error('Error fetching topics:', error);
    return { data: null, error: error as Error };
  }
}