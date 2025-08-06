'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Game {
  id: number;
  name: string;
  description?: string;
  steam_id?: string;
  steam_url?: string;
  image_url?: string;
  genre?: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  vote_count: number;
  current_vote_count: number;
  added_by_username: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
}

interface GameSearchResult {
  source: 'steam' | 'igdb' | 'rawg' | 'manual';
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  developer?: string;
  publisher?: string;
  release_date?: string;
  genre?: string;
  source_url?: string;
}

export default function SubathonVoting() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [games, setGames] = useState<Game[]>([]);
  const [votedGames, setVotedGames] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('current_vote_count');
  const [showAddGame, setShowAddGame] = useState(false);
  
  // Search and add game states
  const [searchResults, setSearchResults] = useState<GameSearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [gameSearch, setGameSearch] = useState('');
  
  // Manual game entry states
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualGame, setManualGame] = useState({
    name: '',
    description: '',
    image_url: '',
    developer: '',
    publisher: '',
    genre: '',
    release_date: ''
  });

  const loadGames = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        limit: '50',
        sortBy,
        order: 'DESC'
      });
      
      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/games?${params}`);
      if (response.ok) {
        const data = await response.json();
        setGames(data.games);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  }, [sortBy, searchTerm]);

  const loadUserVotes = useCallback(async () => {
    try {
      const gameIds = games.map(game => game.id).join(',');
      const response = await fetch(`/api/games/vote?gameIds=${gameIds}`);
      if (response.ok) {
        const data = await response.json();
        setVotedGames(new Set(data.votedGames));
      }
    } catch (error) {
      console.error('Error loading user votes:', error);
    }
  }, [games]);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }
    if (session) {
      loadGames();
    }
  }, [session, status, router, loadGames]);

  useEffect(() => {
    if (games.length > 0) {
      loadUserVotes();
    }
  }, [games, loadUserVotes]);

  const handleVote = async (gameId: number) => {
    const hasVoted = votedGames.has(gameId);
    
    try {
      const response = await fetch('/api/games/vote', {
        method: hasVoted ? 'DELETE' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
      });

      if (response.ok) {
        // Update local state
        const newVotedGames = new Set(votedGames);
        if (hasVoted) {
          newVotedGames.delete(gameId);
        } else {
          newVotedGames.add(gameId);
        }
        setVotedGames(newVotedGames);

        // Update vote count in games list
        setGames(prevGames => 
          prevGames.map(game => 
            game.id === gameId 
              ? { 
                  ...game, 
                  current_vote_count: hasVoted 
                    ? game.current_vote_count - 1 
                    : game.current_vote_count + 1 
                }
              : game
          )
        );
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to process vote');
      }
    } catch (error) {
      console.error('Error voting:', error);
      alert('Failed to process vote');
    }
  };

  const searchGames = async () => {
    if (!gameSearch.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`/api/games/search?q=${encodeURIComponent(gameSearch)}&sources=igdb`);
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.games);
      }
    } catch (error) {
      console.error('Error searching games:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const addGameFromSearch = async (searchResult: GameSearchResult) => {
    setAddLoading(true);
    try {
      const gameData = {
        name: searchResult.name,
        description: searchResult.description,
        steam_id: searchResult.source === 'steam' ? searchResult.id : null,
        steam_url: searchResult.source_url,
        image_url: searchResult.image_url,
        genre: searchResult.genre,
        developer: searchResult.developer,
        publisher: searchResult.publisher,
        release_date: searchResult.release_date
      };

      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameData),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.game.name} has been added to the voting list!`);
        setShowAddGame(false);
        setGameSearch('');
        setSearchResults([]);
        loadGames(); // Refresh the games list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add game');
      }
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game');
    } finally {
      setAddLoading(false);
    }
  };

  const addManualGame = async () => {
    if (!manualGame.name.trim()) {
      alert('Game name is required');
      return;
    }

    setAddLoading(true);
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualGame),
      });

      if (response.ok) {
        const data = await response.json();
        alert(`${data.game.name} has been added to the voting list!`);
        setShowManualEntry(false);
        setManualGame({
          name: '',
          description: '',
          image_url: '',
          developer: '',
          publisher: '',
          genre: '',
          release_date: ''
        });
        loadGames(); // Refresh the games list
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to add game');
      }
    } catch (error) {
      console.error('Error adding game:', error);
      alert('Failed to add game');
    } finally {
      setAddLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-4 text-xl">Loading games...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
            🎮 Buck&apos;s Subathon Game Voting
          </h1>
          <p className="text-gray-300 text-lg">
            Vote for the games you want to see during the subathon! Each user can vote once per game.
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-8 justify-between items-center">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <input
              type="text"
              placeholder="Search games..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && loadGames()}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
          >
            <option value="current_vote_count">Most Voted</option>
            <option value="created_at">Newest</option>
            <option value="name">Alphabetical</option>
          </select>

          {/* Add Game Button */}
          <button
            onClick={() => setShowAddGame(true)}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 rounded-lg font-medium transition-colors"
          >
            + Add Game
          </button>

          {/* Refresh Button */}
          <button
            onClick={loadGames}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
          >
            🔄 Refresh
          </button>
        </div>

        {/* Games Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-lg">
              {/* Game Image */}
              <div className="relative h-48 bg-gray-700">
                {game.image_url ? (
                  <Image
                    src={game.image_url}
                    alt={game.name}
                    fill
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <span className="text-6xl">🎮</span>
                  </div>
                )}
              </div>

              {/* Game Info */}
              <div className="p-4">
                <h3 className="text-lg font-bold mb-2 line-clamp-2">{game.name}</h3>
                
                {game.genre && (
                  <p className="text-sm text-purple-400 mb-2">{game.genre}</p>
                )}
                
                {game.description && (
                  <p className="text-sm text-gray-300 mb-3 line-clamp-3">{game.description}</p>
                )}

                {game.developer && (
                  <p className="text-xs text-gray-400 mb-2">By: {game.developer}</p>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    {game.current_vote_count} vote{game.current_vote_count !== 1 ? 's' : ''}
                  </span>
                  
                  <button
                    onClick={() => handleVote(game.id)}
                    disabled={addLoading}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      votedGames.has(game.id)
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    } disabled:opacity-50`}
                  >
                    {votedGames.has(game.id) ? '❤️ Voted' : '🗳️ Vote'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {games.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">No games found. Be the first to add one!</p>
          </div>
        )}

        {/* Add Game Modal */}
        {showAddGame && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold">Add New Game</h2>
                  <button
                    onClick={() => {
                      setShowAddGame(false);
                      setGameSearch('');
                      setSearchResults([]);
                    }}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6">
                {/* Search Games */}
                <div className="mb-6">
                  <div className="flex gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Search for a game..."
                      value={gameSearch}
                      onChange={(e) => setGameSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchGames()}
                      className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      onClick={searchGames}
                      disabled={searchLoading || !gameSearch.trim()}
                      className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                    >
                      {searchLoading ? 'Searching...' : 'Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
                      {searchResults.map((result, index) => (
                        <div key={index} className="flex items-center gap-4 p-4 bg-gray-700 rounded-lg">
                          <div className="w-16 h-16 bg-gray-600 rounded flex-shrink-0">
                            {result.image_url && (
                              <Image
                                src={result.image_url}
                                alt={result.name}
                                width={64}
                                height={64}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          
                          <div className="flex-1">
                            <h3 className="font-bold">{result.name}</h3>
                            {result.genre && <p className="text-sm text-purple-400">{result.genre}</p>}
                            {result.developer && <p className="text-sm text-gray-400">By: {result.developer}</p>}
                            <span className="text-xs bg-gray-600 px-2 py-1 rounded capitalize">
                              {result.source}
                            </span>
                          </div>
                          
                          <button
                            onClick={() => addGameFromSearch(result)}
                            disabled={addLoading}
                            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                          >
                            Add
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Manual Entry Option */}
                <div className="border-t border-gray-700 pt-6">
                  <button
                    onClick={() => setShowManualEntry(!showManualEntry)}
                    className="text-purple-400 hover:text-purple-300 font-medium"
                  >
                    Can&apos;t find your game? Add it manually →
                  </button>

                  {showManualEntry && (
                    <div className="mt-4 space-y-4">
                      <input
                        type="text"
                        placeholder="Game Name *"
                        value={manualGame.name}
                        onChange={(e) => setManualGame({...manualGame, name: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      />
                      
                      <textarea
                        placeholder="Description"
                        value={manualGame.description}
                        onChange={(e) => setManualGame({...manualGame, description: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500 h-24 resize-none"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Developer"
                          value={manualGame.developer}
                          onChange={(e) => setManualGame({...manualGame, developer: e.target.value})}
                          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        />
                        
                        <input
                          type="text"
                          placeholder="Genre"
                          value={manualGame.genre}
                          onChange={(e) => setManualGame({...manualGame, genre: e.target.value})}
                          className="px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      
                      <input
                        type="url"
                        placeholder="Image URL"
                        value={manualGame.image_url}
                        onChange={(e) => setManualGame({...manualGame, image_url: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
                      />
                      
                      <button
                        onClick={addManualGame}
                        disabled={addLoading || !manualGame.name.trim()}
                        className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 rounded-lg font-medium transition-colors"
                      >
                        {addLoading ? 'Adding...' : 'Add Game'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
