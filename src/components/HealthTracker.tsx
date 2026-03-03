import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Activity, Heart, Droplet, TrendingUp, Calendar } from 'lucide-react';

interface HealthTrackerProps {
  activeTrackers: string[];
}

interface TrackerEntry {
  id: string;
  tracker_type: string;
  date: string;
  metrics: Record<string, unknown>;
  notes: string | null;
}

const trackerConfigs = {
  general: {
    name: 'General Health',
    icon: Activity,
    color: 'blue',
    fields: [
      { key: 'weight', label: 'Weight (kg)', type: 'number' },
      { key: 'steps', label: 'Steps', type: 'number' },
      { key: 'sleep', label: 'Sleep (hours)', type: 'number' },
      { key: 'water', label: 'Water (glasses)', type: 'number' },
    ],
  },
  diabetes: {
    name: 'Diabetes Tracker',
    icon: Droplet,
    color: 'red',
    fields: [
      { key: 'glucose', label: 'Blood Glucose (mg/dL)', type: 'number' },
      { key: 'insulin', label: 'Insulin Dose (units)', type: 'number' },
      { key: 'carbs', label: 'Carbs Intake (g)', type: 'number' },
    ],
  },
  hypertension: {
    name: 'Blood Pressure Tracker',
    icon: Heart,
    color: 'orange',
    fields: [
      { key: 'systolic', label: 'Systolic (mmHg)', type: 'number' },
      { key: 'diastolic', label: 'Diastolic (mmHg)', type: 'number' },
      { key: 'heartRate', label: 'Heart Rate (bpm)', type: 'number' },
    ],
  },
};

export function HealthTracker({ activeTrackers }: HealthTrackerProps) {
  const { user } = useAuth();
  const [selectedTracker, setSelectedTracker] = useState(activeTrackers[0] || 'general');
  const [entries, setEntries] = useState<TrackerEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadEntries();
  }, [selectedTracker]);

  const loadEntries = async () => {
    const { data } = await supabase
      .from('health_trackers')
      .select('*')
      .eq('user_id', user!.id)
      .eq('tracker_type', selectedTracker)
      .order('date', { ascending: false })
      .limit(7);

    if (data) {
      setEntries(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { error } = await supabase.from('health_trackers').insert({
      user_id: user!.id,
      tracker_type: selectedTracker,
      date: new Date().toISOString().split('T')[0],
      metrics: formData,
      notes: notes || null,
    });

    if (!error) {
      setFormData({});
      setNotes('');
      setShowForm(false);
      loadEntries();
    }
  };

  const config = trackerConfigs[selectedTracker as keyof typeof trackerConfigs] || trackerConfigs.general;
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Activity className="w-6 h-6 mr-2 text-blue-600" />
          Health Tracker
        </h2>

        <div className="flex flex-wrap gap-2 mb-6">
          {activeTrackers.map((tracker) => {
            const trackerConfig = trackerConfigs[tracker as keyof typeof trackerConfigs];
            if (!trackerConfig) return null;

            return (
              <button
                key={tracker}
                onClick={() => setSelectedTracker(tracker)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedTracker === tracker
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {trackerConfig.name}
              </button>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`bg-${config.color}-600 p-3 rounded-lg`}>
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                <p className="text-sm text-gray-600">Track your daily measurements</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {showForm ? 'Cancel' : 'Log Entry'}
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {config.fields.map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {field.label}
                  </label>
                  <input
                    type={field.type}
                    value={formData[field.key] || ''}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    required
                  />
                </div>
              ))}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes (optional)
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                rows={2}
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Entry
            </button>
          </form>
        )}

        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2" />
            Recent Entries
          </h3>

          {entries.length > 0 ? (
            entries.map((entry) => (
              <div
                key={entry.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="flex items-center text-sm font-medium text-gray-900">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(entry.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(entry.metrics).map(([key, value]) => {
                    const field = config.fields.find((f) => f.key === key);
                    return (
                      <div key={key} className="bg-gray-50 p-2 rounded">
                        <p className="text-xs text-gray-600">{field?.label || key}</p>
                        <p className="text-lg font-semibold text-gray-900">{String(value)}</p>
                      </div>
                    );
                  })}
                </div>

                {entry.notes && (
                  <p className="mt-3 text-sm text-gray-600 bg-blue-50 p-2 rounded">{entry.notes}</p>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              No entries logged yet. Start tracking your health today!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
