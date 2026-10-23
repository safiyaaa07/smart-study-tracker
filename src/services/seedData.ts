import { Profile, Semester, Subject, Unit, Topic, Subtopic, StudyResource, TopicProgress } from '../types/database';

export const INITIAL_PROFILES: Profile[] = [
  {
    id: 'user-stu-001',
    student_id: 'STU-2026-001',
    display_name: 'Alex Sharma',
    roll_number: 'CS2026-001',
    department: 'Computer Science & Engineering',
    semester_enrolled: 4,
    account_status: 'active',
    role: 'student',
    created_at: '2026-01-10T09:00:00Z',
  },
  {
    id: 'user-stu-002',
    student_id: 'STU-2026-002',
    display_name: 'Bhavna Patel',
    roll_number: 'CS2026-002',
    department: 'Computer Science & Engineering',
    semester_enrolled: 4,
    account_status: 'active',
    role: 'student',
    created_at: '2026-01-11T10:15:00Z',
  },
  {
    id: 'user-adm-001',
    student_id: 'FAC-2026-901',
    display_name: 'Dr. Eleanor Vance',
    roll_number: 'FAC-001',
    department: 'Academic Council & CSE Faculty Lead',
    semester_enrolled: 4,
    account_status: 'active',
    role: 'admin',
    created_at: '2025-08-01T08:00:00Z',
  },
];

