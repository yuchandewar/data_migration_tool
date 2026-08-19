'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function NewJobWizard() {
  const router = useRouter();
  const [connections, setConnections] = useState<any[]>([]);
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Job Data
  const [name, setName] = useState('');
  const [sourceConnectionId, setSourceConnectionId] = useState('');
  const [sourceDatasetName, setSourceDatasetName] = useState('');
  const [destConnectionId, setDestConnectionId] = useState('');
  const [destDatasetName, setDestDatasetName] = useState('');
  
  // Schema & Rules
  const [sourceSchema, setSourceSchema] = useState<any[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Record<string, { action: string, newName: string, newType: string }>>({});
  const [availableDatasets, setAvailableDatasets] = useState<string[]>([]);
  const [loadingDatasets, setLoadingDatasets] = useState(false);
  const [useCustomSource, setUseCustomSource] = useState(false);
  const [sourceDatasetError, setSourceDatasetError] = useState('');
  
  const [availableDestDatasets, setAvailableDestDatasets] = useState<string[]>([]);
  const [loadingDestDatasets, setLoadingDestDatasets] = useState(false);
  const [useCustomDest, setUseCustomDest] = useState(false);
  const [destDatasetError, setDestDatasetError] = useState('');

  useEffect(() => {
    fetch('/api/connections')
      .then(res => res.json())
      .then(data => setConnections(data));
  }, []);

  useEffect(() => {
    if (!sourceConnectionId) return;
    setLoadingDatasets(true);
    setSourceDatasetName(''); 
    setSourceDatasetError('');
    fetch(`/api/connections/${sourceConnectionId}/datasets`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch datasets');
        if (Array.isArray(data) && data.length > 0) {
          setAvailableDatasets(data);
          setUseCustomSource(false);
        } else {
          setAvailableDatasets([]);
          setUseCustomSource(true);
        }
        setLoadingDatasets(false);
      })
      .catch((e) => {
        setAvailableDatasets([]);
        setUseCustomSource(true);
        setSourceDatasetError(e.message);
        setLoadingDatasets(false);
      });
  }, [sourceConnectionId]);

  useEffect(() => {
    if (!destConnectionId) return;
    setLoadingDestDatasets(true);
    setDestDatasetName('');
    setDestDatasetError('');
    fetch(`/api/connections/${destConnectionId}/datasets`)
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to fetch datasets');
        if (Array.isArray(data) && data.length > 0) {
          setAvailableDestDatasets(data);
          setUseCustomDest(false);
        } else {
          setAvailableDestDatasets([]);
          setUseCustomDest(true);
        }
        setLoadingDestDatasets(false);
      })
      .catch((e) => {
        setAvailableDestDatasets([]);
        setUseCustomDest(true);
        setDestDatasetError(e.message);
        setLoadingDestDatasets(false);
      });
  }, [destConnectionId]);

  const loadSchema = async () => {
    if (!sourceConnectionId || !sourceDatasetName) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/connections/${sourceConnectionId}/schema?dataset=${sourceDatasetName}`);
      if (res.ok) {
        const data = await res.json();
        setSourceSchema(data.fields || []);
        
        // Initialize default mappings (Pass Through)
        const initialMappings: any = {};
        (data.fields || []).forEach((field: any) => {
          initialMappings[field.name] = { action: 'PASS', newName: field.name, newType: field.type };
        });
        setFieldMappings(initialMappings);
        setStep(2);
      } else {
        alert('Failed to fetch schema. Make sure the dataset name is correct.');
      }
    } catch (e) {
      console.error(e);
      alert('Error fetching schema.');
    }
    setLoading(false);
  };

  const addManualField = () => {
    const fieldName = prompt("Enter source field name (e.g., 'email'):");
    if (fieldName && !sourceSchema.find(f => f.name === fieldName)) {
      setSourceSchema([...sourceSchema, { name: fieldName, type: 'STRING' }]);
      setFieldMappings({
        ...fieldMappings,
        [fieldName]: { action: 'PASS', newName: fieldName, newType: 'STRING' }
      });
    }
  };

  const submitJob = async () => {
    setLoading(true);
    
    // Generate Transformation Rules from Field Mappings
    const rules: any[] = [];
    Object.keys(fieldMappings).forEach(originalName => {
      const mapping = fieldMappings[originalName];
      
      if (mapping.action === 'DROP') {
        rules.push({
          id: Math.random().toString(),
          type: 'DROP_COLUMN',
          config: { column: originalName }
        });
      } else {
        // If passing through or renaming
        if (mapping.newName !== originalName) {
          rules.push({
            id: Math.random().toString(),
            type: 'RENAME_COLUMN',
            config: { sourceColumn: originalName, targetColumn: mapping.newName }
          });
        }
        
        // If type cast
        const originalType = sourceSchema.find(f => f.name === originalName)?.type;
        if (mapping.newType !== originalType) {
          rules.push({
            id: Math.random().toString(),
            type: 'CAST_TYPE',
            config: { column: mapping.newName, targetType: mapping.newType }
          });
        }
      }
    });

    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        sourceConnectionId,
        sourceDatasetName,
        destConnectionId,
        destDatasetName,
        transformationRules: rules
      })
    });

    if (res.ok) {
      router.push('/jobs');
    } else {
      alert('Failed to save job.');
      setLoading(false);
    }
  };

  const updateMapping = (fieldName: string, key: string, value: string) => {
    setFieldMappings({
      ...fieldMappings,
      [fieldName]: { ...fieldMappings[fieldName], [key]: value }
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          <Link href="/">Universal Data Migration</Link>
        </h1>
        <nav className="flex space-x-4">
          <Link href="/connections" className="text-sm font-medium text-gray-600 hover:text-gray-900">Connections</Link>
          <Link href="/jobs" className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-1">Jobs</Link>
          <Link href="/convert" className="text-sm font-medium text-gray-600 hover:text-gray-900">Quick Convert</Link>
          <Link href="/guide" className="text-sm font-medium text-gray-600 hover:text-gray-900">Guide</Link>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Migration Job</h2>
          <p className="text-gray-600">Map your data from source to destination visually.</p>
        </div>

        {step === 1 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 1: Source Selection</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Job Name</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Weekly Sync" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Source Connection</Label>
                  <Select value={sourceConnectionId} onValueChange={(v) => v && setSourceConnectionId(v)}>
                    <SelectTrigger><SelectValue placeholder="Select Source" /></SelectTrigger>
                    <SelectContent>
                      {connections.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Source Table/Collection Name</Label>
                  {loadingDatasets ? (
                    <div className="text-sm text-gray-500 py-2">Loading collections...</div>
                  ) : availableDatasets.length > 0 && !useCustomSource ? (
                    <div className="flex space-x-2">
                      <Select value={sourceDatasetName} onValueChange={(v) => {
                        if (!v) return;
                        if (v === '__CUSTOM__') {
                          setUseCustomSource(true);
                          setSourceDatasetName('');
                        } else {
                          setSourceDatasetName(v);
                        }
                      }}>
                        <SelectTrigger className="flex-1"><SelectValue placeholder="Select dataset" /></SelectTrigger>
                        <SelectContent>
                          {availableDatasets.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                          <SelectItem value="__CUSTOM__" className="font-medium text-indigo-600">✨ Type custom name...</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="flex space-x-2">
                      <Input 
                        value={sourceDatasetName} 
                        onChange={e => setSourceDatasetName(e.target.value)} 
                        placeholder={!sourceConnectionId ? "Select a connection first..." : "e.g., users"} 
                        disabled={!sourceConnectionId}
                      />
                      {availableDatasets.length > 0 && (
                        <Button type="button" variant="outline" onClick={() => {
                          setUseCustomSource(false);
                          setSourceDatasetName('');
                        }}>
                          List
                        </Button>
                      )}
                    </div>
                  )}
                  {sourceDatasetError && <p className="text-xs text-red-500">{sourceDatasetError}</p>}
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={loadSchema} 
                disabled={!name || !sourceConnectionId || !sourceDatasetName || loading}
              >
                {loading ? 'Loading Schema...' : 'Load Source Schema ->'}
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
            <h3 className="text-lg font-medium text-gray-900 border-b pb-2">Step 2: Visual Schema Mapping</h3>
            
            <div className="border rounded-md overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Source Field</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Action</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Target Name</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-500">Target Type</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sourceSchema.map((field) => {
                    const mapping = fieldMappings[field.name];
                    return (
                    <tr key={field.name} className={mapping?.action === 'DROP' ? 'opacity-50 bg-gray-50' : ''}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {field.name} <span className="text-xs text-gray-500 font-normal ml-1">({field.type})</span>
                      </td>
                      <td className="px-4 py-3">
                        <Select 
                          value={mapping?.action} 
                          onValueChange={(v) => v && updateMapping(field.name, 'action', v)}
                        >
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PASS">Pass Through</SelectItem>
                            <SelectItem value="RENAME">Rename</SelectItem>
                            <SelectItem value="DROP">Drop Column</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-3">
                        <Input 
                          value={fieldMappings[field.name]?.newName} 
                          onChange={(e) => updateMapping(field.name, 'newName', e.target.value)}
                          disabled={fieldMappings[field.name]?.action === 'DROP' || fieldMappings[field.name]?.action === 'PASS'}
                          className="w-full"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <Select 
                          value={mapping?.newType} 
                          onValueChange={(v) => v && updateMapping(field.name, 'newType', v)}
                          disabled={mapping?.action === 'DROP'}
                        >
                          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="STRING">String</SelectItem>
                            <SelectItem value="NUMBER">Number</SelectItem>
                            <SelectItem value="BOOLEAN">Boolean</SelectItem>
                            <SelectItem value="DATE">Date</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      </tr>
                    );
                  })}
                  {sourceSchema.length === 0 && (
                    <tr><td colSpan={4} className="text-center py-4 text-gray-500">No schema fields detected.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="outline" size="sm" onClick={addManualField}>
                + Add Field Manually
              </Button>
            </div>

            <h3 className="text-lg font-medium text-gray-900 border-b pb-2 mt-8">Step 3: Destination</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Destination Connection</Label>
                <Select value={destConnectionId} onValueChange={(v) => v && setDestConnectionId(v)}>
                  <SelectTrigger><SelectValue placeholder="Select Destination" /></SelectTrigger>
                  <SelectContent>
                    {connections.map(c => <SelectItem key={c.id} value={c.id}>{c.name} ({c.type})</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Destination Table/Collection Name</Label>
                {loadingDestDatasets ? (
                  <div className="text-sm text-gray-500 py-2">Loading collections...</div>
                ) : availableDestDatasets.length > 0 && !useCustomDest ? (
                  <div className="flex space-x-2">
                    <Select value={destDatasetName} onValueChange={(v) => {
                      if (!v) return;
                      if (v === '__CUSTOM__') {
                        setUseCustomDest(true);
                        setDestDatasetName('');
                      } else {
                        setDestDatasetName(v);
                      }
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder="Select dataset" /></SelectTrigger>
                      <SelectContent>
                        {availableDestDatasets.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
                        <SelectItem value="__CUSTOM__" className="font-medium text-indigo-600">✨ Type custom name...</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <Input 
                      value={destDatasetName} 
                      onChange={e => setDestDatasetName(e.target.value)} 
                      placeholder={!destConnectionId ? "Select a connection first..." : "e.g., users_new"}
                      disabled={!destConnectionId} 
                    />
                    {availableDestDatasets.length > 0 && (
                      <Button type="button" variant="outline" onClick={() => {
                        setUseCustomDest(false);
                        setDestDatasetName('');
                      }}>
                        List
                      </Button>
                    )}
                  </div>
                )}
                {destDatasetError && <p className="text-xs text-red-500">{destDatasetError}</p>}
              </div>
            </div>

            <div className="flex justify-between mt-6">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button 
                onClick={submitJob} 
                disabled={!destConnectionId || !destDatasetName || loading}
              >
                {loading ? 'Saving...' : 'Save & Create Job'}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
