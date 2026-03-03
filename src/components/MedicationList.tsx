import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pill, Clock, Calendar, Bell, BellOff, Plus, X } from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  timing: string;
  start_date: string;
  end_date: string | null;
  notes: string | null;
}

interface Reminder {
  id: string;
  medication_id: string;
  reminder_time: string;
  is_active: boolean;
}

export function MedicationList() {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: '',
    timing: '',
    notes: '',
  });

  useEffect(() => {
    loadMedications();
    loadReminders();
  }, []);

  const loadMedications = async () => {
    const { data } = await supabase
      .from('medications')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMedications(data);
    }
  };

  const loadReminders = async () => {
    const { data } = await supabase
      .from('medication_reminders')
      .select('*')
      .eq('user_id', user!.id);

    if (data) {
      setReminders(data);
    }
  };

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data, error } = await supabase
      .from('medications')
      .insert({
        user_id: user!.id,
        ...newMed,
      })
      .select()
      .single();

    if (!error && data) {
      setMedications([data, ...medications]);
      setNewMed({ name: '', dosage: '', frequency: '', timing: '', notes: '' });
      setShowAddForm(false);
    }
  };

  const toggleReminder = async (medId: string) => {
    const existingReminder = reminders.find((r) => r.medication_id === medId);

    if (existingReminder) {
      await supabase
        .from('medication_reminders')
        .update({ is_active: !existingReminder.is_active })
        .eq('id', existingReminder.id);
    } else {
      await supabase.from('medication_reminders').insert({
        medication_id: medId,
        user_id: user!.id,
        reminder_time: '09:00:00',
        is_active: true,
      });
    }

    loadReminders();
  };

  const getTimingColor = (timing: string) => {
    const colors: Record<string, string> = {
      morning: 'bg-yellow-100 text-yellow-800',
      afternoon: 'bg-orange-100 text-orange-800',
      evening: 'bg-blue-100 text-blue-800',
      night: 'bg-indigo-100 text-indigo-800',
    };
    return colors[timing.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <Pill className="w-6 h-6 mr-2 text-blue-600" />
            My Medications
          </h2>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showAddForm ? 'Cancel' : 'Add Medication'}</span>
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddMedication} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Medication Name"
                value={newMed.name}
                onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
              <input
                type="text"
                placeholder="Dosage (e.g., 500mg)"
                value={newMed.dosage}
                onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
              <input
                type="text"
                placeholder="Frequency (e.g., Twice daily)"
                value={newMed.frequency}
                onChange={(e) => setNewMed({ ...newMed, frequency: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              />
              <select
                value={newMed.timing}
                onChange={(e) => setNewMed({ ...newMed, timing: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                required
              >
                <option value="">Select Timing</option>
                <option value="morning">Morning</option>
                <option value="afternoon">Afternoon</option>
                <option value="evening">Evening</option>
                <option value="night">Night</option>
              </select>
            </div>
            <textarea
              placeholder="Notes (optional)"
              value={newMed.notes}
              onChange={(e) => setNewMed({ ...newMed, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              rows={2}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Add Medication
            </button>
          </form>
        )}

        {medications.length > 0 ? (
          <div className="space-y-4">
            {medications.map((med) => {
              const reminder = reminders.find((r) => r.medication_id === med.id);
              return (
                <div
                  key={med.id}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{med.name}</h3>
                      <p className="text-sm text-gray-600">{med.dosage}</p>
                    </div>
                    <button
                      onClick={() => toggleReminder(med.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        reminder?.is_active
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                      title={reminder?.is_active ? 'Reminder active' : 'Enable reminder'}
                    >
                      {reminder?.is_active ? (
                        <Bell className="w-5 h-5" />
                      ) : (
                        <BellOff className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      <Clock className="w-4 h-4 mr-1" />
                      {med.frequency}
                    </span>
                    <span className={`text-sm px-3 py-1 rounded-full ${getTimingColor(med.timing)}`}>
                      {med.timing}
                    </span>
                    <span className="flex items-center text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded-full">
                      <Calendar className="w-4 h-4 mr-1" />
                      Start: {new Date(med.start_date).toLocaleDateString()}
                    </span>
                  </div>

                  {med.notes && (
                    <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">{med.notes}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Pill className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No medications added yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Upload a prescription or add medications manually
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