export const INITIAL_SEMESTERS: Semester[] = [
  {
    id: 'sem-4',
    semester_number: 4,
    title: 'Semester IV — Core Engineering & Systems',
    academic_year: '2025-2026',
    display_order: 1,
    is_active: true,
  },
  {
    id: 'sem-3',
    semester_number: 3,
    title: 'Semester III — Foundations & Data Structures',
    academic_year: '2025-2026',
    display_order: 2,
    is_active: false,
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  {
    id: 'sub-dbms',
    semester_id: 'sem-4',
    code: 'CS401',
    name: 'Database Management Systems',
    credits: 4,
    color_code: '#2563EB', // Blue
    display_order: 1,
  },
  {
    id: 'sub-algo',
    semester_id: 'sem-4',
    code: 'CS402',
    name: 'Design & Analysis of Algorithms',
    credits: 4,
    color_code: '#7C3AED', // Purple
    display_order: 2,
  },
  {
    id: 'sub-os',
    semester_id: 'sem-4',
    code: 'CS403',
    name: 'Operating Systems & Concurrency',
    credits: 4,
    color_code: '#0D9488', // Teal
    display_order: 3,
  },
  {
    id: 'sub-cn',
    semester_id: 'sem-4',
    code: 'CS404',
    name: 'Computer Networks & Protocols',
    credits: 3,
    color_code: '#EA580C', // Orange
    display_order: 4,
  },
];

export const INITIAL_UNITS: Unit[] = [
  // DBMS Units
  {
    id: 'unit-dbms-1',
    subject_id: 'sub-dbms',
    unit_number: 1,
    title: 'Unit I: Relational Architecture & ER Modeling',
    description: 'Data models, 3-tier architecture, ER modeling to relational schema',
    display_order: 1,
  },
  {
    id: 'unit-dbms-2',
    subject_id: 'sub-dbms',
    unit_number: 2,
    title: 'Unit II: SQL & Relational Normalization',
    description: 'Functional dependencies, 1NF, 2NF, 3NF, BCNF lossless decompositions',
    display_order: 2,
  },
  {
    id: 'unit-dbms-3',
    subject_id: 'sub-dbms',
    unit_number: 3,
    title: 'Unit III: Transaction Processing & Concurrency',
    description: 'ACID properties, serializability, lock protocols, and recovery',
    display_order: 3,
  },
  {
    id: 'unit-dbms-4',
    subject_id: 'sub-dbms',
    unit_number: 4,
    title: 'Unit IV: Indexing & Query Optimization',
    description: 'B+ Trees, hash indices, query cost estimation, and buffer management',
    display_order: 4,
  },

  // Algorithms Units
  {
    id: 'unit-algo-1',
    subject_id: 'sub-algo',
    unit_number: 1,
    title: 'Unit I: Asymptotic Analysis & Divide-and-Conquer',
    description: 'Recurrences, Master Theorem, and advanced sorting paradigms',
    display_order: 1,
  },
  {
    id: 'unit-algo-2',
    subject_id: 'sub-algo',
    unit_number: 2,
    title: 'Unit II: Dynamic Programming & Greedy Strategies',
    description: 'Optimal substructure, memoization, Knapsack, and LCS',
    display_order: 2,
  },
  {
    id: 'unit-algo-3',
    subject_id: 'sub-algo',
    unit_number: 3,
    title: 'Unit III: Graph Algorithms & Network Flow',
    description: 'Dijkstra, Bellman-Ford, Max-Flow Ford-Fulkerson, and cut theorems',
    display_order: 3,
  },

  // Operating Systems Units
  {
    id: 'unit-os-1',
    subject_id: 'sub-os',
    unit_number: 1,
    title: 'Unit I: Process Management & CPU Scheduling',
    description: 'Process control blocks, context switching, Round Robin, CFS',
    display_order: 1,
  },
  {
    id: 'unit-os-2',
    subject_id: 'sub-os',
    unit_number: 2,
    title: 'Unit II: Synchronization & Deadlocks',
    description: 'Critical section problem, Semaphores, Monitors, Banker Algorithm',
    display_order: 2,
  },

  // Computer Networks Units
  {
    id: 'unit-cn-1',
    subject_id: 'sub-cn',
    unit_number: 1,
    title: 'Unit I: OSI Layering & Physical/Link Layer',
    description: 'Packet vs circuit switching, Framing, CRC, Sliding window protocols',
    display_order: 1,
  },
];

export const INITIAL_TOPICS: Topic[] = [
  // DBMS Unit 1
  {
    id: 'top-dbms-101',
    unit_id: 'unit-dbms-1',
    title: 'Database System Architecture & Physical Independence',
    description: 'Logical vs physical schemas and catalog storage',
    is_important: false,
    estimated_hours: 1.5,
    display_order: 1,
  },
  {
    id: 'top-dbms-102',
    unit_id: 'unit-dbms-1',
    title: 'Entity-Relationship Diagrams & Schema Mapping',
    description: 'Entities, relationships, cardinality ratios, and relational mapping',
    is_important: true, // ⭐ Important for exams
    estimated_hours: 2.5,
    display_order: 2,
  },
  {
    id: 'top-dbms-103',
    unit_id: 'unit-dbms-1',
    title: 'Relational Algebra Operators & Query Optimization Trees',
    description: 'Select, project, cross-product, theta join, and set difference',
    is_important: true, // ⭐ Important for exams
    estimated_hours: 3.0,
    display_order: 3,
  },

  // DBMS Unit 2
  {
    id: 'top-dbms-201',
    unit_id: 'unit-dbms-2',
    title: 'Functional Dependencies & Closure Algorithms',
    description: 'Armstrong axioms, attribute closure X+, and minimal cover',
    is_important: false,
    estimated_hours: 2.0,
    display_order: 1,
  },
  {
    id: 'top-dbms-202',
    unit_id: 'unit-dbms-2',
    title: 'Relational Normal Forms (1NF, 2NF, 3NF & BCNF)',
    description: 'Lossless join decomposition and dependency preservation tests',
    is_important: true, // ⭐ High exam yield
    estimated_hours: 3.5,
    display_order: 2,
  },
  {
    id: 'top-dbms-203',
    unit_id: 'unit-dbms-2',
    title: 'SQL Triggers, Views & Complex Analytic Queries',
    description: 'Row-level triggers, materialized views, window functions',
    is_important: false,
    estimated_hours: 2.0,
    display_order: 3,
  },

  // DBMS Unit 3
  {
    id: 'top-dbms-301',
    unit_id: 'unit-dbms-3',
    title: 'ACID Transaction Guarantees & Recovery Logs',
    description: 'WAL protocol, checkpoints, and ARIES recovery algorithm',
    is_important: false,
    estimated_hours: 2.0,
    display_order: 1,
  },
  {
    id: 'top-dbms-302',
    unit_id: 'unit-dbms-3',
    title: 'Conflict Serializability & Precedence Graphs',
    description: 'Testing serializability of interleaved schedules',
    is_important: true, // ⭐ Important for exams
    estimated_hours: 3.0,
    display_order: 2,
  },
  {
    id: 'top-dbms-303',
    unit_id: 'unit-dbms-3',
    title: 'Two-Phase Locking (2PL) Protocol & Deadlock Resolution',
    description: 'Strict vs rigorous 2PL, wait-die and wound-wait schemes',
    is_important: true, // ⭐ Important for exams
    estimated_hours: 2.5,
    display_order: 3,
  },

  // Algorithms Unit 2
  {
    id: 'top-algo-201',
    unit_id: 'unit-algo-2',
    title: '0/1 Knapsack Problem & Optimal Substructure',
    description: 'Bottom-up memoization table and space-saving optimization',
    is_important: true, // ⭐ Exam favorite
    estimated_hours: 3.0,
    display_order: 1,
  },
  {
    id: 'top-algo-202',
    unit_id: 'unit-algo-2',
    title: 'Longest Common Subsequence (LCS) & Sequence Alignment',
    description: 'Backtracking matrix pointers to reconstruct optimal string',
    is_important: true, // ⭐ Exam favorite
    estimated_hours: 2.5,
    display_order: 2,
  },
  {
    id: 'top-algo-203',
    unit_id: 'unit-algo-2',
    title: 'Huffman Coding & Greedy Prefix Code Trees',
    description: 'Priority queue construction and entropy minimization',
    is_important: false,
    estimated_hours: 2.0,
    display_order: 3,
  },

  // Operating Systems Unit 2
  {
    id: 'top-os-201',
    unit_id: 'unit-os-2',
    title: "Banker's Algorithm for Deadlock Avoidance",
    description: 'Resource allocation state, safety check algorithm, and request matrix',
    is_important: true, // ⭐ Core exam topic
    estimated_hours: 3.0,
    display_order: 1,
  },
  {
    id: 'top-os-202',
    unit_id: 'unit-os-2',
    title: 'Classic Concurrency Problems (Dining Philosophers, Readers-Writers)',
    description: 'Semaphores and condition variables implementation',
    is_important: true, // ⭐ Core exam topic
    estimated_hours: 2.5,
    display_order: 2,
  },
];

export const INITIAL_SUBTOPICS: Subtopic[] = [
  // Subtopics for ER diagrams
  {
    id: 'subtop-102-1',
    topic_id: 'top-dbms-102',
    title: 'Weak Entity Sets & Identifying Relationships',
    display_order: 1,
  },
  {
    id: 'subtop-102-2',
    topic_id: 'top-dbms-102',
    title: 'Generalization, Specialization & Disjoint Constraints',
    display_order: 2,
  },
  {
    id: 'subtop-102-3',
    topic_id: 'top-dbms-102',
    title: 'Converting 1:N and M:N relationships to SQL DDL tables',
    display_order: 3,
  },

  // Subtopics for Normalization
  {
    id: 'subtop-202-1',
    topic_id: 'top-dbms-202',
    title: 'First Normal Form (1NF) & Atomic Values',
    display_order: 1,
  },
  {
    id: 'subtop-202-2',
    topic_id: 'top-dbms-202',
    title: 'Second Normal Form (2NF) & Partial Dependency Removal',
    display_order: 2,
  },
  {
    id: 'subtop-202-3',
    topic_id: 'top-dbms-202',
    title: 'Third Normal Form (3NF) & Transitive Dependency Elimination',
    display_order: 3,
  },
  {
    id: 'subtop-202-4',
    topic_id: 'top-dbms-202',
    title: 'Boyce-Codd Normal Form (BCNF) Superkey Rule',
    display_order: 4,
  },

  // Subtopics for Banker's Algorithm
  {
    id: 'subtop-os-201-1',
    topic_id: 'top-os-201',
    title: 'State Vectors: Allocation, Max, Available, Need Matrices',
    display_order: 1,
  },
  {
    id: 'subtop-os-201-2',
    topic_id: 'top-os-201',
    title: 'Safety Algorithm: Finding Safe Execution Sequences',
    display_order: 2,
  },
];

// Initial pre-recorded progress for Student 1 (Alex) vs Student 2 (Bhavna)
// Demonstrates realistic isolated student states
export const INITIAL_PROGRESS: TopicProgress[] = [
  // Alex Sharma has completed several DBMS topics & subtopics
  {
    id: 'prog-01',
    user_id: 'user-stu-001',
    item_id: 'top-dbms-101',
    item_type: 'topic',
    is_completed: true,
    completed_at: '2026-03-01T10:00:00Z',
  },
  {
    id: 'prog-02',
    user_id: 'user-stu-001',
    item_id: 'top-dbms-102',
    item_type: 'topic',
    is_completed: true,
    completed_at: '2026-03-02T14:30:00Z',
  },
  {
    id: 'prog-03',
    user_id: 'user-stu-001',
    item_id: 'subtop-102-1',
    item_type: 'subtopic',
    is_completed: true,
    completed_at: '2026-03-02T14:35:00Z',
  },
  {
    id: 'prog-04',
    user_id: 'user-stu-001',
    item_id: 'subtop-102-2',
    item_type: 'subtopic',
    is_completed: true,
    completed_at: '2026-03-02T14:40:00Z',
  },
  {
    id: 'prog-05',
    user_id: 'user-stu-001',
    item_id: 'top-dbms-202',
    item_type: 'topic',
    is_completed: true,
    completed_at: '2026-03-10T16:00:00Z',
  },
  {
    id: 'prog-06',
    user_id: 'user-stu-001',
    item_id: 'subtop-202-1',
    item_type: 'subtopic',
    is_completed: true,
    completed_at: '2026-03-10T16:05:00Z',
  },
  {
    id: 'prog-07',
    user_id: 'user-stu-001',
    item_id: 'top-algo-201',
    item_type: 'topic',
    is_completed: true,
    completed_at: '2026-03-15T11:20:00Z',
  },

  // Bhavna Patel has a distinct, independent set of completed topics
  {
    id: 'prog-08',
    user_id: 'user-stu-002',
    item_id: 'top-dbms-101',
    item_type: 'topic',
    is_completed: true,
    completed_at: '2026-03-04T09:15:00Z',
  },
  {
    id: 'prog-09',
    user_id: 'user-stu-002',
    item_id: 'top-os-201',
    item_type: 'topic',
    is_completed: true,
    completed_at: '2026-03-12T13:45:00Z',
  },
  {
    id: 'prog-10',
    user_id: 'user-stu-002',
    item_id: 'subtop-os-201-1',
    item_type: 'subtopic',
    is_completed: true,
    completed_at: '2026-03-12T13:50:00Z',
  },
];

export const INITIAL_RESOURCES: StudyResource[] = [
  {
    id: 'res-001',
    title: 'Relational Normalization & BCNF Cheat Sheet',
    description: 'Comprehensive 4-page summary with canonical step-by-step decomposition examples and dependency preservation proofs.',
    resource_type: 'pdf',
    semester_id: 'sem-4',
    subject_id: 'sub-dbms',
    unit_id: 'unit-dbms-2',
    topic_id: 'top-dbms-202',
    uploader_id: 'user-stu-001',
    uploader_name: 'Alex Sharma',
    uploader_roll: 'CS2026-001',
    file_path: 'study-materials/cs401_normalization_guide.pdf',
    file_size_bytes: 1845200,
    file_mime_type: 'application/pdf',
    external_url: 'https://ocw.mit.edu/courses/electrical-engineering-and-computer-science/6-830-database-systems-fall-2010/lecture-notes/',
    status: 'approved',
    is_exam_prep: true,
    created_at: '2026-03-12T14:20:00Z',
  },
  {
    id: 'res-002',
    title: 'Interactive B+ Tree Indexing & Search Simulation',
    description: 'Web visualizer to observe node splits, merges, and pointer adjustments during insertions in order-4 B+ trees.',
    resource_type: 'url',
    semester_id: 'sem-4',
    subject_id: 'sub-dbms',
    unit_id: 'unit-dbms-4',
    topic_id: null,
    uploader_id: 'user-adm-001',
    uploader_name: 'Dr. Eleanor Vance',
    uploader_roll: 'FAC-001',
    file_path: null,
    file_size_bytes: null,
    file_mime_type: null,
    external_url: 'https://www.cs.usfca.edu/~galles/visualization/BPlusTree.html',
    status: 'approved',
    is_exam_prep: true,
    created_at: '2026-03-14T08:00:00Z',
  },
  {
    id: 'res-003',
    title: 'Dynamic Programming LCS & 0/1 Knapsack Walkthrough',
    description: 'MIT 6.006 Lecture breakdown on optimal substructure equations and tabular memoization space reduction.',
    resource_type: 'youtube',
    semester_id: 'sem-4',
    subject_id: 'sub-algo',
    unit_id: 'unit-algo-2',
    topic_id: 'top-algo-201',
    uploader_id: 'user-stu-002',
    uploader_name: 'Bhavna Patel',
    uploader_roll: 'CS2026-002',
    file_path: null,
    file_size_bytes: null,
    file_mime_type: null,
    external_url: 'https://www.youtube.com/watch?v=OQ5jsbhAv_M',
    status: 'approved',
    is_exam_prep: true,
    created_at: '2026-03-18T16:45:00Z',
  },
  {
    id: 'res-004',
    title: "Banker's Algorithm Step-by-Step Solved University Exam Papers",
    description: 'Handwritten scanned notes solving 10 past university questions on deadlock state checks and safety vectors.',
    resource_type: 'document',
    semester_id: 'sem-4',
    subject_id: 'sub-os',
    unit_id: 'unit-os-2',
    topic_id: 'top-os-201',
    uploader_id: 'user-stu-001',
    uploader_name: 'Alex Sharma',
    uploader_roll: 'CS2026-001',
    file_path: 'study-materials/bankers_solved_questions.pdf',
    file_size_bytes: 3410500,
    file_mime_type: 'application/pdf',
    external_url: null,
    status: 'pending', // Pending moderation review by admin!
    is_exam_prep: true,
    created_at: '2026-03-21T18:10:00Z',
  },
];
