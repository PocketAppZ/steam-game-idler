import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export default function Logs() {
    const [logs, setLogs] = useState([]);
    const [logPath, setLogPath] = useState('');

    useEffect(() => {
        const fetchLogs = async () => {
            if (typeof window !== 'undefined' && window.__TAURI__) {
                try {
                    const fullLogPath = await invoke('get_app_log_dir');
                    const logContents = await window.__TAURI__.fs.readTextFile(`${fullLogPath}\\log.txt`);
                    const logEntries = logContents.split('\n').filter(entry => entry.trim() !== '').map(entry => {
                        const [timestamp, message] = entry.split(' + ');
                        return { timestamp, message };
                    });
                    setLogs(logEntries);
                    setLogPath(`${fullLogPath}\\log.txt`);
                } catch (error) {
                    console.error('Error fetching logs:', error);
                }
            }
        };
        fetchLogs();
        const intervalId = setInterval(fetchLogs, 1000);
        return () => clearInterval(intervalId);
    }, []);

    return (
        <React.Fragment>
            <div className='mt-4 p-4 border border-border rounded'>
                <div className='mb-6'>
                    <p className='text-sm font-semibold'>
                        Logs
                    </p>
                    <p className='text-xs'>
                        Log file location: <span className='font-mono bg-containerhover px-1 py-0.5'>{logPath}</span>
                    </p>
                </div>

                <div className="bg-container border border-border font-mono text-xs rounded min-h-[200px] max-h-[200px] overflow-y-auto">
                    <table className="w-full border-collapse">
                        <thead className="sticky top-0 z-10">
                            <tr className="border-b border-border bg-titlebar">
                                <th className="text-left p-1.5 w-[200px]">Time</th>
                                <th className="text-left p-1.5">Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                <React.Fragment>
                                    {logs.map((log, index) => (
                                        <tr key={index} className={index % 2 === 0 ? 'bg-container' : 'bg-[#f1f1f1] dark:bg-[#1a1a1a]'}>
                                            <td className="p-1.5 text-sgi uppercase">{log.timestamp}</td>
                                            <td className={`p-1.5 ${log.message.includes('Error') && 'text-red-400'}`}>
                                                {log.message}
                                            </td>
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ) : (
                                <tr className="bg-container">
                                    <td className="p-1.5 text-sgi uppercase">-</td>
                                    <td className="p-1.5">No logs created yet</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </React.Fragment>
    );
}