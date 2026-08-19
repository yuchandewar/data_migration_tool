'use client';

import { useState, DragEvent, useRef } from 'react';
import Link from 'next/link';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Helper utilities for nested JSON paths
const getFlattenedPaths = (obj: any, prefix = ''): string[] => {
  let paths: string[] = [];
  if (!obj || typeof obj !== 'object') return paths;
  Object.keys(obj).forEach(key => {
    const newPrefix = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      paths = paths.concat(getFlattenedPaths(obj[key], newPrefix));
    } else {
      paths.push(newPrefix);
    }
  });
  return paths;
};

const getPathValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

const setPathValue = (obj: any, path: string, value: any) => {
  if (!path) return;
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]]) current[parts[i]] = {};
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
};

export default function QuickConvertPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState<'csv' | 'json' | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  
  // Mapping state: Original Field -> Custom Target Path
  const [sourceFields, setSourceFields] = useState<string[]>([]);
  const [mappings, setMappings] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const initializeMappings = (parsedData: any[], format: 'csv' | 'json') => {
    if (parsedData.length === 0) return;
    
    let fields: string[] = [];
    if (format === 'csv') {
      fields = Object.keys(parsedData[0] || {});
    } else {
      fields = getFlattenedPaths(parsedData[0] || {});
    }

    const initialMappings: Record<string, string> = {};
    fields.forEach(f => {
      initialMappings[f] = f;
    });

    setSourceFields(fields);
    setMappings(initialMappings);
  };

  const processFile = (selectedFile: File) => {
    setError('');
    setFile(selectedFile);
    setData([]);
    setSourceFields([]);
    setMappings({});

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (selectedFile.name.toLowerCase().endsWith('.csv')) {
          setSourceFormat('csv');
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
              setData(results.data);
              initializeMappings(results.data, 'csv');
            },
            error: (err: any) => setError(err.message)
          });
        } else if (selectedFile.name.toLowerCase().endsWith('.json')) {
          setSourceFormat('json');
          const parsed = JSON.parse(text);
          const parsedArray = Array.isArray(parsed) ? parsed : [parsed];
          setData(parsedArray);
          initializeMappings(parsedArray, 'json');
        } else {
          setError('Unsupported file format. Please upload a .csv or .json file.');
        }
      } catch (err: any) {
        setError(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(selectedFile);
  };

  const updateMapping = (sourceField: string, targetPath: string) => {
    setMappings(prev => ({ ...prev, [sourceField]: targetPath }));
  };

  // Generate the dynamically mapped data based on user configuration
  const getTransformedData = () => {
    return data.map(row => {
      const newObj: any = {};
      sourceFields.forEach(field => {
        const targetPath = mappings[field] || field;
        
        if (sourceFormat === 'csv') {
          // CSV (flat) -> JSON (nested possible)
          const value = row[field];
          setPathValue(newObj, targetPath, value);
        } else {
          // JSON (nested) -> CSV (flat)
          const value = getPathValue(row, field);
          newObj[targetPath] = typeof value === 'object' ? JSON.stringify(value) : value;
        }
      });
      return newObj;
    });
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJson = () => {
    const jsonStr = JSON.stringify(getTransformedData(), null, 2);
    downloadFile(jsonStr, 'custom_data.json', 'application/json');
  };

  const handleExportCsv = () => {
    const csvStr = Papa.unparse(getTransformedData());
    downloadFile(csvStr, 'custom_data.csv', 'text/csv');
  };

  const transformedData = getTransformedData();
  const previewData = transformedData.slice(0, 3);
  const targetFormat = sourceFormat === 'csv' ? 'JSON' : 'CSV';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          <Link href="/">Universal Data Migration</Link>
        </h1>
        <nav className="flex space-x-4">
          <Link href="/connections" className="text-sm font-medium text-gray-600 hover:text-gray-900">Connections</Link>
          <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">Jobs</Link>
          <Link href="/convert" className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-1">Quick Convert</Link>
          <Link href="/guide" className="text-sm font-medium text-gray-600 hover:text-gray-900">Guide</Link>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-6xl mx-auto w-full">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Drag & Drop Converter</h2>
          <p className="text-gray-600">Instantly convert and restructure CSV / JSON formats visually.</p>
        </div>

        <div 
          className={`border-4 border-dashed rounded-xl p-12 text-center transition-colors mb-8 ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 bg-white hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-indigo-100 rounded-full">
              <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-700">Drag & Drop your CSV or JSON file here</h3>
            <input type="file" accept=".csv,.json" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
            <Button onClick={() => fileInputRef.current?.click()}>Browse Files</Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {data.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            
            {/* Visual Structure Mapper */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-2">Customize Structure</h3>
              <p className="text-sm text-gray-500 mb-4">
                {sourceFormat === 'csv' 
                  ? "Define nested JSON paths using dot notation (e.g., 'user.profile.name')." 
                  : "Map nested JSON paths to flat CSV column headers."}
              </p>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {sourceFields.map(field => (
                  <div key={field} className="flex items-center space-x-3 bg-gray-50 p-2 rounded border">
                    <div className="w-1/2 overflow-hidden text-ellipsis text-sm font-medium text-gray-700" title={field}>
                      {field}
                    </div>
                    <div className="text-gray-400">→</div>
                    <Input 
                      className="w-1/2 h-8" 
                      value={mappings[field] || ''} 
                      onChange={e => updateMapping(field, e.target.value)} 
                      placeholder={field}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Live Preview</h3>
                  <p className="text-sm text-gray-500">Previewing mapped {targetFormat} output</p>
                </div>
                <Button 
                  onClick={sourceFormat === 'csv' ? handleExportJson : handleExportCsv}
                  className={sourceFormat === 'csv' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-green-600 hover:bg-green-700'}
                >
                  Download {targetFormat}
                </Button>
              </div>

              <div className="flex-1 bg-gray-900 text-green-400 p-4 rounded-md overflow-auto font-mono text-xs whitespace-pre-wrap max-h-[400px]">
                {sourceFormat === 'csv' 
                  ? JSON.stringify(previewData, null, 2)
                  : Papa.unparse(previewData)
                }
              </div>
              <p className="text-center text-xs text-gray-500 mt-2">Showing first {previewData.length} of {data.length} records</p>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
