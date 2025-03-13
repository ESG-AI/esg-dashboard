"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; 
import { Document, Page, pdfjs} from "react-pdf";
import { ChevronLeft, ChevronRight } from "lucide-react";

pdfjs.GlobalWorkerOptions.workerSrc = new URL (
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
).toString();

export default function Results() {
    const searchParams = useSearchParams();
    const files = searchParams.getAll("files");
    const [fileIndex, setFileIndex] = useState(0);

    useEffect(() => {
        if (files.length === 0) {
            console.error("No files provided.");
        }
    }, [files]);

    const handleNextFile = () => {
        if (fileIndex < files.length - 1) {
            setFileIndex(fileIndex + 1);
        }
    };

    const handlePrevFile = () => {
        if (fileIndex > 0) {
            setFileIndex(fileIndex - 1);
        }
    };
    
    console.log("Loading file:", files[fileIndex]);
    return (
        <div className="flex h-screen bg-black text-white p-6">
           {/* Left: File Preview*/}
           <div className="w-1/2 bg-gray-900 p-4 rounded-lg flex flex-col items-center"> 
               {files.length > 0 ? (
                    <>
                    
                        <Document
                            file={{ url: files[fileIndex] }}
                            onLoadSuccess={() => console.log("PDF Loaded Successfully")}
                            onLoadError={(error) => console.error("PDF Load Error:", error)}
                            className="w-full overflow-y-auto max-h-[500px]"
                        >
                            <Page pageNumber={1} className="border border-gray-700 rounded"/>
                        </Document>
                        <div className="flex justify-between w-full mb-2">
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
                                disabled={fileIndex === files.length -1 }
                                className="p-2 bg-gray-700 rounded disabled:opacity-50"
                            >
                                <ChevronRight />
                            </button>
                        </div>
                    </>
               ) : (
                    <p>No file available.</p>
               )}
           </div>

            {/*Right: Analysis Results */}
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