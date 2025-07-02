import { supabase } from '../lib/supabase';
import { Topic, TimelineEvent, Organization, OrganizationMembership, UserProfile } from '../types';

export interface DatabaseTopic {
  id: string;
  name: string;
  default_display_mode: 'years' | 'days';
  organization_id?: string;
  created_by?: string;
  is_public: boolean;
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
  created_by?: string;
  last_modified_by?: string;
  created_at: string;
  updated_at: string;
}

// Transform database topic to application topic
function transformDatabaseTopic(dbTopic: DatabaseTopic, events: TimelineEvent[]): Topic {
  return {
    id: dbTopic.id,
    name: dbTopic.name,
    defaultDisplayMode: dbTopic.default_display_mode,
    organizationId: dbTopic.organization_id,
    createdBy: dbTopic.created_by,
    isPublic: dbTopic.is_public,
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
    default_display_mode: topic.defaultDisplayMode || 'years',
    organization_id: topic.organizationId,
    created_by: topic.createdBy,
    is_public: topic.isPublic || false
  };
}

// Transform application event to database format
function transformEventToDatabase(event: TimelineEvent, topicId: string, userId?: string): Omit<DatabaseEvent, 'created_at' | 'updated_at'> {
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
    related_topic_id: event.relatedTopicId,
    created_by: userId,
    last_modified_by: userId
  };
}

// Fetch all topics with their events (respects RLS) - optionally filter by organization
export async function fetchTopics(organizationId?: string): Promise<{ data: Topic[] | null; error: Error | null }> {
  try {
    // Build query for topics
    let topicsQuery = supabase
      .from('topics')
      .select('*')
      .order('name');

    // Filter by organization if specified
    if (organizationId) {
      topicsQuery = topicsQuery.eq('organization_id', organizationId);
    }

    const { data: topicsData, error: topicsError } = await topicsQuery;

    if (topicsError) {
      throw new Error(`Failed to fetch topics: ${topicsError.message}`);
    }

    if (!topicsData) {
      return { data: [], error: null };
    }

    // Fetch all events for the accessible topics
    const topicIds = topicsData.map(t => t.id);
    
    if (topicIds.length === 0) {
      return { data: [], error: null };
    }

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

// Create a new topic with its events
export async function createTopic(topic: Topic): Promise<{ data: Topic | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

    // Create the topic
    const topicToInsert = transformTopicToDatabase({
      ...topic,
      createdBy: userId
    });

    const { data: topicData, error: topicError } = await supabase
      .from('topics')
      .insert([topicToInsert])
      .select()
      .single();

    if (topicError) {
      throw new Error(`Failed to create topic: ${topicError.message}`);
    }

    // Create events for the topic
    if (topic.events.length > 0) {
      const eventsToInsert = topic.events.map(event => 
        transformEventToDatabase(event, topic.id, userId)
      );

      const { error: eventsError } = await supabase
        .from('events')
        .insert(eventsToInsert);

      if (eventsError) {
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
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;

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
        transformEventToDatabase(event, topic.id, userId)
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

// Organization management functions
export async function fetchOrganizations(): Promise<{ data: Organization[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(`Failed to fetch organizations: ${error.message}`);
    }

    const organizations: Organization[] = data?.map(org => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      description: org.description,
      createdBy: org.created_by,
      createdAt: org.created_at,
      updatedAt: org.updated_at,
      status: org.status,
    })) || [];

    return { data: organizations, error: null };
  } catch (error) {
    console.error('Error fetching organizations:', error);
    return { data: null, error: error as Error };
  }
}

export async function createOrganization(org: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ data: Organization | null; error: Error | null }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('organizations')
      .insert([{
        name: org.name,
        slug: org.slug,
        description: org.description,
        created_by: user?.id
      }])
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create organization: ${error.message}`);
    }

    const organization: Organization = {
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      createdBy: data.created_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      status: data.status,
    };

    return { data: organization, error: null };
  } catch (error) {
    console.error('Error creating organization:', error);
    return { data: null, error: error as Error };
  }
}

// User management functions
export async function fetchUsers(): Promise<{ data: UserProfile[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('email');

    if (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    const users: UserProfile[] = data?.map(user => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      avatarUrl: user.avatar_url,
      role: user.role,
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    })) || [];

    return { data: users, error: null };
  } catch (error) {
    console.error('Error fetching users:', error);
    return { data: null, error: error as Error };
  }
}

export async function updateUserRole(userId: string, role: 'super_admin' | 'standard_user'): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user role: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { error: error as Error };
  }
}

// Organization membership functions
export async function fetchOrganizationMemberships(orgId: string): Promise<{ data: OrganizationMembership[] | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('organization_memberships')
      .select(`
        *,
        user:user_profiles(*)
      `)
      .eq('organization_id', orgId);

    if (error) {
      throw new Error(`Failed to fetch memberships: ${error.message}`);
    }

    const memberships: OrganizationMembership[] = data?.map(m => ({
      id: m.id,
      userId: m.user_id,
      organizationId: m.organization_id,
      role: m.role,
      permissions: m.permissions,
      createdAt: m.created_at,
      updatedAt: m.updated_at,
      user: m.user ? {
        id: m.user.id,
        email: m.user.email,
        fullName: m.user.full_name,
        avatarUrl: m.user.avatar_url,
        role: m.user.role,
        createdAt: m.user.created_at,
        updatedAt: m.user.updated_at,
      } : undefined,
    })) || [];

    return { data: memberships, error: null };
  } catch (error) {
    console.error('Error fetching organization memberships:', error);
    return { data: null, error: error as Error };
  }
}

export async function addOrganizationMember(
  orgId: string, 
  userId: string, 
  role: 'org_admin' | 'org_editor' | 'org_viewer'
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('organization_memberships')
      .insert([{
        organization_id: orgId,
        user_id: userId,
        role: role
      }]);

    if (error) {
      throw new Error(`Failed to add organization member: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error('Error adding organization member:', error);
    return { error: error as Error };
  }
}

export async function updateOrganizationMemberRole(
  membershipId: string, 
  role: 'org_admin' | 'org_editor' | 'org_viewer'
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('organization_memberships')
      .update({ role })
      .eq('id', membershipId);

    if (error) {
      throw new Error(`Failed to update member role: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error('Error updating organization member role:', error);
    return { error: error as Error };
  }
}

export async function removeOrganizationMember(membershipId: string): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase
      .from('organization_memberships')
      .delete()
      .eq('id', membershipId);

    if (error) {
      throw new Error(`Failed to remove organization member: ${error.message}`);
    }

    return { error: null };
  } catch (error) {
    console.error('Error removing organization member:', error);
    return { error: error as Error };
  }
}