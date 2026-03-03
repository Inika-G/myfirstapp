import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import {
  Pill,
  Upload,
  Calendar,
  Activity,
  UtensilsCrossed,
  LogOut,
  Home,
  FileText
} from 'lucide-react';
import { PrescriptionUpload } from './PrescriptionUpload';
import { MedicationList } from './MedicationList';
import { HealthTracker } from './HealthTracker';
import { DietPlan } from './DietPlan';
import { DashboardHome } from './DashboardHome';

type View = 'home' | 'prescriptions' | 'medications' | 'tracker' | 'diet';

export function Dashboard() {
  const { user, signOut } = useAuth();
  const [currentView, setCurrentView] = useState<View>('home');
  const [profile, setProfile] = useState<{
    full_name: string | null;
    detected_conditions: string[];
    active_trackers: string[];
  } | null>(null);

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('full_name, detected_conditions, active_trackers')
      .eq('id', user!.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
    }
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const navItems = [
    { id: 'home' as View, icon: Home, label: 'Home' },
    { id: 'prescriptions' as View, icon: Upload, label: 'Prescriptions' },
    { id: 'medications' as View, icon: Pill, label: 'Medications' },
    { id: 'tracker' as View, icon: Activity, label: 'Health Tracker' },
    { id: 'diet' as View, icon: UtensilsCrossed, label: 'Diet Plan' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Pill className="w-6 h-6 text-white" />
              </div>
              <h1 className="ml-3 text-xl font-bold text-gray-900">RxGuardian AI</h1>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <aside className="lg:w-64">
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    currentView === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
            </div>

            {profile && profile.detected_conditions.length > 0 && (
              <div className="mt-4 bg-white rounded-xl shadow-sm p-4">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                  <Activity className="w-4 h-4 mr-2" />
                  Active Conditions
                </h3>
                <div className="space-y-2">
                  {profile.detected_conditions.map((condition, idx) => (
                    <div
                      key={idx}
                      className="bg-orange-50 border border-orange-200 text-orange-800 px-3 py-2 rounded-lg text-sm"
                    >
                      {condition}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          <main className="flex-1">
            {currentView === 'home' && <DashboardHome profile={profile} onNavigate={setCurrentView} />}
            {currentView === 'prescriptions' && <PrescriptionUpload onUploadSuccess={loadProfile} />}
            {currentView === 'medications' && <MedicationList />}
            {currentView === 'tracker' && <HealthTracker activeTrackers={profile?.active_trackers || ['general']} />}
            {currentView === 'diet' && <DietPlan />}
          </main>
        </div>
      </div>
    </div>
  );
}
