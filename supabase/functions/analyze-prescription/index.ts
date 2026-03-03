import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface RequestBody {
  prescriptionId: string;
  imageUrl: string;
}

const medicineDatabase: Record<string, { disease: string; category: string }> = {
  metformin: { disease: 'Diabetes', category: 'Blood Sugar Control' },
  glimcare: { disease: 'Diabetes', category: 'Blood Sugar Control' },
  glimepiride: { disease: 'Diabetes', category: 'Blood Sugar Control' },
  insulin: { disease: 'Diabetes', category: 'Blood Sugar Control' },
  lisinopril: { disease: 'Hypertension', category: 'Blood Pressure' },
  amlodipine: { disease: 'Hypertension', category: 'Blood Pressure' },
  losartan: { disease: 'Hypertension', category: 'Blood Pressure' },
  atenolol: { disease: 'Hypertension', category: 'Blood Pressure' },
  aspirin: { disease: 'Heart Disease', category: 'Cardiovascular' },
  atorvastatin: { disease: 'High Cholesterol', category: 'Lipid Control' },
};

function analyzeMedications(medications: Array<{ name: string }>) {
  const detectedDiseases = new Set<string>();

  medications.forEach((med) => {
    const medName = med.name.toLowerCase();
    for (const [drug, info] of Object.entries(medicineDatabase)) {
      if (medName.includes(drug)) {
        detectedDiseases.add(info.disease);
      }
    }
  });

  return Array.from(detectedDiseases);
}

function simulatePrescriptionAnalysis(imageUrl: string) {
  const sampleMedications = [
    {
      name: 'Metformin',
      dosage: '500mg',
      frequency: 'Twice daily',
      timing: 'morning,evening',
      duration_days: 30,
    },
    {
      name: 'Lisinopril',
      dosage: '10mg',
      frequency: 'Once daily',
      timing: 'morning',
      duration_days: 30,
    },
  ];

  const diseases = analyzeMedications(sampleMedications);

  return {
    medications: sampleMedications,
    detected_disease: diseases[0] || null,
    all_conditions: diseases,
    confidence: 0.85,
  };
}

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

    const { prescriptionId, imageUrl }: RequestBody = await req.json();

    const analysisResult = simulatePrescriptionAnalysis(imageUrl);

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

    await supabase
      .from('prescriptions')
      .update({
        status: 'analyzed',
        detected_disease: analysisResult.detected_disease,
        analysis_data: analysisResult,
        updated_at: new Date().toISOString(),
      })
      .eq('id', prescriptionId);

    for (const med of analysisResult.medications) {
      const timings = med.timing.split(',');

      await supabase.from('medications').insert({
        prescription_id: prescriptionId,
        user_id: user.id,
        name: med.name,
        dosage: med.dosage,
        frequency: med.frequency,
        timing: timings[0],
        duration_days: med.duration_days,
        start_date: new Date().toISOString().split('T')[0],
      });
    }

    if (analysisResult.all_conditions.length > 0) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('detected_conditions, active_trackers')
        .eq('id', user.id)
        .single();

      if (profile) {
        const newConditions = Array.from(
          new Set([...profile.detected_conditions, ...analysisResult.all_conditions])
        );

        const newTrackers = Array.from(
          new Set([
            ...profile.active_trackers,
            ...analysisResult.all_conditions.map((c) => c.toLowerCase()),
          ])
        );

        await supabase
          .from('user_profiles')
          .update({
            detected_conditions: newConditions,
            active_trackers: newTrackers,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, analysis: analysisResult }),
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
