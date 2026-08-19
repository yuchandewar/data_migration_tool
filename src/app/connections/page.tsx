'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ConnectionsPage() {
  const [connections, setConnections] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', type: 'POSTGRES', host: '', port: '5432', database: '', username: '', password: '', connectionUrl: '' });

  const fetchConnections = async () => {
    const res = await fetch('/api/connections');
    if (res.ok) {
      setConnections(await res.json());
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const config: any = {};
    if (formData.connectionUrl) {
      config.connectionUrl = formData.connectionUrl;
    } else {
      config.host = formData.host;
      config.port = parseInt(formData.port);
      config.database = formData.database;
      config.username = formData.username;
      config.password = formData.password;
    }

    const res = await fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: formData.name, type: formData.type, config })
    });

    if (res.ok) {
      setIsDialogOpen(false);
      fetchConnections();
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">
          <Link href="/">Universal Data Migration</Link>
        </h1>
        <nav className="flex space-x-4">
          <Link href="/connections" className="text-sm font-medium text-gray-900 border-b-2 border-gray-900 pb-1">Connections</Link>
          <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900">Jobs</Link>
          <Link href="/convert" className="text-sm font-medium text-gray-600 hover:text-gray-900">Quick Convert</Link>
          <Link href="/guide" className="text-sm font-medium text-gray-600 hover:text-gray-900">Guide</Link>
        </nav>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Connections</h2>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button />}>
              New Connection
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Connection</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Connection Name</Label>
                  <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g., Prod Database" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Connection Type</Label>
                  <Select value={formData.type} onValueChange={(v) => v && setFormData({...formData, type: v})}>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="POSTGRES">PostgreSQL</SelectItem>
                      <SelectItem value="MYSQL">MySQL</SelectItem>
                      <SelectItem value="MONGODB">MongoDB</SelectItem>
                      <SelectItem value="CSV">CSV</SelectItem>
                      <SelectItem value="API">API</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {['POSTGRES', 'MYSQL', 'MONGODB'].includes(formData.type) && (
                  <>
                    <div className="space-y-2">
                      <Label>Connection String / URL (Optional)</Label>
                      <Input value={formData.connectionUrl} onChange={e => setFormData({...formData, connectionUrl: e.target.value})} placeholder="mongodb+srv://... (Overrides Host/Port)" />
                    </div>
                    
                    <div className="text-xs font-semibold text-gray-500 uppercase">OR Enter Details Manually:</div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Host</Label>
                        <Input value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} placeholder="localhost" />
                      </div>
                      <div className="space-y-2">
                        <Label>Port</Label>
                        <Input value={formData.port} onChange={e => setFormData({...formData, port: e.target.value})} placeholder="5432" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Database</Label>
                      <Input value={formData.database} onChange={e => setFormData({...formData, database: e.target.value})} placeholder="my_db" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Username</Label>
                        <Input value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label>Password</Label>
                        <Input type="password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                      </div>
                    </div>
                  </>
                )}

                <Button type="submit" className="w-full">Save Connection</Button>
              </form>
            </DialogContent>
          </Dialog>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {connections.length === 0 && <p className="text-gray-500">No connections added yet.</p>}
          {connections.map((conn) => (
            <div key={conn.id} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{conn.name}</h3>
                  <p className="text-sm text-gray-500">{conn.type}</p>
                </div>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">Ready</span>
              </div>
              <p className="mt-4 text-sm text-gray-600 font-mono text-xs overflow-hidden text-ellipsis whitespace-nowrap">
                {conn.config}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
