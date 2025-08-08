"use client";

import { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

interface MerchItem {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  price: string;
  isEnabled: boolean;
  orderIndex: number;
}

interface MerchSettings {
  isEnabled: boolean;
  title: string;
  subtitle?: string;
  maxItemsToShow: number;
  layout: 'grid' | 'carousel' | 'list';
  showPrices: boolean;
  items: MerchItem[];
}

export default function MerchAdmin() {
  const [settings, setSettings] = useState<MerchSettings>({
    isEnabled: true,
    title: "Check Out My Merch!",
    subtitle: "Support the stream with some awesome gear!",
    maxItemsToShow: 6,
    layout: 'grid',
    showPrices: true,
    items: []
  });
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    loadMerchSettings();
  }, []);

  const loadMerchSettings = async () => {
    try {
      const response = await fetch('/api/merch-settings');
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (error) {
      console.error('Error loading merch settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaveState('saving');
    try {
      const response = await fetch('/api/merch-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        setSaveState('saved');
        setTimeout(() => setSaveState('idle'), 2000);
      } else {
        setSaveState('idle');
        console.error('Failed to save merch settings');
      }
    } catch (error) {
      console.error('Error saving merch settings:', error);
      setSaveState('idle');
    }
  };

  const addItem = () => {
    const newItem: MerchItem = {
      id: `merch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: "",
      url: "",
      imageUrl: "",
      price: "",
      isEnabled: true,
      orderIndex: settings.items.length
    };
    setSettings(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
    setEditingItem(newItem);
    setShowAddForm(false);
  };

  const updateItem = (itemId: string, updates: Partial<MerchItem>) => {
    setSettings(prev => ({
      ...prev,
      items: prev.items.map(item =>
        item.id === itemId ? { ...item, ...updates } : item
      )
    }));
  };

  const deleteItem = (itemId: string) => {
    if (confirm('Are you sure you want to delete this merch item?')) {
      setSettings(prev => ({
        ...prev,
        items: prev.items.filter(item => item.id !== itemId)
      }));
      if (editingItem?.id === itemId) {
        setEditingItem(null);
      }
    }
  };

  const toggleItemEnabled = (itemId: string) => {
    updateItem(itemId, {
      isEnabled: !settings.items.find(item => item.id === itemId)?.isEnabled
    });
  };

  const handleDragEnd = (result: { destination?: { index: number } | null; source: { index: number } }) => {
    if (!result.destination) return;

    const items = Array.from(settings.items);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order indices
    const updatedItems = items.map((item, index) => ({
      ...item,
      orderIndex: index
    }));

    setSettings(prev => ({
      ...prev,
      items: updatedItems
    }));
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="merch" className="bg-gray-50 rounded-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Merch Panel Settings</h2>

      {/* General Settings */}
      <div className="space-y-4 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={settings.isEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, isEnabled: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Enable Merch Panel</span>
            </label>
          </div>
          <div>
            <label className="flex items-center space-x-2 mb-4">
              <input
                type="checkbox"
                checked={settings.showPrices}
                onChange={(e) => setSettings(prev => ({ ...prev, showPrices: e.target.checked }))}
                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm font-medium text-gray-700">Show Prices</span>
            </label>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Panel Title</label>
            <input
              type="text"
              value={settings.title}
              onChange={(e) => setSettings(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Check Out My Merch!"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Subtitle (Optional)</label>
            <input
              type="text"
              value={settings.subtitle || ''}
              onChange={(e) => setSettings(prev => ({ ...prev, subtitle: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Support the stream with some awesome gear!"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Layout Style</label>
            <select
              value={settings.layout}
              onChange={(e) => setSettings(prev => ({ ...prev, layout: e.target.value as 'grid' | 'carousel' | 'list' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="grid">Grid</option>
              <option value="carousel">Carousel</option>
              <option value="list">List</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Items to Show</label>
            <input
              type="number"
              min="1"
              max="20"
              value={settings.maxItemsToShow}
              onChange={(e) => setSettings(prev => ({ ...prev, maxItemsToShow: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Merch Items */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Merch Items</h3>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            + Add Item
          </button>
        </div>

        {showAddForm && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
            <p className="text-green-800 text-sm mb-2">Click &quot;Add Item&quot; to create a new merch item that you can then edit.</p>
            <div className="flex space-x-2">
              <button
                onClick={addItem}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Create New Item
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1 bg-gray-300 hover:bg-gray-400 text-gray-700 rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {settings.items.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🛍️</div>
            <p>No merch items yet. Click &quot;Add Item&quot; to get started!</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="merch-items">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                  {settings.items.map((item, index) => (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`bg-white border rounded-lg p-4 transition-shadow ${
                            snapshot.isDragging ? 'shadow-lg' : 'shadow-sm'
                          } ${editingItem?.id === item.id ? 'ring-2 ring-purple-500' : ''}`}
                        >
                          <div className="flex items-start space-x-4">
                            {/* Drag Handle */}
                            <div {...provided.dragHandleProps} className="mt-2 cursor-move text-gray-400 hover:text-gray-600">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-5V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                              </svg>
                            </div>

                            {/* Item Preview */}
                            <div className="flex-1">
                              {editingItem?.id === item.id ? (
                                <div className="space-y-3">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Item Title</label>
                                      <input
                                        type="text"
                                        value={item.title}
                                        onChange={(e) => updateItem(item.id, { title: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="Item name"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                      <input
                                        type="text"
                                        value={item.price}
                                        onChange={(e) => updateItem(item.id, { price: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="$19.99"
                                      />
                                    </div>
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
                                    <input
                                      type="url"
                                      value={item.url}
                                      onChange={(e) => updateItem(item.id, { url: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      placeholder="https://fourthwall.com/..."
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Image URL</label>
                                    <input
                                      type="url"
                                      value={item.imageUrl}
                                      onChange={(e) => updateItem(item.id, { imageUrl: e.target.value })}
                                      className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                      placeholder="https://..."
                                    />
                                  </div>
                                  <div className="flex space-x-2">
                                    <button
                                      onClick={() => setEditingItem(null)}
                                      className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm transition-colors"
                                    >
                                      Done Editing
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-4">
                                  {/* Item Image */}
                                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                    {item.imageUrl ? (
                                      <img
                                        src={item.imageUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iMTA1IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOUI5QkE0IiBmb250LXNpemU9IjE0IiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiPk1lcmNoPC90ZXh0Pgo8L3N2Zz4K';
                                        }}
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                        No Image
                                      </div>
                                    )}
                                  </div>

                                  {/* Item Info */}
                                  <div className="flex-1">
                                    <h4 className="font-medium text-gray-900">{item.title || 'Untitled Item'}</h4>
                                    <p className="text-sm text-gray-600">{item.price || 'No price set'}</p>
                                    <p className="text-xs text-gray-500 truncate">{item.url || 'No URL set'}</p>
                                  </div>

                                  {/* Status Badge */}
                                  <div className="flex items-center space-x-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                      item.isEnabled 
                                        ? 'bg-green-100 text-green-800' 
                                        : 'bg-red-100 text-red-800'
                                    }`}>
                                      {item.isEnabled ? 'Enabled' : 'Disabled'}
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            {editingItem?.id !== item.id && (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => setEditingItem(item)}
                                  className="p-2 text-gray-400 hover:text-purple-600 transition-colors"
                                  title="Edit item"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => toggleItemEnabled(item.id)}
                                  className={`p-2 transition-colors ${
                                    item.isEnabled ? 'text-yellow-600 hover:text-yellow-700' : 'text-green-600 hover:text-green-700'
                                  }`}
                                  title={item.isEnabled ? 'Disable item' : 'Enable item'}
                                >
                                  {item.isEnabled ? (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                    </svg>
                                  ) : (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                  )}
                                </button>
                                <button
                                  onClick={() => deleteItem(item.id)}
                                  className="p-2 text-red-400 hover:text-red-600 transition-colors"
                                  title="Delete item"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={saveState === 'saving'}
        className={`w-full font-bold py-3 px-6 rounded-lg transition-all duration-500 transform ${
          saveState === 'saving' 
            ? 'bg-yellow-500 hover:bg-yellow-600 text-white scale-105' 
            : saveState === 'saved'
            ? 'bg-green-500 hover:bg-green-600 text-white scale-105 shadow-lg'
            : 'bg-purple-600 hover:bg-purple-700 text-white scale-100'
        }`}
      >
        <div className="flex items-center justify-center space-x-2">
          {saveState === 'saving' && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          )}
          {saveState === 'saved' && (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          )}
          <span>
            {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved!' : 'Save Merch Settings'}
          </span>
        </div>
      </button>
    </div>
  );
}
