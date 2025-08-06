'use client';

import { useState, useEffect } from 'react';
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
  actual_vote_count: number;
  added_by_user_id: string;
  added_by_username: string;
  is_approved: boolean;
  is_featured: boolean;
  created_at: string;
  recent_votes: Array<{
    user_id: string;
    username: string;
    voted_at: string;
  }>;
}

interface Vote {
  id: number;
  game_id: number;
  user_id: string;
  username: string;
  voted_at: string;
  game_name: string;
  game_image?: string;
  user_total_votes: number;
  user_first_seen: string;
}

interface VotingUser {
  twitch_user_id: string;
  twitch_username: string;
  twitch_display_name?: string;
  total_votes: number;
  games_submitted: number;
  can_vote: boolean;
  can_submit_games: boolean;
  first_login_at: string;
  last_login_at: string;
  last_vote_at?: string;
  actual_vote_count: number;
  actual_games_submitted: number;
  recent_votes: Array<{
    game_id: number;
    game_name: string;
    voted_at: string;
  }>;
  submitted_games: Array<{
    game_id: number;
    game_name: string;
    added_at: string;
  }>;
}

export default function GameVotingAdmin() {
  const [activeTab, setActiveTab] = useState<'games' | 'votes' | 'users'>('games');
  const [games, setGames] = useState<Game[]>([]);
  const [votes, setVotes] = useState<Vote[]>([]);
  const [users, setUsers] = useState<VotingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/game-voting?view=${activeTab}&limit=50`);
      if (response.ok) {
        const data = await response.json();
        
        switch (activeTab) {
          case 'games':
            setGames(data.games || []);
            break;
          case 'votes':
            setVotes(data.votes || []);
            break;
          case 'users':
            setUsers(data.users || []);
            break;
        }
      } else {
        console.error('Failed to load data');
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const performAction = async (action: string, gameId?: number, userId?: string, reason?: string) => {
    if (actionLoading) return;

    setActionLoading(true);
    try {
      const response = await fetch('/api/admin/game-voting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, gameId, userId, reason }),
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message);
        loadData(); // Refresh data
      } else {
        const error = await response.json();
        alert(error.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      alert('Action failed');
    } finally {
      setActionLoading(false);
    }
  };

  const toggleGameApproval = (gameId: number) => {
    if (confirm("Are you sure you want to toggle this game's approval status?")) {
      performAction('toggle_game_approval', gameId);
    }
  };

  const toggleGameFeatured = (gameId: number) => {
    performAction('feature_game', gameId);
  };

  const deleteGame = (gameId: number, gameName: string) => {
    const reason = prompt(`Why are you deleting "${gameName}"?`);
    if (reason) {
      if (confirm(`Are you sure you want to delete "${gameName}"? This will remove all votes for this game.`)) {
        performAction('delete_game', gameId, undefined, reason);
      }
    }
  };

  const banUser = (userId: string, username: string) => {
    const reason = prompt(`Why are you banning ${username}?`);
    if (reason) {
      if (confirm(`Are you sure you want to ban ${username} from voting and submitting games?`)) {
        performAction('ban_user', undefined, userId, reason);
      }
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-black mb-6">🎮 Game Voting Management</h2>
      
      {/* Tab Navigation */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { id: 'games', label: 'Games', icon: '🎮' },
              { id: 'votes', label: 'Recent Votes', icon: '🗳️' },
              { id: 'users', label: 'Users', icon: '👥' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'games' | 'votes' | 'users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-purple-500 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      ) : (
        <>
          {/* Games Tab */}
          {activeTab === 'games' && (
            <div className="space-y-4">
              <div className="grid gap-4">
                {games.map((game) => (
                  <div key={game.id} className="bg-white rounded-lg border p-4">
                    <div className="flex gap-4">
                      {/* Game Image */}
                      <div className="w-20 h-20 bg-gray-200 rounded flex-shrink-0">
                        {game.image_url ? (
                          <Image
                            src={game.image_url}
                            alt={game.name}
                            width={80}
                            height={80}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-2xl">
                            🎮
                          </div>
                        )}
                      </div>

                      {/* Game Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-lg text-black">{game.name}</h3>
                            {game.genre && <p className="text-purple-600 text-sm">{game.genre}</p>}
                            {game.developer && <p className="text-gray-600 text-sm">By: {game.developer}</p>}
                            <p className="text-gray-500 text-sm">
                              Added by: <span className="font-medium">{game.added_by_username}</span> 
                              {' on '}{new Date(game.created_at).toLocaleDateString()}
                            </p>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-purple-600">
                              {game.actual_vote_count} votes
                            </div>
                            <div className="flex gap-1 mt-1">
                              {game.is_featured && (
                                <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
                                  ⭐ Featured
                                </span>
                              )}
                              <span className={`text-xs px-2 py-1 rounded ${
                                game.is_approved 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {game.is_approved ? '✅ Approved' : '❌ Not Approved'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {game.description && (
                          <p className="text-gray-700 text-sm mt-2 line-clamp-2">{game.description}</p>
                        )}

                        {/* Recent Votes */}
                        {game.recent_votes && game.recent_votes.length > 0 && (
                          <div className="mt-3">
                            <p className="text-sm text-gray-600 mb-1">Recent votes:</p>
                            <div className="flex flex-wrap gap-1">
                              {game.recent_votes.slice(0, 5).map((vote, index) => (
                                <span key={index} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                                  {vote.username}
                                </span>
                              ))}
                              {game.recent_votes.length > 5 && (
                                <span className="text-xs text-gray-500">
                                  +{game.recent_votes.length - 5} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => toggleGameApproval(game.id)}
                            disabled={actionLoading}
                            className={`text-xs px-3 py-1 rounded font-medium transition-colors disabled:opacity-50 ${
                              game.is_approved
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            {game.is_approved ? 'Unapprove' : 'Approve'}
                          </button>

                          <button
                            onClick={() => toggleGameFeatured(game.id)}
                            disabled={actionLoading}
                            className={`text-xs px-3 py-1 rounded font-medium transition-colors disabled:opacity-50 ${
                              game.is_featured
                                ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                                : 'bg-gray-500 hover:bg-gray-600 text-white'
                            }`}
                          >
                            {game.is_featured ? 'Unfeature' : 'Feature'}
                          </button>

                          {game.steam_url && (
                            <a
                              href={game.steam_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs px-3 py-1 rounded font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                            >
                              Steam Page
                            </a>
                          )}

                          <button
                            onClick={() => deleteGame(game.id, game.name)}
                            disabled={actionLoading}
                            className="text-xs px-3 py-1 rounded font-medium bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 ml-auto"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {games.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 text-lg mb-4">No games found.</p>
                    <p className="text-gray-400 text-sm">Games will appear here once users start adding them through the voting system.</p>
                    <p className="text-gray-400 text-sm mt-2">Users can add games at <a href="/subathon-voting" className="text-purple-600 hover:underline">/subathon-voting</a></p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Votes Tab */}
          {activeTab === 'votes' && (
            <div className="space-y-3">
              {votes.map((vote) => (
                <div key={vote.id} className="bg-white rounded-lg border p-3 flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-200 rounded flex-shrink-0">
                    {vote.game_image ? (
                      <Image
                        src={vote.game_image}
                        alt={vote.game_name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">🎮</div>
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium text-black">{vote.username}</span>
                        <span className="text-gray-500 ml-2">voted for</span>
                        <span className="font-medium text-purple-600 ml-2">{vote.game_name}</span>
                      </div>
                      <div className="text-right text-sm text-gray-500">
                        <div>{new Date(vote.voted_at).toLocaleString()}</div>
                        <div>User total votes: {vote.user_total_votes}</div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {votes.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg mb-4">No recent votes found.</p>
                  <p className="text-gray-400 text-sm">Votes will appear here once users start voting on games.</p>
                  <p className="text-gray-400 text-sm mt-2">Check if users are able to vote at <a href="/subathon-voting" className="text-purple-600 hover:underline">/subathon-voting</a></p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.twitch_user_id} className="bg-white rounded-lg border p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-black">
                        {user.twitch_display_name || user.twitch_username}
                      </h3>
                      <p className="text-gray-600 text-sm">ID: {user.twitch_user_id}</p>
                      <p className="text-gray-500 text-sm">
                        Member since: {new Date(user.first_login_at).toLocaleDateString()}
                      </p>
                      <p className="text-gray-500 text-sm">
                        Last active: {new Date(user.last_login_at).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="text-right">
                      <div className="text-lg font-bold text-purple-600">
                        {user.actual_vote_count} votes
                      </div>
                      <div className="text-sm text-gray-600">
                        {user.actual_games_submitted} games added
                      </div>
                      <div className="flex gap-1 mt-1">
                        <span className={`text-xs px-2 py-1 rounded ${
                          user.can_vote 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.can_vote ? 'Can Vote' : 'Banned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  {user.recent_votes && user.recent_votes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Recent votes:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.recent_votes.map((vote, index) => (
                          <span key={index} className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded">
                            {vote.game_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.submitted_games && user.submitted_games.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 mb-1">Submitted games:</p>
                      <div className="flex flex-wrap gap-1">
                        {user.submitted_games.map((game, index) => (
                          <span key={index} className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded">
                            {game.game_name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* User Actions */}
                  <div className="mt-3 flex gap-2">
                    {user.can_vote ? (
                      <button
                        onClick={() => banUser(user.twitch_user_id, user.twitch_username)}
                        disabled={actionLoading}
                        className="text-xs px-3 py-1 rounded font-medium bg-red-500 hover:bg-red-600 text-white transition-colors disabled:opacity-50"
                      >
                        Ban User
                      </button>
                    ) : (
                      <span className="text-xs text-gray-500 italic">User is banned</span>
                    )}
                  </div>
                </div>
              ))}

              {users.length === 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-lg mb-4">No voting users found.</p>
                  <p className="text-gray-400 text-sm">Users will appear here once they start interacting with the voting system.</p>
                  <p className="text-gray-400 text-sm mt-2">Users need to log in and vote or add games at <a href="/subathon-voting" className="text-purple-600 hover:underline">/subathon-voting</a></p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
