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

// Transform application topic to database format
function transformTopicToDatabase(topic: Topic): Omit<DatabaseTopic, 'created_at' | 'updated_at'> {
  return {
    id: topic.id,
    name: topic.name,
    default_display_mode: topic.defaultDisplayMode || 'years'
  };
}

// Transform application event to database format
function transformEventToDatabase(event: TimelineEvent, topicId: string): Omit<DatabaseEvent, 'created_at' | 'updated_at'> {
  return {
    id: event.id,
    topic_id: topicId,
    title: event.title,
    date: event.date,
    year: event.year,
    description: event.description,
    short_description: event.shortDescription,
    image_url: event.imageUrl,
    details_url: event.detailsUrl,
    tags: event.tags,
    related_topic_id: event.relatedTopicId
  };
}

// Fetch all topics with their events
export async function fetchTopics(): Promise<{ data: Topic[] | null; error: Error | null }> {
  try {
    // Fetch topics
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

    // Fetch all events
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
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

// Create a new topic with its events
export async function createTopic(topic: Topic): Promise<{ data: Topic | null; error: Error | null }> {
  try {
    // Start a transaction by creating the topic first
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .insert([transformTopicToDatabase(topic)])
      .select()
      .single();

    if (topicError) {
      throw new Error(`Failed to create topic: ${topicError.message}`);
    }

    // Create events for the topic
    if (topic.events.length > 0) {
      const eventsToInsert = topic.events.map(event => 
        transformEventToDatabase(event, topic.id)
      );

      const { error: eventsError } = await supabase
        .from('events')
        .insert(eventsToInsert);

      if (eventsError) {
        // If events creation fails, we should ideally rollback the topic creation
        // For now, we'll just log the error and return it
        throw new Error(`Failed to create events: ${eventsError.message}`);
      }
    }

    // Return the created topic
    const createdTopic = transformDatabaseTopic(topicData, topic.events);
    return { data: createdTopic, error: null };
  } catch (error) {
    console.error('Error creating topic:', error);
    return { data: null, error: error as Error };
  }
}

// Update an existing topic and its events
export async function updateTopic(topic: Topic): Promise<{ data: Topic | null; error: Error | null }> {
  try {
    // Update the topic
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .update(transformTopicToDatabase(topic))
      .eq('id', topic.id)
      .select()
      .single();

    if (topicError) {
      throw new Error(`Failed to update topic: ${topicError.message}`);
    }

    // Delete existing events for this topic
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('topic_id', topic.id);

    if (deleteError) {
      throw new Error(`Failed to delete existing events: ${deleteError.message}`);
    }

    // Insert updated events
    if (topic.events.length > 0) {
      const eventsToInsert = topic.events.map(event => 
        transformEventToDatabase(event, topic.id)
      );

      const { error: eventsError } = await supabase
        .from('events')
        .insert(eventsToInsert);

      if (eventsError) {
        throw new Error(`Failed to update events: ${eventsError.message}`);
      }
    }

    // Return the updated topic
    const updatedTopic = transformDatabaseTopic(topicData, topic.events);
    return { data: updatedTopic, error: null };
  } catch (error) {
    console.error('Error updating topic:', error);
    return { data: null, error: error as Error };
  }
}

// Delete a topic and all its events
export async function deleteTopic(topicId: string): Promise<{ error: Error | null }> {
  try {
    // Delete the topic (events will be deleted automatically due to CASCADE)
    const { error } = await supabase
      .from('topics')
      .delete()
      .eq('id', topicId);

    if (error) {
      throw new Error(`Failed to delete topic: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting topic:', error);
    return { error: error as Error };
  }
}

// Fetch a single topic by ID
export async function fetchTopicById(topicId: string): Promise<{ data: Topic | null; error: Error | null }> {
  try {
    // Fetch the topic
    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single();

    if (topicError) {
      throw new Error(`Failed to fetch topic: ${topicError.message}`);
    }

    // Fetch events for this topic
    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('topic_id', topicId)
      .order('year');

    if (eventsError) {
      throw new Error(`Failed to fetch events: ${eventsError.message}`);
    }

    // Transform events
    const events = eventsData ? eventsData.map(transformDatabaseEvent) : [];

    // Transform and return the topic
    const topic = transformDatabaseTopic(topicData, events);
    return { data: topic, error: null };
  } catch (error) {
    console.error('Error fetching topic by ID:', error);
    return { data: null, error: error as Error };
  }
}