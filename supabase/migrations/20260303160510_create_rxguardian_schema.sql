/*
  # RxGuardian AI Database Schema

  ## Overview
  Complete database schema for RxGuardian AI - a prescription management and health tracking system

  ## New Tables

  ### 1. prescriptions
  Stores uploaded prescription images and analysis results
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `image_url` (text) - URL to uploaded prescription image
  - `status` (text) - processing status: 'pending', 'analyzed', 'error'
  - `detected_disease` (text) - AI-identified disease
  - `analysis_data` (jsonb) - full AI analysis results
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 2. medications
  Individual medicines extracted from prescriptions
  - `id` (uuid, primary key)
  - `prescription_id` (uuid, references prescriptions)
  - `user_id` (uuid, references auth.users)
  - `name` (text) - medicine name
  - `dosage` (text) - dosage amount
  - `frequency` (text) - how often to take
  - `timing` (text) - when to take (morning, afternoon, evening, night)
  - `duration_days` (integer) - treatment duration
  - `start_date` (date)
  - `end_date` (date)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 3. health_trackers
  Stores health tracking data (general and disease-specific)
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `tracker_type` (text) - 'general', 'diabetes', 'hypertension', 'heart', etc.
  - `date` (date) - tracking date
  - `metrics` (jsonb) - health metrics data
  - `notes` (text)
  - `created_at` (timestamptz)

  ### 4. medication_reminders
  Medication reminder schedules
  - `id` (uuid, primary key)
  - `medication_id` (uuid, references medications)
  - `user_id` (uuid, references auth.users)
  - `reminder_time` (time) - time of day for reminder
  - `days_of_week` (text[]) - which days to remind
  - `is_active` (boolean) - whether reminder is enabled
  - `last_taken_at` (timestamptz) - when medication was last marked as taken
  - `created_at` (timestamptz)

  ### 5. diet_plans
  Personalized diet recommendations
  - `id` (uuid, primary key)
  - `user_id` (uuid, references auth.users)
  - `disease_type` (text) - related disease condition
  - `meal_type` (text) - 'breakfast', 'lunch', 'dinner', 'snack'
  - `recommendations` (jsonb) - diet suggestions and restrictions
  - `is_active` (boolean)
  - `created_at` (timestamptz)

  ### 6. user_profiles
  Extended user information
  - `id` (uuid, primary key, references auth.users)
  - `full_name` (text)
  - `age` (integer)
  - `gender` (text)
  - `detected_conditions` (text[]) - array of detected diseases
  - `active_trackers` (text[]) - array of active tracker types
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Users can only access their own data
  - Authenticated users only
*/

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  status text DEFAULT 'pending' NOT NULL,
  detected_disease text,
  analysis_data jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prescriptions"
  ON prescriptions FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid REFERENCES prescriptions(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  dosage text NOT NULL,
  frequency text NOT NULL,
  timing text NOT NULL,
  duration_days integer,
  start_date date DEFAULT CURRENT_DATE NOT NULL,
  end_date date,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own medications"
  ON medications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own medications"
  ON medications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own medications"
  ON medications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own medications"
  ON medications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create health_trackers table
CREATE TABLE IF NOT EXISTS health_trackers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  tracker_type text NOT NULL,
  date date DEFAULT CURRENT_DATE NOT NULL,
  metrics jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE health_trackers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own health trackers"
  ON health_trackers FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own health trackers"
  ON health_trackers FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own health trackers"
  ON health_trackers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own health trackers"
  ON health_trackers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create medication_reminders table
CREATE TABLE IF NOT EXISTS medication_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id uuid REFERENCES medications(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  reminder_time time NOT NULL,
  days_of_week text[] DEFAULT ARRAY['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  is_active boolean DEFAULT true NOT NULL,
  last_taken_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE medication_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reminders"
  ON medication_reminders FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reminders"
  ON medication_reminders FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reminders"
  ON medication_reminders FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reminders"
  ON medication_reminders FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create diet_plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  disease_type text NOT NULL,
  meal_type text NOT NULL,
  recommendations jsonb NOT NULL,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diet plans"
  ON diet_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diet plans"
  ON diet_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet plans"
  ON diet_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diet plans"
  ON diet_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  age integer,
  gender text,
  detected_conditions text[] DEFAULT ARRAY[]::text[],
  active_trackers text[] DEFAULT ARRAY['general'],
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS prescriptions_user_id_idx ON prescriptions(user_id);
CREATE INDEX IF NOT EXISTS medications_user_id_idx ON medications(user_id);
CREATE INDEX IF NOT EXISTS medications_prescription_id_idx ON medications(prescription_id);
CREATE INDEX IF NOT EXISTS health_trackers_user_id_idx ON health_trackers(user_id);
CREATE INDEX IF NOT EXISTS health_trackers_date_idx ON health_trackers(date);
CREATE INDEX IF NOT EXISTS medication_reminders_user_id_idx ON medication_reminders(user_id);
CREATE INDEX IF NOT EXISTS diet_plans_user_id_idx ON diet_plans(user_id);