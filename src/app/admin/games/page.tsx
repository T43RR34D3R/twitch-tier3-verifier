'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

interface ImportStats {
  imported: number;
  skipped: number;
  errors: number;
  totalProcessed: number;
}

interface DatabaseStats {
  total_games: string;
  igdb_imported_games: string;
  approved_games: string;
  first_game_date: string;
  latest_game_date: string;
}

export default function GamesAdminPage() {
  const { data: session } = useSession();
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportStats | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch current database stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/games/bulk-import');
      const data = await response.json();
      if (data.success) {
        setDbStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  // Trigger bulk import
  const startBulkImport = async () => {
    if (!confirm('This will import up to 1000 popular games from IGDB. This may take several minutes. Continue?')) {
      return;
    }

    setIsImporting(true);
    setError(null);
    setImportResult(null);

    try {
      const response = await fetch('/api/games/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 1000,
          minRating: 70,
          minRatingCount: 10,
          yearFrom: 2010
        })
      });

      const data = await response.json();

      if (data.success) {
        setImportResult(data.stats);
        await fetchStats(); // Refresh stats
      } else {
        setError(data.error || 'Import failed');
      }
    } catch (err) {
      setError('Network error during import');
      console.error('Import error:', err);
    } finally {
      setIsImporting(false);
    }
  };

  // Clear duplicates
  const clearDuplicates = async () => {
    if (!confirm('This will remove duplicate games from the database. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/debug-games?action=clear-duplicates', {
        method: 'DELETE'
      });
      const data = await response.json();
      
      if (data.success) {
        alert(data.message);
        await fetchStats();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Network error');
      console.error('Clear duplicates error:', err);
    }
  };

  // Fetch stats on component mount
  useState(() => {
    fetchStats();
  });

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Please sign in to access admin features.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Games Database Administration</h1>

        {/* Current Stats */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Current Database Stats</h2>
          {dbStats ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-blue-400">{dbStats.total_games}</div>
                <div className="text-sm text-gray-300">Total Games</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-green-400">{dbStats.igdb_imported_games}</div>
                <div className="text-sm text-gray-300">IGDB Imported</div>
              </div>
              <div className="bg-gray-700 p-4 rounded">
                <div className="text-2xl font-bold text-yellow-400">{dbStats.approved_games}</div>
                <div className="text-sm text-gray-300">Approved Games</div>
              </div>
            </div>
          ) : (
            <div className="text-gray-400">Loading stats...</div>
          )}
          <button
            onClick={fetchStats}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            Refresh Stats
          </button>
        </div>

        {/* Bulk Import Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Bulk Import from IGDB</h2>
          <p className="text-gray-300 mb-4">
            Import up to 1000 popular games from IGDB (rating ≥ 70, released after 2010)
          </p>
          
          {error && (
            <div className="bg-red-600 p-4 rounded mb-4">
              <strong>Error:</strong> {error}
            </div>
          )}

          {importResult && (
            <div className="bg-green-600 p-4 rounded mb-4">
              <h3 className="font-semibold mb-2">Import Completed!</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                <div><strong>Imported:</strong> {importResult.imported}</div>
                <div><strong>Skipped:</strong> {importResult.skipped}</div>
                <div><strong>Errors:</strong> {importResult.errors}</div>
                <div><strong>Total:</strong> {importResult.totalProcessed}</div>
              </div>
            </div>
          )}

          <button
            onClick={startBulkImport}
            disabled={isImporting}
            className={`px-6 py-3 rounded font-semibold transition-colors ${
              isImporting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {isImporting ? 'Importing... Please wait' : 'Start Bulk Import'}
          </button>

          {isImporting && (
            <div className="mt-4 text-yellow-400">
              <div className="animate-pulse">⏳ Importing games... This may take several minutes.</div>
            </div>
          )}
        </div>

        {/* Database Maintenance */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Database Maintenance</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Remove Duplicate Games</h3>
              <p className="text-gray-300 mb-2">
                Remove duplicate games from the database (keeps the earliest entry)
              </p>
              <button
                onClick={clearDuplicates}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
              >
                Clear Duplicates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
