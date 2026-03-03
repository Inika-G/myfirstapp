import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Pill, Upload, Activity, Calendar, TrendingUp, FileText } from 'lucide-react';

interface DashboardHomeProps {
  profile: {
    full_name: string | null;
    detected_conditions: string[];
    active_trackers: string[];
  } | null;
  onNavigate: (view: 'home' | 'prescriptions' | 'medications' | 'tracker' | 'diet') => void;
}

export function DashboardHome({ profile, onNavigate }: DashboardHomeProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    prescriptions: 0,
    activeMedications: 0,
    upcomingReminders: 0,
  });
  const [recentActivity, setRecentActivity] = useState<Array<{
    type: string;
    message: string;
    time: string;
  }>>([]);

  useEffect(() => {
    if (user) {
      loadStats();
      loadRecentActivity();
    }
  }, [user]);

  const loadStats = async () => {
    const [prescriptionsRes, medsRes, remindersRes] = await Promise.all([
      supabase.from('prescriptions').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase.from('medications').select('id', { count: 'exact', head: true }).eq('user_id', user!.id),
      supabase
        .from('medication_reminders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('is_active', true),
    ]);

    setStats({
      prescriptions: prescriptionsRes.count || 0,
      activeMedications: medsRes.count || 0,
      upcomingReminders: remindersRes.count || 0,
    });
  };

  const loadRecentActivity = async () => {
    const { data: prescriptions } = await supabase
      .from('prescriptions')
      .select('created_at, detected_disease')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(3);

    if (prescriptions) {
      const activities = prescriptions.map((p) => ({
        type: 'prescription',
        message: p.detected_disease
          ? `New prescription analyzed - ${p.detected_disease} detected`
          : 'New prescription uploaded',
        time: new Date(p.created_at).toLocaleDateString(),
      }));
      setRecentActivity(activities);
    }
  };

  const statCards = [
    {
      icon: FileText,
      label: 'Total Prescriptions',
      value: stats.prescriptions,
      color: 'bg-blue-500',
      onClick: () => onNavigate('prescriptions'),
    },
    {
      icon: Pill,
      label: 'Active Medications',
      value: stats.activeMedications,
      color: 'bg-green-500',
      onClick: () => onNavigate('medications'),
    },
    {
      icon: Calendar,
      label: 'Active Reminders',
      value: stats.upcomingReminders,
      color: 'bg-orange-500',
      onClick: () => onNavigate('medications'),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">
          Welcome back, {profile?.full_name || 'User'}!
        </h1>
        <p className="text-blue-100">
          Your personalized health management dashboard
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <button
            key={idx}
            onClick={card.onClick}
            className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-600 mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Activity className="w-5 h-5 mr-2 text-blue-600" />
            Recent Activity
          </h2>
          {recentActivity.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.map((activity, idx) => (
                <div key={idx} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">{activity.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No recent activity</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Upload className="w-5 h-5 mr-2 text-blue-600" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            <button
              onClick={() => onNavigate('prescriptions')}
              className="w-full text-left p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-blue-900">Upload New Prescription</p>
              <p className="text-sm text-blue-700 mt-1">AI will analyze and extract medication details</p>
            </button>
            <button
              onClick={() => onNavigate('tracker')}
              className="w-full text-left p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <p className="font-medium text-green-900">Log Health Metrics</p>
              <p className="text-sm text-green-700 mt-1">Track your daily health measurements</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
