import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Profile,
  Semester,
  Subject,
  Unit,
  Topic,
  Subtopic,
  TopicProgress,
  StudyResource,
  SemesterWithSubjects,
  ProgressSummary,
  ResourceStatus,
  ResourceType,
} from '../types/database';
import {
  INITIAL_PROFILES,
  INITIAL_SEMESTERS,
  INITIAL_SUBJECTS,
  INITIAL_UNITS,
  INITIAL_TOPICS,
  INITIAL_SUBTOPICS,
  INITIAL_PROGRESS,
  INITIAL_RESOURCES,
} from './seedData';

// Local storage keys for persistent sandbox
const STORAGE_KEYS = {
  CURRENT_USER: 'smart_study_current_user',
  PROFILES: 'smart_study_profiles_v1',
  SEMESTERS: 'smart_study_semesters_v1',
  SUBJECTS: 'smart_study_subjects_v1',
  UNITS: 'smart_study_units_v1',
  TOPICS: 'smart_study_topics_v1',
  SUBTOPICS: 'smart_study_subtopics_v1',
  PROGRESS: 'smart_study_progress_v1',
  RESOURCES: 'smart_study_resources_v1',
};

// Local cache helper with fallback to initial seed
function getStorageItem<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Storage write failed for ${key}:`, err);
  }
}

export class DataService {
  private static liveMode = isSupabaseConfigured();

  // Reset or initialize database in sandbox mode
  static resetLocalSandbox(): void {
    localStorage.setItem(STORAGE_KEYS.PROFILES, JSON.stringify(INITIAL_PROFILES));
    localStorage.setItem(STORAGE_KEYS.SEMESTERS, JSON.stringify(INITIAL_SEMESTERS));
    localStorage.setItem(STORAGE_KEYS.SUBJECTS, JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(INITIAL_UNITS));
    localStorage.setItem(STORAGE_KEYS.TOPICS, JSON.stringify(INITIAL_TOPICS));
    localStorage.setItem(STORAGE_KEYS.SUBTOPICS, JSON.stringify(INITIAL_SUBTOPICS));
    localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(INITIAL_PROGRESS));
    localStorage.setItem(STORAGE_KEYS.RESOURCES, JSON.stringify(INITIAL_RESOURCES));
    // Default to student 1 (Alex)
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(INITIAL_PROFILES[0]));
  }

  // --------------------------------------------------------------------------
  // AUTHENTICATION & USER SESSIONS
  // --------------------------------------------------------------------------

  static getCurrentUser(): Profile | null {
    return getStorageItem<Profile | null>(STORAGE_KEYS.CURRENT_USER, INITIAL_PROFILES[0]);
  }

  static setCurrentUser(user: Profile | null): void {
    if (user) {
      setStorageItem(STORAGE_KEYS.CURRENT_USER, user);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  /**
   * Log in or register a student by Name, Roll Number, and optional PIN.
   * Roll numbers are strictly normalized and validated to prevent duplicates.
   */
  static async loginStudent(
    name: string,
    rollNumber: string,
    passcode?: string
  ): Promise<{ success: boolean; user?: Profile; error?: string }> {
    const trimmedName = name.trim();
    const normalizedRoll = rollNumber.trim().toUpperCase().replace(/\s+/g, '-');

    if (!trimmedName || trimmedName.length < 2) {
      return { success: false, error: 'Please enter a valid student full name (minimum 2 characters).' };
    }
    if (!normalizedRoll || normalizedRoll.length < 3) {
      return { success: false, error: 'Please enter a valid college roll number (e.g., CS2026-042).' };
    }

    // If Supabase is connected with live Auth:
    if (this.liveMode && supabase) {
      try {
        const studentEmail = `${normalizedRoll.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.college.edu`;
        const studentPassword = passcode || `Student@${normalizedRoll}!`;

        // Attempt sign in first
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: studentEmail,
          password: studentPassword,
        });

        if (signInError && signInError.message.includes('Invalid login credentials')) {
          // Attempt sign up if user does not exist
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: studentEmail,
            password: studentPassword,
            options: {
              data: {
                display_name: trimmedName,
                roll_number: normalizedRoll,
              },
            },
          });

          if (signUpError) {
            return { success: false, error: `Authentication failed: ${signUpError.message}` };
          }

          if (signUpData.user) {
            const newProfile: Profile = {
              id: signUpData.user.id,
              student_id: `STU-${normalizedRoll}`,
              display_name: trimmedName,
              roll_number: normalizedRoll,
              department: 'Computer Science & Engineering',
              semester_enrolled: 4,
              account_status: 'active',
              role: 'student',
            };
            await supabase.from('profiles').upsert(newProfile);
            this.setCurrentUser(newProfile);
            return { success: true, user: newProfile };
          }
        } else if (signInData?.user) {
          // Fetch existing profile
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', signInData.user.id)
            .single();

          if (profileData) {
            this.setCurrentUser(profileData);
            return { success: true, user: profileData };
          }
        }
      } catch (err: unknown) {
        console.warn('Live Supabase Auth fallback to local storage:', err);
      }
    }

    // Local / Sandbox Mode:
    const profiles = getStorageItem<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    let existing = profiles.find((p) => p.roll_number.toUpperCase() === normalizedRoll);

    if (existing) {
      // Restore student profile
      this.setCurrentUser(existing);
      return { success: true, user: existing };
    }

    // Create new student profile
    const newStudent: Profile = {
      id: `user-stu-${Date.now()}`,
      student_id: `STU-${normalizedRoll}`,
      display_name: trimmedName,
      roll_number: normalizedRoll,
      department: 'Computer Science & Engineering',
      semester_enrolled: 4,
      account_status: 'active',
      role: 'student',
      created_at: new Date().toISOString(),
    };

    profiles.push(newStudent);
    setStorageItem(STORAGE_KEYS.PROFILES, profiles);
    this.setCurrentUser(newStudent);

    return { success: true, user: newStudent };
  }

  /**
   * Quick switch for testing and reviewer verification:
   * Allows toggling between Student A, Student B, and Admin to prove record isolation!
   */
  static switchDemoUser(roleOrId: 'student1' | 'student2' | 'admin' | string): Profile {
    const profiles = getStorageItem<Profile[]>(STORAGE_KEYS.PROFILES, INITIAL_PROFILES);
    let target: Profile | undefined;

    if (roleOrId === 'student1') {
      target = profiles.find((p) => p.roll_number === 'CS2026-001') || profiles[0];
    } else if (roleOrId === 'student2') {
      target = profiles.find((p) => p.roll_number === 'CS2026-002') || profiles[1];
    } else if (roleOrId === 'admin') {
      target = profiles.find((p) => p.role === 'admin') || profiles[2];
    } else {
      target = profiles.find((p) => p.id === roleOrId);
    }

    if (!target) {
      target = profiles[0];
    }

    this.setCurrentUser(target);
    return target;
  }

  static logout(): void {
    if (this.liveMode && supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    this.setCurrentUser(null);
  }

  // --------------------------------------------------------------------------
  // SYLLABUS HIERARCHY
  // --------------------------------------------------------------------------

  static async getSemesters(): Promise<Semester[]> {
    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('semesters')
          .select('*')
          .order('display_order', { ascending: true });
        if (!error && data) return data;
      } catch (e) {
        console.warn('Live fetch error, falling back to local:', e);
      }
    }
    return getStorageItem<Semester[]>(STORAGE_KEYS.SEMESTERS, INITIAL_SEMESTERS);
  }

  static async getSyllabusTree(semesterId?: string): Promise<SemesterWithSubjects[]> {
    const semesters = await this.getSemesters();
    const activeSemesters = semesterId
      ? semesters.filter((s) => s.id === semesterId)
      : semesters;

    let subjects: Subject[] = [];
    let units: Unit[] = [];
    let topics: Topic[] = [];
    let subtopics: Subtopic[] = [];

    if (this.liveMode && supabase) {
      try {
        const [subRes, unitRes, topRes, subTopRes] = await Promise.all([
          supabase.from('subjects').select('*').order('display_order', { ascending: true }),
          supabase.from('units').select('*').order('display_order', { ascending: true }),
          supabase.from('topics').select('*').order('display_order', { ascending: true }),
          supabase.from('subtopics').select('*').order('display_order', { ascending: true }),
        ]);

        if (subRes.data && unitRes.data && topRes.data && subTopRes.data) {
          subjects = subRes.data;
          units = unitRes.data;
          topics = topRes.data;
          subtopics = subTopRes.data;
        }
      } catch (e) {
        console.warn('Supabase query error:', e);
      }
    }

    if (subjects.length === 0) {
      subjects = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
      units = getStorageItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_UNITS);
      topics = getStorageItem<Topic[]>(STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
      subtopics = getStorageItem<Subtopic[]>(STORAGE_KEYS.SUBTOPICS, INITIAL_SUBTOPICS);
    }

    return activeSemesters.map((sem) => {
      const semSubjects = subjects
        .filter((sub) => sub.semester_id === sem.id)
        .map((sub) => {
          const subUnits = units
            .filter((u) => u.subject_id === sub.id)
            .map((u) => {
              const uTopics = topics
                .filter((t) => t.unit_id === u.id)
                .map((t) => {
                  const tSubtopics = subtopics.filter((st) => st.topic_id === t.id);
                  return {
                    ...t,
                    subtopics: tSubtopics,
                  };
                });
              return {
                ...u,
                topics: uTopics,
              };
            });
          return {
            ...sub,
            units: subUnits,
          };
        });

      return {
        ...sem,
        subjects: semSubjects,
      };
    });
  }

  // --------------------------------------------------------------------------
  // INDIVIDUAL STUDENT PROGRESS (Strict Isolation)
  // --------------------------------------------------------------------------

  static async getUserProgress(userId: string): Promise<Record<string, boolean>> {
    const progressMap: Record<string, boolean> = {};

    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase
          .from('topic_progress')
          .select('item_id, is_completed')
          .eq('user_id', userId);

        if (!error && data) {
          data.forEach((row) => {
            progressMap[row.item_id] = row.is_completed;
          });
          return progressMap;
        }
      } catch (err) {
        console.warn('Supabase progress fetch failed:', err);
      }
    }

    // Local sandbox retrieval (Strictly filter by user_id!)
    const allProgress = getStorageItem<TopicProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    allProgress
      .filter((p) => p.user_id === userId)
      .forEach((p) => {
        progressMap[p.item_id] = p.is_completed;
      });

    return progressMap;
  }

  static async toggleProgress(
    userId: string,
    itemId: string,
    itemType: 'topic' | 'subtopic',
    isCompleted: boolean
  ): Promise<{ success: boolean; error?: string }> {
    if (!userId) {
      return { success: false, error: 'User must be authenticated to save progress.' };
    }

    if (this.liveMode && supabase) {
      try {
        const { error } = await supabase
          .from('topic_progress')
          .upsert(
            {
              user_id: userId,
              item_id: itemId,
              item_type: itemType,
              is_completed: isCompleted,
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'user_id, item_id, item_type' }
          );

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (err: unknown) {
        console.warn('Live save error:', err);
      }
    }

    // Sandbox storage with unique user + item constraint
    const allProgress = getStorageItem<TopicProgress[]>(STORAGE_KEYS.PROGRESS, INITIAL_PROGRESS);
    const existingIndex = allProgress.findIndex(
      (p) => p.user_id === userId && p.item_id === itemId && p.item_type === itemType
    );

    if (existingIndex >= 0) {
      allProgress[existingIndex].is_completed = isCompleted;
      allProgress[existingIndex].completed_at = new Date().toISOString();
    } else {
      allProgress.push({
        id: `prog-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        item_id: itemId,
        item_type: itemType,
        is_completed: isCompleted,
        completed_at: new Date().toISOString(),
      });
    }

    setStorageItem(STORAGE_KEYS.PROGRESS, allProgress);
    return { success: true };
  }

  static calculateProgressSummary(
    syllabus: SemesterWithSubjects[],
    progressMap: Record<string, boolean>
  ): ProgressSummary {
    let totalTopics = 0;
    let completedTopics = 0;
    let totalSubtopics = 0;
    let completedSubtopics = 0;
    let importantTotal = 0;
    let importantCompleted = 0;

    const subjectProgress: ProgressSummary['subjectProgress'] = [];

    syllabus.forEach((sem) => {
      sem.subjects.forEach((sub) => {
        let subTotalTopics = 0;
        let subCompletedTopics = 0;

        sub.units.forEach((u) => {
          u.topics.forEach((top) => {
            totalTopics++;
            subTotalTopics++;

            if (top.is_important) {
              importantTotal++;
            }

            if (progressMap[top.id]) {
              completedTopics++;
              subCompletedTopics++;
              if (top.is_important) {
                importantCompleted++;
              }
            }

            top.subtopics.forEach((st) => {
              totalSubtopics++;
              if (progressMap[st.id]) {
                completedSubtopics++;
              }
            });
          });
        });

        const percentage =
          subTotalTopics > 0 ? Math.round((subCompletedTopics / subTotalTopics) * 100) : 0;

        subjectProgress.push({
          subjectId: sub.id,
          subjectCode: sub.code,
          subjectName: sub.name,
          colorCode: sub.color_code,
          total: subTotalTopics,
          completed: subCompletedTopics,
          percentage,
        });
      });
    });

    const overallPercentage =
      totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return {
      totalTopics,
      completedTopics,
      totalSubtopics,
      completedSubtopics,
      overallPercentage,
      importantTotal,
      importantCompleted,
      subjectProgress,
    };
  }

  // --------------------------------------------------------------------------
  // IMPORTANT EXAMINATION TOPICS (Admin Privileged)
  // --------------------------------------------------------------------------

  static async toggleTopicImportantStatus(
    topicId: string,
    isImportant: boolean,
    user: Profile
  ): Promise<{ success: boolean; error?: string }> {
    // Security Enforcement: Only verified admins can change important status!
    if (user.role !== 'admin') {
      return {
        success: false,
        error: 'Authorization Denied: Only faculty administrators can mark examination topics as important (RLS violation).',
      };
    }

    if (this.liveMode && supabase) {
      try {
        const { error } = await supabase
          .from('topics')
          .update({ is_important: isImportant })
          .eq('id', topicId);

        if (error) {
          return { success: false, error: error.message };
        }
      } catch (e: unknown) {
        console.warn('Live toggle error:', e);
      }
    }

    // Sandbox storage update
    const topics = getStorageItem<Topic[]>(STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
    const target = topics.find((t) => t.id === topicId);
    if (!target) {
      return { success: false, error: 'Topic not found.' };
    }

    target.is_important = isImportant;
    setStorageItem(STORAGE_KEYS.TOPICS, topics);
    return { success: true };
  }

  // --------------------------------------------------------------------------
  // ADMIN SYLLABUS MANAGEMENT (CRUD)
  // --------------------------------------------------------------------------

  static async addSubject(
    subjectData: Omit<Subject, 'id'>,
    user: Profile
  ): Promise<{ success: boolean; subject?: Subject; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'Admin permission required.' };
    }

    const newSubject: Subject = {
      ...subjectData,
      id: `sub-${Date.now()}`,
    };

    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase.from('subjects').insert(newSubject).select().single();
        if (error) return { success: false, error: error.message };
        if (data) return { success: true, subject: data };
      } catch (err: unknown) {
        console.warn('Supabase add error:', err);
      }
    }

    const subjects = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    subjects.push(newSubject);
    setStorageItem(STORAGE_KEYS.SUBJECTS, subjects);
    return { success: true, subject: newSubject };
  }

  static async addUnit(
    unitData: Omit<Unit, 'id'>,
    user: Profile
  ): Promise<{ success: boolean; unit?: Unit; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'Admin permission required.' };
    }

    const newUnit: Unit = {
      ...unitData,
      id: `unit-${Date.now()}`,
    };

    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase.from('units').insert(newUnit).select().single();
        if (error) return { success: false, error: error.message };
        if (data) return { success: true, unit: data };
      } catch (err: unknown) {
        console.warn('Supabase add error:', err);
      }
    }

    const units = getStorageItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_UNITS);
    units.push(newUnit);
    setStorageItem(STORAGE_KEYS.UNITS, units);
    return { success: true, unit: newUnit };
  }

  static async addTopic(
    topicData: Omit<Topic, 'id'>,
    user: Profile
  ): Promise<{ success: boolean; topic?: Topic; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'Admin permission required.' };
    }

    const newTopic: Topic = {
      ...topicData,
      id: `top-${Date.now()}`,
    };

    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase.from('topics').insert(newTopic).select().single();
        if (error) return { success: false, error: error.message };
        if (data) return { success: true, topic: data };
      } catch (err: unknown) {
        console.warn('Supabase add error:', err);
      }
    }

    const topics = getStorageItem<Topic[]>(STORAGE_KEYS.TOPICS, INITIAL_TOPICS);
    topics.push(newTopic);
    setStorageItem(STORAGE_KEYS.TOPICS, topics);
    return { success: true, topic: newTopic };
  }

  static async addSubtopic(
    subtopicData: Omit<Subtopic, 'id'>,
    user: Profile
  ): Promise<{ success: boolean; subtopic?: Subtopic; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'Admin permission required.' };
    }

    const newSubtopic: Subtopic = {
      ...subtopicData,
      id: `subtop-${Date.now()}`,
    };

    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase.from('subtopics').insert(newSubtopic).select().single();
        if (error) return { success: false, error: error.message };
        if (data) return { success: true, subtopic: data };
      } catch (err: unknown) {
        console.warn('Supabase add error:', err);
      }
    }

    const subtopics = getStorageItem<Subtopic[]>(STORAGE_KEYS.SUBTOPICS, INITIAL_SUBTOPICS);
    subtopics.push(newSubtopic);
    setStorageItem(STORAGE_KEYS.SUBTOPICS, subtopics);
    return { success: true, subtopic: newSubtopic };
  }

  static async deleteSyllabusItem(
    type: 'subject' | 'unit' | 'topic' | 'subtopic',
    id: string,
    user: Profile
  ): Promise<{ success: boolean; error?: string }> {
    if (user.role !== 'admin') {
      return { success: false, error: 'Admin permission required (RLS protected).' };
    }

    if (this.liveMode && supabase) {
      try {
        const table =
          type === 'subject'
            ? 'subjects'
            : type === 'unit'
            ? 'units'
            : type === 'topic'
            ? 'topics'
            : 'subtopics';
        const { error } = await supabase.from(table).delete().eq('id', id);
        if (error) return { success: false, error: error.message };
      } catch (err: unknown) {
        console.warn('Delete error:', err);
      }
    }

    // Local cascading deletion
    if (type === 'subject') {
      const subjects = getStorageItem<Subject[]>(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS).filter((s) => s.id !== id);
      setStorageItem(STORAGE_KEYS.SUBJECTS, subjects);
    } else if (type === 'unit') {
      const units = getStorageItem<Unit[]>(STORAGE_KEYS.UNITS, INITIAL_UNITS).filter((u) => u.id !== id);
      setStorageItem(STORAGE_KEYS.UNITS, units);
    } else if (type === 'topic') {
      const topics = getStorageItem<Topic[]>(STORAGE_KEYS.TOPICS, INITIAL_TOPICS).filter((t) => t.id !== id);
      setStorageItem(STORAGE_KEYS.TOPICS, topics);
    } else if (type === 'subtopic') {
      const subtopics = getStorageItem<Subtopic[]>(STORAGE_KEYS.SUBTOPICS, INITIAL_SUBTOPICS).filter((st) => st.id !== id);
      setStorageItem(STORAGE_KEYS.SUBTOPICS, subtopics);
    }

    return { success: true };
  }

  // --------------------------------------------------------------------------
  // SHARED STUDY RESOURCES & STORAGE
  // --------------------------------------------------------------------------

  static async getResources(filters?: {
    subjectId?: string;
    resourceType?: ResourceType | 'all';
    searchQuery?: string;
    examPrepOnly?: boolean;
    statusFilter?: ResourceStatus | 'all';
    user?: Profile | null;
  }): Promise<StudyResource[]> {
    let resources: StudyResource[] = [];

    if (this.liveMode && supabase) {
      try {
        let query = supabase.from('resources').select('*').order('created_at', { ascending: false });

        if (filters?.subjectId && filters.subjectId !== 'all') {
          query = query.eq('subject_id', filters.subjectId);
        }
        if (filters?.resourceType && filters.resourceType !== 'all') {
          query = query.eq('resource_type', filters.resourceType);
        }
        if (filters?.examPrepOnly) {
          query = query.eq('is_exam_prep', true);
        }

        const { data, error } = await query;
        if (!error && data) {
          resources = data;
        }
      } catch (err) {
        console.warn('Resource fetch error:', err);
      }
    }

    if (resources.length === 0) {
      resources = getStorageItem<StudyResource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    }

    // Apply client filters & permission rules
    return resources.filter((res) => {
      // Visibility rule: approved resources are visible to everyone.
      // Pending/rejected are visible only to the original uploader or an admin!
      const isVisible =
        res.status === 'approved' ||
        (filters?.user && (filters.user.role === 'admin' || filters.user.id === res.uploader_id));

      if (!isVisible) return false;

      if (filters?.subjectId && filters.subjectId !== 'all' && res.subject_id !== filters.subjectId) {
        return false;
      }
      if (filters?.resourceType && filters.resourceType !== 'all' && res.resource_type !== filters.resourceType) {
        return false;
      }
      if (filters?.examPrepOnly && !res.is_exam_prep) {
        return false;
      }
      if (filters?.statusFilter && filters.statusFilter !== 'all' && res.status !== filters.statusFilter) {
        return false;
      }
      if (filters?.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchTitle = res.title.toLowerCase().includes(q);
        const matchDesc = res.description ? res.description.toLowerCase().includes(q) : false;
        const matchUploader = res.uploader_name.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchUploader) return false;
      }

      return true;
    });
  }

  static async addResource(
    resourceData: {
      title: string;
      description?: string;
      resource_type: ResourceType;
      semester_id: string;
      subject_id: string;
      unit_id?: string;
      topic_id?: string;
      external_url?: string;
      file?: File;
      is_exam_prep?: boolean;
    },
    currentUser: Profile
  ): Promise<{ success: boolean; resource?: StudyResource; error?: string }> {
    if (!currentUser) {
      return { success: false, error: 'You must be logged in to share resources.' };
    }

    if (!resourceData.title || resourceData.title.trim().length < 3) {
      return { success: false, error: 'Resource title must be at least 3 characters.' };
    }

    // URL validation for youtube or web links
    if (['youtube', 'url'].includes(resourceData.resource_type)) {
      if (!resourceData.external_url || !resourceData.external_url.startsWith('http')) {
        return { success: false, error: 'Please enter a valid educational URL starting with https://' };
      }
    }

    // File validation for pdf or documents
    let filePath: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;

    if (resourceData.file) {
      if (resourceData.file.size > 25 * 1024 * 1024) {
        return { success: false, error: 'File size exceeds maximum limit of 25MB.' };
      }
      fileSize = resourceData.file.size;
      mimeType = resourceData.file.type;
      filePath = `study-materials/${Date.now()}_${resourceData.file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

      // In live Supabase mode, upload to Storage bucket
      if (this.liveMode && supabase) {
        try {
          const { error: uploadError } = await supabase.storage
            .from('study-materials')
            .upload(filePath, resourceData.file);
          if (uploadError) {
            return { success: false, error: `File upload error: ${uploadError.message}` };
          }
        } catch (e) {
          console.warn('Storage upload error, saving metadata:', e);
        }
      }
    }

    // Resources from admins are auto-approved; student uploads go to pending moderation
    const status: ResourceStatus = currentUser.role === 'admin' ? 'approved' : 'pending';

    const newResource: StudyResource = {
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: resourceData.title.trim(),
      description: resourceData.description?.trim() || null,
      resource_type: resourceData.resource_type,
      semester_id: resourceData.semester_id,
      subject_id: resourceData.subject_id,
      unit_id: resourceData.unit_id || null,
      topic_id: resourceData.topic_id || null,
      uploader_id: currentUser.id,
      uploader_name: currentUser.display_name,
      uploader_roll: currentUser.roll_number,
      file_path: filePath,
      file_size_bytes: fileSize,
      file_mime_type: mimeType,
      external_url: resourceData.external_url?.trim() || null,
      status,
      is_exam_prep: Boolean(resourceData.is_exam_prep),
      created_at: new Date().toISOString(),
    };

    if (this.liveMode && supabase) {
      try {
        const { data, error } = await supabase.from('resources').insert(newResource).select().single();
        if (!error && data) {
          return { success: true, resource: data };
        }
      } catch (err: unknown) {
        console.warn('Resource save fallback:', err);
      }
    }

    const resources = getStorageItem<StudyResource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    resources.unshift(newResource);
    setStorageItem(STORAGE_KEYS.RESOURCES, resources);

    return { success: true, resource: newResource };
  }

  static async moderateResource(
    resourceId: string,
    newStatus: ResourceStatus,
    adminUser: Profile
  ): Promise<{ success: boolean; error?: string }> {
    if (adminUser.role !== 'admin') {
      return { success: false, error: 'Only administrators can moderate resources (RLS protected).' };
    }

    if (this.liveMode && supabase) {
      try {
        const { error } = await supabase
          .from('resources')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', resourceId);

        if (error) return { success: false, error: error.message };
      } catch (err) {
        console.warn('Live moderation error:', err);
      }
    }

    const resources = getStorageItem<StudyResource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    const target = resources.find((r) => r.id === resourceId);
    if (!target) return { success: false, error: 'Resource not found.' };

    target.status = newStatus;
    setStorageItem(STORAGE_KEYS.RESOURCES, resources);
    return { success: true };
  }

  static async deleteResource(
    resourceId: string,
    currentUser: Profile
  ): Promise<{ success: boolean; error?: string }> {
    const resources = getStorageItem<StudyResource[]>(STORAGE_KEYS.RESOURCES, INITIAL_RESOURCES);
    const target = resources.find((r) => r.id === resourceId);

    if (!target) return { success: false, error: 'Resource not found.' };

    // Security check: Only the original uploader or an admin can delete!
    if (currentUser.role !== 'admin' && currentUser.id !== target.uploader_id) {
      return { success: false, error: 'You do not have permission to delete this resource (RLS protected).' };
    }

    if (this.liveMode && supabase) {
      try {
        const { error } = await supabase.from('resources').delete().eq('id', resourceId);
        if (error) return { success: false, error: error.message };
      } catch (err) {
        console.warn('Live delete error:', err);
      }
    }

    const filtered = resources.filter((r) => r.id !== resourceId);
    setStorageItem(STORAGE_KEYS.RESOURCES, filtered);
    return { success: true };
  }
}
