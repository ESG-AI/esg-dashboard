"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function Results() {
    const searchParams = useSearchParams();
    const fileUrls = searchParams.getAll("files");
    const [fileIndex, setFileIndex] = useState(0);
    const [files, setFiles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showPdf, setShowPdf] = useState(true);

    // Process file URLs on component mount
    useEffect(() => {
        if (fileUrls.length === 0) {
            setError("No files provided.");
        } else {
            setFiles(fileUrls);
        }
        setIsLoading(false);
    }, [fileUrls]);

    const handleNextFile = () => {
        if (fileIndex < files.length - 1) {
            setShowPdf(false);

            setTimeout(() => {
                setFileIndex(fileIndex + 1);

                setTimeout(() => {
                    setShowPdf(true);
                }, 50);
            }, 50);
        }
    };

    const handlePrevFile = () => {
        if (fileIndex > 0) {

            setShowPdf(false);

            setTimeout(() => {
                setFileIndex(fileIndex - 1);

                setTimeout(() => {
                    setShowPdf(true);
                }, 50);
            }, 50);
        }
    };

    return (
        <div className="flex h-screen bg-black text-white p-6">
            {/* Left: File Preview */}
            <div className="w-1/2 bg-gray-900 p-4 rounded-lg flex flex-col items-center">
                {isLoading ? (
                    <p>Loading PDF...</p>
                ) : error ? (
                    <p className="text-red-500">{error}</p>
                ) : files.length > 0 ? (
                    <>
                        {showPdf && (
                            <embed
                                key={`pdf-embed-${fileIndex}`}
                                src={`${files[fileIndex]}#${new Date().getTime()}`}
                                className='w-full h-full border border-gray-700 rounded' 
                                type="application/pdf"
                            />
                        )}
                        <div className="flex justify-between w-full mb-2 mt-4">
                            <button
                                onClick={handlePrevFile}
                                disabled={fileIndex === 0}
                                className="p-2 bg-gray-700 rounded disabled:opacity-50"
                            >
                                <ChevronLeft />
                            </button>
                            <p>File {fileIndex + 1} of {files.length}</p>
                            <button
                                onClick={handleNextFile}
                                disabled={fileIndex === files.length - 1}
                                className="p-2 bg-gray-700 rounded disabled:opacity-50"
                            >
                                <ChevronRight />
                            </button>
                        </div>
                    </>
                ) : (
                    <p>No files available.</p>
                )}
            </div>
                    
            {/* Right: Analysis Results */}
            <div className="w-1/2 p-4 space-y-4">
                <h2 className="text-xl font-bold">ESG Analysis Results</h2>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">ESG Score</h3>
                    <p className="text-2xl text-green-400">75</p>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg">
                    <h3 className="text-lg font-semibold">Explanation</h3>
                    <p className="text-gray-300">
                        The company demonstrates strong environmental responsibility...
                    </p>
                </div>
            </div>
        </div>
    );
}