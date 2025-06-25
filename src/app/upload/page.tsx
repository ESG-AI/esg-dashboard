"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, Trash2, FileText } from "lucide-react";

// Define document type options
type DocumentType =
  | "sustainability_report"
  | "annual_report"
  | "financial_statement";

// Interface for file with type
interface FileWithType {
  file: File;
  documentType: DocumentType;
}

export default function UploadPage() {
  const [files, setFiles] = useState<FileWithType[]>([]);
  const router = useRouter();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files).map((file) => ({
        file,
        documentType: "sustainability_report" as DocumentType,
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files) {
      const newFiles = Array.from(event.dataTransfer.files).map((file) => ({
        file,
        documentType: "sustainability_report" as DocumentType,
      }));
      setFiles([...files, ...newFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleDocumentTypeChange = (
    index: number,
    documentType: DocumentType
  ) => {
    const updatedFiles = [...files];
    updatedFiles[index] = { ...updatedFiles[index], documentType };
    setFiles(updatedFiles);
  };

 const handleStartAnalysis = () => {
  if (files.length === 0) return;

  // Create URL params including both file URLs, document types, and original filenames
  const params = new URLSearchParams();

  files.forEach((fileWithType, index) => {
    const url = URL.createObjectURL(fileWithType.file);
    params.append("files", url);
    params.append("docTypes", fileWithType.documentType);
    params.append("fileNames", fileWithType.file.name); // Add original filename
  });

  router.push(`/results?${params.toString()}`);
};

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-gray-200">
      {/* Header Section */}
      <header className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white">Upload Your Files</h1>
        <p className="mt-2 text-gray-400">
          Upload your Sustainability Report in PDF or DOCX format to start the
          ESG analysis.
        </p>
      </header>

      {/* Drag-and-Drop Area */}
      <div
        className="border-2 border-gray-600 border-dashed rounded-2xl p-10 flex flex-col items-center w-96 cursor-pointer hover:border-gray-400 transition bg-gray-800"
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <label className="cursor-pointer flex flex-col items-center">
          <Upload size={48} className="text-blue-500 mb-4" />
          <p className="text-gray-300 font-medium">
            Drag & drop or click to upload
          </p>
          <input
            type="file"
            accept=".pdf, .docx"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>
      </div>

      {/* File List */}
      {files.length > 0 ? (
        <div className="mt-6 w-96 max-h-40 overflow-y-auto bg-gray-800 p-4 rounded-lg">
          {files.map((fileItem, index) => (
            <div
              key={index}
              className="flex flex-col p-3 mb-3 w-full bg-gray-750 rounded-md"
            >
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-3 w-full overflow-hidden">
                  <FileText size={16} className="text-gray-400 flex-shrink-0" />
                  <span className="text-gray-300 text-sm truncate">
                    {fileItem.file.name}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveFile(index)}
                  className="flex-shrink-0 p-1 rounded-full hover:bg-gray-600"
                  style={{ width: "32px", height: "32px" }} // Fixed size for the button
                >
                  <Trash2
                    size={16}
                    className="text-red-500 hover:text-red-600"
                  />
                </button>
              </div>

              {/* Document Type Selector */}
              <div className="mt-2">
                <p className="text-xs text-gray-400 mb-2">Document Type:</p>
                <div className="flex gap-2 w-full">
                  {[
                    {value: "sustainability_report", label: "Sustainability Report"},
                    {value: "annual_report", label: "Annual Report"},
                    {value: "financial_statement", label: "Financial Statement"},
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleDocumentTypeChange(index, option.value as DocumentType)}
                      className={`px-3 py-1.5 text-xs rounded-full flex-1 transition-colors ${fileItem.documentType === option.value
                        ? "bg-gradient-to-r from-blue-500 to-blue-500 text-white"
                        : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-6 text-gray-500">No files uploaded yet.</p>
      )}

      {/* Start Analysis Button */}
      <button
        onClick={handleStartAnalysis}
        disabled={files.length === 0}
        className={`mt-6 px-6 py-3 rounded-full text-white font-semibold transition ${
          files.length > 0
            ? "bg-gradient-to-r from-green-400 to-blue-500 hover:opacity-90"
            : "bg-gray-600 cursor-not-allowed"
        }`}
      >
        Start Analysis
      </button>
    </div>
  );
}