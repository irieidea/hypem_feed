// Configuration
const HYPEM_USERNAME = 'irieidea';  // Your Hypem username
const TRACKS_TO_DISPLAY = 10;       // How many tracks to show

// Main function to fetch and display tracks
async function fetchAndDisplayTracks() {
    const tracksContainer = document.getElementById('tracks-container');
    
    try {
        // First try to get tracks from our proxy service (to avoid CORS issues)
        const tracks = await getLikedTracks();
        
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

// Function to get liked tracks from Hypem
async function getLikedTracks() {
    // Try fetching through a CORS proxy
    const corsProxy = 'https://corsproxy.io/?';
    const hypemUrl = `https://hypem.com/api/loved_items_by_user_name?user_name=${HYPEM_USERNAME}&page=1&count=${TRACKS_TO_DISPLAY}`;
    
    try {
        const response = await fetch(corsProxy + encodeURIComponent(hypemUrl));
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        let data = await response.text();
        
        // Hypem API returns JSON with "while(1);" prefix
        if (data.startsWith('while(1);')) {
            data = data.substring(9);
        }
        
        return JSON.parse(data);
    } catch (error) {
        console.error('Error fetching from Hypem API:', error);
        
        // Fall back to static data if we can't connect to Hypem
        return getFallbackTracks();
    }
}

// Fallback tracks in case API fails
function getFallbackTracks() {
    // Return a few sample tracks as fallback
    return [
        {
            "itemid": "sample1",
            "artist": "Sample Artist",
            "title": "Sample Track",
            "dateposted": "2 days ago"
        },
        {
            "itemid": "sample2",
            "artist": "Another Artist",
            "title": "Another Track",
            "dateposted": "5 days ago"
        }
    ];
}

// Function to get track details and create track element
async function createTrackElement(track) {
    const trackId = track.itemid;
    const artist = track.artist;
    const title = track.title;
    let artworkUrl = null;
    
    // Try to get artwork URL if not provided in the initial data
    if (!track.thumb_url) {
        artworkUrl = await getArtworkUrl(trackId);
    } else {
        artworkUrl = track.thumb_url;
    }
    
    // Create the track element
    const trackElement = document.createElement('div');
    trackElement.className = 'track-post';
    trackElement.innerHTML = `
        <div class="track-header">
            <h2 class="track-title">${title}</h2>
            <div class="track-artist">by ${artist}</div>
        </div>
        
        ${artworkUrl ? `
        <div class="track-artwork">
            <img src="${artworkUrl}" alt="${artist} - ${title}">
        </div>
        ` : ''}
        
        <div class="track-player">
            <iframe width="100%" height="120" src="https://hypem.com/embed/track/${trackId}" frameborder="0" allowfullscreen></iframe>
        </div>
        
        <div class="track-meta">
            <a href="https://hypem.com/track/${trackId}" target="_blank">View on Hype Machine</a>
            <span>${track.dateposted || 'Recently posted'}</span>
        </div>
    `;
    
    return trackElement;
}

// Function to get artwork URL for a track
async function getArtworkUrl(trackId) {
    // Since we may not be able to scrape the Hypem page directly due to CORS,
    // we'll use a default image or return null
    return null;
}

// Start the process when the page loads
document.addEventListener('DOMContentLoaded', fetchAndDisplayTracks);
