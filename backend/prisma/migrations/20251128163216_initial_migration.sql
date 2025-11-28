-- ===========================================
-- USERS (profiles)
-- ===========================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  display_name text,
  avatar_url text,
  alias_mode boolean default false,

  -- Quokka Kingdom gamification
  quokka_citizenship_level int default 1,        -- XP-like level
  quokka_stamps text[] default '{}',              -- earned stamps ("Harmony Restored", etc.)
  quokka_badges text[] default '{}',              -- badges for mediation progress

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===========================================
-- CASES (Quokka Court Cases)
-- ===========================================

create table cases (
  id uuid primary key default gen_random_uuid(),

  title text not null,
  
  -- Relationship context
  relationship_type text check (
    relationship_type in ('partner','friend','roommate','sibling','coworker','other')
  ),

  -- Who created it
  created_by uuid references profiles(id),

  -- Severity influences Judge tone + verdict logic
  severity_level int not null check (severity_level between 1 and 4),

  -- Process state
  status text not null check (
    status in (
      'draft',
      'lawyer_phase',
      'intake_ready',
      'waiting_defendant',
      'court_in_session',
      'judge_deliberating',
      'resolved'
    )
  ),

  -- Optional jury toggle
  jury_enabled boolean default false,

  join_code text unique,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===========================================
-- PARTICIPANTS (plaintiff / defendant)
-- ===========================================

create table case_participants (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  user_id uuid references profiles(id),
  role text not null check (role in ('plaintiff','defendant')),
  nickname text,

  joined_at timestamptz default now(),
  unique(case_id, role)
);

-- ===========================================
-- LAWYER SESSION INPUT (raw user input)
-- ===========================================

create table lawyer_intake (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  participant_id uuid references case_participants(id) on delete cascade,

  raw_text text not null,
  feelings text,
  wishes text,                             -- "I wish they understood…"

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===========================================
-- LAWYER OUTPUT (Case Packet, rewritten arguments)
-- ===========================================

create table lawyer_packets (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  participant_id uuid references case_participants(id) on delete cascade,

  packet_summary text not null,            -- What the Quokka Lawyer produces
  emotional_analysis text,
  predicted_other_perspective text,
  respectful_version text,
  key_points text[],

  version_num int default 1,

  created_at timestamptz default now()
);

create unique index lawyer_packet_version
on lawyer_packets (case_id, participant_id, version_num);

-- ===========================================
-- JURY RESPONSES (Optional Quokka Jury)
-- ===========================================

create table jury_responses (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  
  jury_member text not null,               -- "Quokka of Balance", etc.
  perspective text not null,               -- Neutral reinterpretation
  alternative_view text,                   -- "Another way to see this is…"

  created_at timestamptz default now()
);

-- ===========================================
-- COURT SUBMISSIONS (final arguments)
-- ===========================================

create table court_statements (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  participant_id uuid references case_participants(id) on delete cascade,

  statement_text text not null,
  evidence_urls text[] default '{}',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- ===========================================
-- JUDGE REPORTS (main output)
-- ===========================================

create table judge_reports (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,

  judge_tone text check (
    judge_tone in ('playful','soft','balanced','serious')
  ),

  situation_summary text,
  plaintiff_summary text,
  defendant_summary text,

  misunderstandings text[],
  agreements text[],
  emotional_explanations text[],

  guiltiness text,                           -- "Both innocent", "Shared responsibility"
  frivolous boolean default false,

  suggested_resolutions text[],
  cooperation_plan text[],
  closing_remark text,

  created_at timestamptz default now()
);

-- ===========================================
-- CASE FINAL SCROLL (beautiful verdict scroll)
-- ===========================================

create table verdict_scrolls (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,

  scroll_url text,                           -- stored as PDF/SVG in Supabase storage
  summary_excerpt text,
  harmony_score int,                         -- Optional: 1–100 harmony rating

  created_at timestamptz default now()
);

-- ===========================================
-- CALENDAR ENTRIES (Case History Archive)
-- ===========================================

create table case_calendar (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  user_id uuid references profiles(id),

  date_of_event date not null,
  title text,
  verdict_outcome text,

  quokka_stamp text,                         -- “Harmony Restored”, etc.

  created_at timestamptz default now()
);

-- ===========================================
-- CASE HISTORY (Events log)
-- ===========================================

create table case_history (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,

  event_type text not null,
  payload jsonb,

  created_at timestamptz default now()
);

-- ===========================================
-- NOTIFICATIONS
-- ===========================================

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id),
  case_id uuid references cases(id),

  type text,
  message text,
  is_read boolean default false,

  created_at timestamptz default now()
);

-- ===========================================
-- USER SETTINGS
-- ===========================================

create table settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,

  default_judge_tone text,
  default_relationship_type text,
  default_severity int,

  created_at timestamptz default now()
);
