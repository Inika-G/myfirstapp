import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Upload, FileText, Loader, CheckCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';

interface Prescription {
  id: string;
  image_url: string;
  status: 'pending' | 'analyzed' | 'error';
  detected_disease: string | null;
  analysis_data: Record<string, unknown> | null;
  created_at: string;
}

interface PrescriptionUploadProps {
  onUploadSuccess: () => void;
}

export function PrescriptionUpload({ onUploadSuccess }: PrescriptionUploadProps) {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    loadPrescriptions();
  }, []);

  const loadPrescriptions = async () => {
    const { data } = await supabase
      .from('prescriptions')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (data) {
      setPrescriptions(data);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user!.id}/${Date.now()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, selectedFile);

      if (uploadError) {
        const { data: storageData } = await supabase.storage.from('prescriptions').list();

        if (!storageData) {
          alert('Please enable storage in your Supabase project and create a "prescriptions" bucket');
          setUploading(false);
          return;
        }
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('prescriptions')
        .getPublicUrl(fileName);

      const { data: prescription, error: dbError } = await supabase
        .from('prescriptions')
        .insert({
          user_id: user!.id,
          image_url: publicUrl,
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      await analyzePrescription(prescription.id, publicUrl);

      setSelectedFile(null);
      setPreviewUrl(null);
      await loadPrescriptions();
      onUploadSuccess();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload prescription. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const analyzePrescription = async (prescriptionId: string, imageUrl: string) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-prescription`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ prescriptionId, imageUrl }),
        }
      );

      if (!response.ok) {
        throw new Error('Analysis failed');
      }
    } catch (error) {
      console.error('Analysis error:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <Upload className="w-6 h-6 mr-2 text-blue-600" />
          Upload Prescription
        </h2>

        <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 transition-colors">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="prescription-upload"
            disabled={uploading}
          />

          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Prescription preview"
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
              <div className="flex justify-center space-x-3">
                <button
                  onClick={handleUpload}
                  disabled={uploading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="flex items-center">
                      <Loader className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload & Analyze'
                  )}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl(null);
                  }}
                  disabled={uploading}
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <label htmlFor="prescription-upload" className="cursor-pointer">
              <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-900 font-medium mb-1">
                Click to upload prescription image
              </p>
              <p className="text-sm text-gray-500">PNG, JPG up to 10MB</p>
            </label>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <FileText className="w-6 h-6 mr-2 text-blue-600" />
          Your Prescriptions
        </h2>

        {prescriptions.length > 0 ? (
          <div className="space-y-4">
            {prescriptions.map((prescription) => (
              <div
                key={prescription.id}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {prescription.status === 'analyzed' && (
                        <CheckCircle className="w-5 h-5 text-green-600" />
                      )}
                      {prescription.status === 'pending' && (
                        <Loader className="w-5 h-5 text-blue-600 animate-spin" />
                      )}
                      {prescription.status === 'error' && (
                        <AlertCircle className="w-5 h-5 text-red-600" />
                      )}
                      <span className="font-medium text-gray-900">
                        {prescription.status === 'analyzed' && 'Analysis Complete'}
                        {prescription.status === 'pending' && 'Analyzing...'}
                        {prescription.status === 'error' && 'Analysis Failed'}
                      </span>
                    </div>

                    {prescription.detected_disease && (
                      <p className="text-sm text-gray-700 mb-2">
                        <span className="font-medium">Detected Condition:</span>{' '}
                        <span className="text-orange-700">{prescription.detected_disease}</span>
                      </p>
                    )}

                    <p className="text-xs text-gray-500">
                      Uploaded: {new Date(prescription.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  <a
                    href={prescription.image_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    View Image
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No prescriptions uploaded yet</p>
        )}
      </div>
    </div>
  );
}
