'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function JobsPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    sourceConnectionId: '', 
    destConnectionId: '',
    sourceDatasetName: '',
    destDatasetName: ''
  });

  const fetchData = async () => {
    const [jobsRes, connRes] = await Promise.all([
      fetch('/api/jobs'),
      fetch('/api/connections')
    ]);
    if (jobsRes.ok) setJobs(await jobsRes.json());
    if (connRes.ok) setConnections(await connRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...formData,
        transformationRules: [] // Leaving empty for simple setup for now
      })
    });

    if (res.ok) {
      setIsDialogOpen(false);
      fetchData();
    }
  };

  const handleRunJob = async (jobId: string) => {
    await fetch(`/api/jobs/${jobId}/run`, { method: 'POST' });
    fetchData(); // Refresh to see RUNNING status
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

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Migration Jobs</h2>
          
          <Button onClick={() => window.location.href = '/jobs/new'}>
            Create Job
          </Button>
        </div>

        <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobs.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">No jobs created yet.</td></tr>
              )}
              {jobs.map(job => (
                <tr key={job.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{job.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        job.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' : 
                        job.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                        'bg-blue-100 text-blue-800'}`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.sourceConnection?.name || 'Unknown'} ({job.sourceDatasetName})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {job.destConnection?.name || 'Unknown'} ({job.destDatasetName})
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 hover:text-indigo-900">
                    <button onClick={() => handleRunJob(job.id)} disabled={job.status === 'RUNNING'} className="mr-4">
                      {job.status === 'RUNNING' ? 'Running...' : 'Run Now'}
                    </button>
                    {job.status === 'COMPLETED' && (
                      <button 
                        onClick={() => window.open(`/api/jobs/${job.id}/download`, '_blank')}
                        className="text-green-600 hover:text-green-900"
                      >
                        Download Data
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
