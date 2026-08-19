'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [stats, setStats] = useState({ activeJobs: 0, totalMigrations: 0, savedConnections: 0 });
  const [recentJobs, setRecentJobs] = useState<any[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const [jobsRes, connRes] = await Promise.all([
        fetch('/api/jobs'),
        fetch('/api/connections')
      ]);

      if (jobsRes.ok && connRes.ok) {
        const jobs = await jobsRes.json();
        const connections = await connRes.json();
        
        setStats({
          activeJobs: jobs.filter((j: any) => j.status === 'RUNNING').length,
          totalMigrations: jobs.filter((j: any) => j.status === 'COMPLETED').length,
          savedConnections: connections.length
        });
        
        setRecentJobs(jobs.slice(0, 5));
      }
    };
    fetchDashboardData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Universal Data Migration</h1>
        <nav className="flex space-x-4">
          <Link href="/connections" className="text-sm font-medium text-gray-600 hover:text-gray-900">Connections</Link>
          <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">Jobs</Link>
          <Link href="/convert" className="text-sm font-medium text-gray-600 hover:text-gray-900">Quick Convert</Link>
          <Link href="/guide" className="text-sm font-medium text-gray-600 hover:text-gray-900">Guide</Link>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500">Active Jobs</h2>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.activeJobs}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500">Completed Migrations</h2>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.totalMigrations}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-sm font-medium text-gray-500">Saved Connections</h2>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{stats.savedConnections}</p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Jobs</h2>
          <div className="bg-white shadow-sm border border-gray-200 rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentJobs.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">No recent jobs.</td></tr>
                )}
                {recentJobs.map(job => (
                  <tr key={job.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{job.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${job.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          job.status === 'RUNNING' ? 'bg-yellow-100 text-yellow-800' : 
                          job.status === 'FAILED' ? 'bg-red-100 text-red-800' : 
                          'bg-blue-100 text-blue-800'}`}>
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.sourceConnection?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{job.destConnection?.name || 'Unknown'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
