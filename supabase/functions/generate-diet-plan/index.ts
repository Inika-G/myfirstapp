import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  diseaseType: string;
}

const dietRecommendations: Record<string, Record<string, {
  foods: string[];
  avoid: string[];
  tips: string[];
}>> = {
  diabetes: {
    breakfast: {
      foods: ['Steel-cut oatmeal with cinnamon', 'Greek yogurt with berries', 'Whole grain toast with avocado', 'Egg white omelet'],
      avoid: ['Sugary cereals', 'White bread', 'Fruit juices', 'Pastries and donuts'],
      tips: ['Include 15-20g protein', 'Choose low glycemic index foods', 'Monitor carb portions'],
    },
    lunch: {
      foods: ['Grilled chicken salad', 'Quinoa vegetable bowl', 'Lentil soup', 'Turkey lettuce wraps'],
      avoid: ['Fried foods', 'White rice', 'Sugary dressings', 'Processed meats'],
      tips: ['Balance carbs with protein', 'Fill half plate with non-starchy vegetables', 'Stay hydrated'],
    },
    dinner: {
      foods: ['Baked salmon', 'Steamed broccoli', 'Brown rice', 'Grilled tofu with vegetables'],
      avoid: ['Heavy pasta dishes', 'Creamy sauces', 'Desserts', 'Late night snacks'],
      tips: ['Eat 2-3 hours before bed', 'Keep portions moderate', 'Include fiber-rich foods'],
    },
    snack: {
      foods: ['Almonds (1 oz)', 'Carrot sticks with hummus', 'Apple slices with peanut butter', 'Low-fat cheese'],
      avoid: ['Chips', 'Candy bars', 'Cookies', 'Regular soda'],
      tips: ['Plan snacks in advance', 'Time snacks between meals', 'Keep portions small'],
    },
  },
  hypertension: {
    breakfast: {
      foods: ['Low-sodium oatmeal', 'Fresh fruit', 'Egg whites', 'Whole grain cereal'],
      avoid: ['Bacon', 'Sausage', 'High-sodium cereals', 'Processed breakfast meats'],
      tips: ['Limit sodium to 2000mg daily', 'Include potassium-rich foods', 'Read labels carefully'],
    },
    lunch: {
      foods: ['Grilled fish', 'Garden salad', 'Baked potato', 'Vegetable soup (low sodium)'],
      avoid: ['Deli meats', 'Canned soups', 'Fast food', 'Pickled foods'],
      tips: ['Use herbs instead of salt', 'Choose fresh over processed', 'Stay hydrated'],
    },
    dinner: {
      foods: ['Grilled chicken', 'Steamed vegetables', 'Wild rice', 'Bean dishes'],
      avoid: ['Frozen dinners', 'Canned vegetables', 'Salty sauces', 'Restaurant meals'],
      tips: ['Cook at home when possible', 'Use fresh ingredients', 'Limit alcohol'],
    },
    snack: {
      foods: ['Unsalted nuts', 'Fresh vegetables', 'Banana', 'Low-fat yogurt'],
      avoid: ['Salted chips', 'Pretzels', 'Canned snacks', 'Salted crackers'],
      tips: ['Choose low-sodium options', 'Eat fresh fruits', 'Avoid processed snacks'],
    },
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { diseaseType }: RequestBody = await req.json();

    await supabase
      .from('diet_plans')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('disease_type', diseaseType);

    const recommendations = dietRecommendations[diseaseType.toLowerCase()] || dietRecommendations.diabetes;
    const mealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];

    for (const mealType of mealTypes) {
      await supabase.from('diet_plans').insert({
        user_id: user.id,
        disease_type: diseaseType,
        meal_type: mealType,
        recommendations: recommendations[mealType],
        is_active: true,
      });
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Diet plan generated successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
