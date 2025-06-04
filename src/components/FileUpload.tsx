import { useState } from 'react';
import { uploadFile } from '../services/api';
import { UploadedFile } from '../types';

interface FileUploadProps {
  onFileUploaded: (file: UploadedFile) => void;
}

export const FileUpload = ({ onFileUploaded }: FileUploadProps) => {
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const ALLOWED_FILE_TYPES = [
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError('File size exceeds 10MB limit');
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setError('Invalid file type. Please upload JPEG, PNG, PDF, or DOCX files');
      return;
    }

    setError('');
    setIsUploading(true);

    try {
      const uploadedFile: UploadedFile = await uploadFile(file);
      uploadedFile.type = file.type;
      uploadedFile.name = file.name;
      uploadedFile.thumbnailUrl = file.type === 'application/pdf' ? 
        '/resource/icon/pdf.png' :
        file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ? 
        '/resource/icon/doc.png' :
        '';

      const base64Data = await convertToBase64(file);
      uploadedFile.base64 = base64Data;
      
      onFileUploaded(uploadedFile);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="mt-4">
      <label
        htmlFor="file-upload"
        className={`cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#0B93F6] hover:bg-[#0A84DD] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0B93F6] ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isUploading ? 'Uploading...' : 'Upload File'}
        <input
          id="file-upload"
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.pdf,.docx"
          disabled={isUploading}
        />
      </label>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {error}
        </div>
      )}
    </div>
  );
};