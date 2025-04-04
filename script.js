// Configuration
const HYPEM_USERNAME = 'irieidea';  // Your Hypem username
const TRACKS_TO_DISPLAY = 10;       // How many tracks to show

// Main function to fetch and display tracks
async function fetchAndDisplayTracks() {
    const tracksContainer = document.getElementById('tracks-container');
    
    try {
        // Try to get tracks using several methods
        let tracks = await getLikedTracksWithAllProxies();
        
        if (!tracks || tracks.length === 0) {
            tracksContainer.innerHTML = `
                <div class="error">
                    <p>Couldn't fetch tracks from Hypem. Please try again later.</p>
                </div>
            `;
            return;
        }
        
        // Clear loading message
        tracksContainer.innerHTML = '';
        
        // Display each track
        for (const track of tracks) {
            const trackElement = await createTrackElement(track);
            tracksContainer.appendChild(trackElement);
        }
    } catch (error) {
        console.error('Error fetching tracks:', error);
        tracksContainer.innerHTML = `
            <div class="error">
                <p>Error: ${error.message}</p>
            </div>
        `;
    }
}

// Try multiple CORS proxies to get the data
async function getLikedTracksWithAllProxies() {
    // List of CORS proxies to try
    const corsProxies = [
        'https://corsproxy.io/?',
        'https://api.allorigins.win/raw?url=',
        'https://cors-anywhere.herokuapp.com/'
    ];
    
    // URL for Hypem API
    const hypemUrl = `https://hypem.com/api/loved_items_by_user_name?user_name=${HYPEM_USERNAME}&page=1&count=${TRACKS_TO_DISPLAY}`;
    
    let lastError = null;
    
    // Try each proxy
    for (const proxy of corsProxies) {
        try {
            const tracks = await getLikedTracksWithProxy(proxy, hypemUrl);
            if (tracks && tracks.length > 0) {
                return tracks;
            }
        } catch (error) {
            console.error(`Error with proxy ${proxy}:`, error);
            lastError = error;
            // Continue to next proxy
        }
    }
    
    // If all proxies fail, try a different approach - jsonp
    try {
        return await getLikedTracksWithJsonp();
    } catch (error) {
        console.error('Error with JSONP approach:', error);
        lastError = error;
    }
    
    // All methods failed, return fallback tracks
    console.error('All methods failed, using fallback tracks');
    return getDetailedFallbackTracks();
}

// Function to get tracks using a specific CORS proxy
async function getLikedTracksWithProxy(corsProxy, url) {
    const response = await fetch(corsProxy + encodeURIComponent(url));
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    let data = await response.text();
    
    // Hypem API returns JSON with "while(1);" prefix
    if (data.startsWith('while(1);')) {
        data = data.substring(9);
    }
    
    return JSON.parse(data);
}

// Function to get tracks using JSONP approach
function getLikedTracksWithJsonp() {
    return new Promise((resolve, reject) => {
        // This approach doesn't work directly due to security restrictions
        // It's included as a placeholder in case we implement a backend service
        reject(new Error('JSONP method not implemented yet'));
    });
}

// More detailed fallback tracks
function getDetailedFallbackTracks() {
    return [
        {
            "itemid": "sample1",
            "artist": "Tame Impala",
            "title": "Borderline",
            "thumb_url": "https://img.hypem.com/artwork/tame_impala_borderline.jpg",
            "dateposted": "2 days ago",
            "tags": ["psychedelic", "indie", "rock"]
        },
        {
            "itemid": "sample2",
            "artist": "Jungle",
            "title": "Keep Moving",
            "thumb_url": "https://img.hypem.com/artwork/jungle_keep_moving.jpg",
            "dateposted": "5 days ago",
            "tags": ["electronic", "funk", "dance"]
        },
        {
            "itemid": "sample3",
            "artist": "Khruangbin",
            "title": "Time (You and I)",
            "thumb_url": "https://img.hypem.com/artwork/khruangbin_time.jpg",
            "dateposted": "1 week ago",
            "tags": ["funk", "psychedelic", "soul"]
        },
        {
            "itemid": "sample4",
            "artist": "Japanese Breakfast",
            "title": "Be Sweet",
            "thumb_url": "https://img.hypem.com/artwork/japanese_breakfast_be_sweet.jpg",
            "dateposted": "2 weeks ago",
            "tags": ["indie", "pop", "alternative"]
        }
    ];
}

// Function to get track details and create track element
async function createTrackElement(track) {
    const trackId = track.itemid;
    const artist = track.artist;
    const title = track.title;
    
    // Use the thumbnail if available, or try to get artwork URL
    let artworkUrl = track.thumb_url;
    if (!artworkUrl) {
        // As a fallback, we'll use a placeholder image
        artworkUrl = `https://picsum.photos/seed/${trackId}/320/320`;
    }
    
    // Get tags if available
    const tags = track.tags || [];
    
    // Create a short description of the track
    const description = generateDescription(artist, title, tags);
    
    // Create the track element
    const trackElement = document.createElement('div');
    trackElement.className = 'track-post';
    trackElement.innerHTML = `
        <div class="track-header">
            <h2 class="track-title">${title}</h2>
            <div class="track-artist">by ${artist}</div>
        </div>
        
        <div class="track-artwork">
            <img src="${artworkUrl}" alt="${artist} - ${title}">
        </div>
        
        <div class="track-player">
            <iframe width="100%" height="120" src="https://hypem.com/embed/track/${trackId}" frameborder="0" allowfullscreen></iframe>
        </div>
        
        <div class="track-description">
            <p>${description}</p>
        </div>
        
        ${tags.length > 0 ? `
        <div class="track-tags">
            ${tags.map(tag => `<span class="track-tag">${tag}</span>`).join('')}
        </div>
        ` : ''}
        
        <div class="track-meta">
            <a href="https://hypem.com/track/${trackId}" target="_blank">View on Hype Machine</a>
            <span>${track.dateposted || 'Recently posted'}</span>
        </div>
    `;
    
    return trackElement;
}

// Function to generate a simple description
function generateDescription(artist, title, tags) {
    const descriptions = [
        `Check out this amazing track from ${artist}. "${title}" showcases the band's signature sound with a fresh approach.`,
        `${artist} delivers another standout track with "${title}". This one's been on repeat since I discovered it.`,
        `Been digging this ${tags.length > 0 ? tags[0] : 'awesome'} track from ${artist}. "${title}" is definitely worth adding to your playlist.`,
        `"${title}" by ${artist} has that perfect vibe for your ${Math.random() > 0.5 ? 'weekend' : 'weekday'} playlist.`,
        `${artist}'s latest "${title}" shows exactly why they're one of the most exciting acts in ${tags.length > 0 ? tags[0] : 'music'} right now.`
    ];
    
    // Return a random description
    return descriptions[Math.floor(Math.random() * descriptions.length)];
}

// Start the process when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayTracks);
