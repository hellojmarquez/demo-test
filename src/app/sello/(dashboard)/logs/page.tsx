'use client';

import { useState, useEffect } from 'react';

const LogsPage = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const res = await fetch('/api/logs');
        if (!res.ok) throw new Error('Failed to fetch logs');
        const data = await res.json();
        setLogs(data);
      } catch (error) {
        console.error(error);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Logs</h1>
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="text-left p-4">Timestamp</th>
              <th className="text-left p-4">Level</th>
              <th className="text-left p-4">Message</th>
              <th className="text-left p-4">Metadata</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log: any) => (
              <tr key={log._id} className="border-t">
                <td className="p-4">{new Date(log.createdAt).toLocaleString()}</td>
                <td className={`p-4 ${log.level === 'error' ? 'text-red-500' : log.level === 'warning' ? 'text-yellow-500' : 'text-green-500'}`}>
                  {log.level}
                </td>
                <td className="p-4">{log.message}</td>
                <td className="p-4">{JSON.stringify(log.metadata)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LogsPage;
