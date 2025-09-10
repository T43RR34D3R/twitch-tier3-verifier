# Twitch Chat Highlighter Browser Extension

A powerful browser extension that allows streamers to highlight Twitch chat messages with a simple click, integrating seamlessly with streaming overlays and OBS.

## ✨ Features

- **Click to Highlight**: Simply click any Twitch chat message to highlight it
- **Real-time Sync**: Highlighted messages sync instantly with your streaming application
- **Visual Feedback**: Beautiful golden styling with star animations for highlighted messages
- **Server Integration**: Connects to your backend API for persistent storage
- **Customizable Settings**: Configure appearance, behavior, and server settings
- **Multi-tab Sync**: Highlights sync across multiple Twitch tabs
- **Session Statistics**: Track highlights and session time

## 🚀 Installation

### For Development

1. Clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the `browser-extension` folder
5. The extension will appear in your browser toolbar

### For Production

1. Download the extension package (.crx file)
2. Open Chrome and go to `chrome://extensions/`
3. Drag and drop the .crx file onto the extensions page

## ⚙️ Configuration

1. Click the extension icon in your browser toolbar
2. Enter your server URL (e.g., `http://localhost:3000`)
3. Enter your Twitch channel name
4. Click "Save Configuration"
5. The extension will test the connection and confirm it's working

## 📖 How to Use

1. **Setup**: Configure the extension with your server details
2. **Visit Twitch**: Go to any Twitch channel page
3. **Start Highlighting**: Click on chat messages to highlight them
4. **See Results**: Highlighted messages appear with golden styling and star icons
5. **Streaming**: Use the highlighted messages in your OBS overlay

## 🎯 Extension Components

### Content Script (`content.js`)
- Detects clicks on Twitch chat messages
- Extracts message data (username, text, badges, etc.)
- Applies visual highlighting with CSS
- Communicates with your backend API

### Popup Interface (`popup.html`)
- Server configuration
- Real-time statistics
- Highlights management
- Settings and preferences

### Background Script (`background.js`)
- Extension lifecycle management
- Message passing between components
- Data persistence with chrome.storage
- Multi-tab synchronization

## 🎨 Visual Elements

### Highlighted Messages
- Golden gradient background
- Left border accent
- Twinkling star icon
- Smooth animations

### Status Indicator
- Shows extension is active
- Purple gradient with pulse animation
- Positioned at top-right of Twitch pages

### Feedback Animations
- Success/error notifications
- Smooth slide-in effects
- Color-coded feedback (green/red)

## 🔧 API Integration

The extension communicates with your backend API:

### Endpoints Used
- `GET /api/highlights/{channel}` - Fetch existing highlights
- `POST /api/highlights/{channel}` - Add new highlight
- `DELETE /api/highlights/{channel}/{id}` - Remove highlight
- `DELETE /api/highlights/{channel}` - Clear all highlights

### Data Format
```json
{
  "id": "unique-message-id",
  "username": "chatter_name",
  "message": "The chat message text",
  "color": "#FF6B6B",
  "badges": ["subscriber", "moderator"],
  "timestamp": 1703123456789
}
```

## ⚡ Performance

- Lightweight: ~200KB total size
- Fast: < 50ms message highlighting
- Efficient: Debounced API calls
- Memory: Auto-cleanup of old highlights

## 🛠️ Development

### File Structure
```
browser-extension/
├── manifest.json          # Extension configuration
├── content.js             # Main content script
├── content-styles.css     # Visual styling
├── popup.html            # Popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── background.js         # Background worker
├── welcome.html          # First-time user guide
└── README.md            # This file
```

### Building
1. Make sure all files are in the `browser-extension` directory
2. Test in Chrome by loading as unpacked extension
3. For distribution, create a .zip file of all extension files

### Testing
1. Load the extension in developer mode
2. Open browser dev tools and check the console for logs
3. Visit a Twitch channel with chat
4. Click on chat messages to test highlighting
5. Check the extension popup for statistics

## 🔒 Permissions

The extension requires these permissions:
- `activeTab` - Access current Twitch tab
- `storage` - Save settings and highlights
- `scripting` - Inject content scripts
- `tabs` - Manage Twitch tabs
- `https://www.twitch.tv/*` - Access Twitch pages
- Your server URL - API communication

## 🐛 Troubleshooting

### Extension Not Working
1. Check if extension is enabled in chrome://extensions/
2. Verify server URL is correct and accessible
3. Ensure Twitch chat is loaded before clicking messages
4. Check browser console for error messages

### Messages Not Highlighting
1. Make sure you're clicking directly on the message text
2. Check that the extension indicator appears on Twitch pages
3. Verify server connection in extension popup
4. Try refreshing the Twitch page

### Server Connection Issues
1. Verify server is running and accessible
2. Check CORS settings on your server
3. Ensure API endpoints match expected format
4. Test server connectivity outside the extension

## 📝 Version History

### v1.0.0
- Initial release
- Basic click-to-highlight functionality
- Server integration
- Visual feedback and animations
- Settings and configuration
- Multi-tab synchronization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 💬 Support

For support, please:
1. Check this README for common issues
2. Look at the browser console for error messages
3. Open an issue on the GitHub repository
4. Contact the development team

## 🎮 Happy Streaming!

Enhance your Twitch streaming experience with powerful chat message highlighting. Click, highlight, and engage with your audience like never before!
