import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { UtensilsCrossed, Sun, CloudSun, Moon, Cookie, Sparkles } from 'lucide-react';

interface DietPlanEntry {
  id: string;
  disease_type: string;
  meal_type: string;
  recommendations: {
    foods: string[];
    avoid: string[];
    tips: string[];
  };
  is_active: boolean;
}

const mealIcons = {
  breakfast: Sun,
  lunch: CloudSun,
  dinner: Moon,
  snack: Cookie,
};

export function DietPlan() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ detected_conditions: string[] } | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlanEntry[]>([]);
  const [selectedCondition, setSelectedCondition] = useState<string>('general');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfile();
    loadDietPlans();
  }, []);

  const loadProfile = async () => {
    const { data } = await supabase
      .from('user_profiles')
      .select('detected_conditions')
      .eq('id', user!.id)
      .maybeSingle();

    if (data) {
      setProfile(data);
      if (data.detected_conditions.length > 0) {
        setSelectedCondition(data.detected_conditions[0]);
      }
    }
  };

  const loadDietPlans = async () => {
    const { data } = await supabase
      .from('diet_plans')
      .select('*')
      .eq('user_id', user!.id)
      .eq('is_active', true);

    if (data) {
      setDietPlans(data);
    }
  };

  const generateDietPlan = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-diet-plan`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ diseaseType: selectedCondition }),
        }
      );

      if (response.ok) {
        loadDietPlans();
      }
    } catch (error) {
      console.error('Error generating diet plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultRecommendations = (condition: string, mealType: string) => {
    const recommendations: Record<string, Record<string, { foods: string[]; avoid: string[]; tips: string[] }>> = {
      diabetes: {
        breakfast: {
          foods: ['Oatmeal with berries', 'Greek yogurt', 'Whole grain toast', 'Eggs'],
          avoid: ['Sugary cereals', 'White bread', 'Fruit juices', 'Pastries'],
          tips: ['Include protein with every meal', 'Choose complex carbs', 'Monitor portion sizes'],
        },
        lunch: {
          foods: ['Grilled chicken salad', 'Quinoa bowl', 'Lentil soup', 'Vegetable wrap'],
          avoid: ['Fried foods', 'White rice', 'Sugary sauces', 'Processed meats'],
          tips: ['Fill half your plate with vegetables', 'Choose lean proteins', 'Stay hydrated'],
        },
        dinner: {
          foods: ['Baked fish', 'Steamed vegetables', 'Brown rice', 'Tofu stir-fry'],
          avoid: ['Heavy pasta dishes', 'Creamy sauces', 'Desserts', 'Alcohol'],
          tips: ['Eat dinner 2-3 hours before bed', 'Keep portions moderate', 'Include fiber'],
        },
        snack: {
          foods: ['Nuts', 'Carrot sticks', 'Apple slices', 'Hummus'],
          avoid: ['Chips', 'Candy', 'Cookies', 'Soda'],
          tips: ['Plan snacks ahead', 'Keep healthy options ready', 'Watch timing'],
        },
      },
      general: {
        breakfast: {
          foods: ['Fresh fruits', 'Whole grains', 'Protein-rich foods', 'Green tea'],
          avoid: ['Processed foods', 'Excessive sugar', 'Trans fats'],
          tips: ['Never skip breakfast', 'Stay hydrated', 'Eat mindfully'],
        },
        lunch: {
          foods: ['Lean protein', 'Vegetables', 'Whole grains', 'Healthy fats'],
          avoid: ['Fast food', 'Fried items', 'Sugary drinks'],
          tips: ['Eat a balanced plate', 'Take time to eat', 'Choose colorful foods'],
        },
        dinner: {
          foods: ['Fish', 'Vegetables', 'Legumes', 'Salad'],
          avoid: ['Late heavy meals', 'Excessive carbs', 'Spicy foods'],
          tips: ['Eat light', 'Include vegetables', 'Maintain routine'],
        },
        snack: {
          foods: ['Fruits', 'Nuts', 'Yogurt', 'Seeds'],
          avoid: ['Junk food', 'Candy', 'Chips'],
          tips: ['Snack smart', 'Control portions', 'Choose nutritious options'],
        },
      },
    };

    const conditionPlans = recommendations[condition] || recommendations.general;
    return conditionPlans[mealType] || conditionPlans.breakfast;
  };

  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
  const conditions = profile?.detected_conditions.length
    ? profile.detected_conditions
    : ['general'];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center">
            <UtensilsCrossed className="w-6 h-6 mr-2 text-blue-600" />
            Personalized Diet Plan
          </h2>
          {profile && profile.detected_conditions.length > 0 && (
            <button
              onClick={generateDietPlan}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{loading ? 'Generating...' : 'Generate AI Plan'}</span>
            </button>
          )}
        </div>

        {conditions.length > 1 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Condition
            </label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            >
              {conditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition.charAt(0).toUpperCase() + condition.slice(1)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {mealTypes.map((mealType) => {
            const Icon = mealIcons[mealType as keyof typeof mealIcons];
            const recommendations = getDefaultRecommendations(selectedCondition, mealType);

            return (
              <div
                key={mealType}
                className="border border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <Icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 capitalize">{mealType}</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-700 mb-2">
                      Recommended Foods
                    </h4>
                    <ul className="space-y-1">
                      {recommendations.foods.map((food, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <span className="text-green-600 mr-2">✓</span>
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-semibold text-red-700 mb-2">Foods to Avoid</h4>
                    <ul className="space-y-1">
                      {recommendations.avoid.map((food, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start">
                          <span className="text-red-600 mr-2">✗</span>
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-3 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Tips</h4>
                    <ul className="space-y-1">
                      {recommendations.tips.map((tip, idx) => (
                        <li key={idx} className="text-xs text-blue-800">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            <strong>Note:</strong> These are general dietary recommendations. Always consult with your
            healthcare provider or a registered dietitian for personalized nutrition advice.
          </p>
        </div>
      </div>
    </div>
  );
}
