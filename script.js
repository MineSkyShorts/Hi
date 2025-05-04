// script.js (angepasste Version)
const CLIENT_ID = 'y3vrf3ityxvqv0lchregoululsa305';
const ACCESS_TOKEN = 'yg9crqfcpflu7428gov4y0g44eypko';
const STREAMER_LOGIN = 'zinxlinkk'; // Ändern zu ZinxWinxy wenn verfügbar

// DOM Elemente
const elements = {
    profileImage: document.getElementById('profile-image'),
    streamerName: document.getElementById('streamer-name'),
    statusDot: document.getElementById('status-dot'),
    statusText: document.getElementById('status-text'),
    gameName: document.getElementById('game-name'),
    streamTitle: document.getElementById('stream-title'),
    viewerCount: document.getElementById('viewer-count'),
    followersCount: document.getElementById('followers-count'),
    emotesContainer: document.querySelector('#emotes-container .emotes-grid')
};

let currentViewerCount = 0;
let currentFollowerCount = 0;

const headers = {
    'Client-ID': CLIENT_ID,
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json'
};

async function fetchTwitchData() {
    try {
        const user = await fetchUserData();
        updateProfile(user);
        await fetchFollowers(user.id);
        await checkStreamStatus(user);
        await fetchAllEmotes(user.id, user.login);
    } catch (error) {
        console.error('Error:', error);
        handleError();
    }
}

async function fetchUserData() {
    const response = await fetch(`https://api.twitch.tv/helix/users?login=${STREAMER_LOGIN}`, { headers });
    if (!response.ok) throw new Error(`User API Error: ${response.status}`);
    const data = await response.json();
    return data.data?.[0] || {};
}

function updateProfile(user) {
    if (user.profile_image_url) {
        elements.profileImage.src = user.profile_image_url;
    }
    if (user.display_name) {
        elements.streamerName.textContent = user.display_name;
    }
}

async function fetchFollowers(userId) {
    const response = await fetch(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}&first=1`, { headers });
    if (!response.ok) return;
    
    const data = await response.json();
    const newFollowerCount = data.total || 0;
    updateCounter(elements.followersCount, currentFollowerCount, newFollowerCount);
    currentFollowerCount = newFollowerCount;
}

async function checkStreamStatus(user) {
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${STREAMER_LOGIN}`, { headers });
    if (!response.ok) return;
    
    const data = await response.json();
    if (data.data?.length > 0) {
        const stream = data.data[0];
        updateStreamInfo(true, stream);
    } else {
        updateStreamInfo(false);
    }
}

function updateStreamInfo(isLive, stream = {}) {
    if (isLive) {
        elements.statusDot.className = 'dot online';
        elements.statusText.textContent = 'Live';
        elements.gameName.textContent = stream.game_name || 'Unknown Game';
        elements.streamTitle.textContent = stream.title || 'No Title';
        
        const newViewerCount = stream.viewer_count || 0;
        updateCounter(elements.viewerCount, currentViewerCount, newViewerCount);
        currentViewerCount = newViewerCount;
    } else {
        elements.statusDot.className = 'dot offline';
        elements.statusText.textContent = 'Offline';
        elements.gameName.textContent = 'Not live';
        elements.streamTitle.textContent = 'Stream is offline';
        elements.viewerCount.textContent = '0';
    }
}

function updateCounter(element, oldValue, newValue) {
    if (oldValue === newValue) {
        element.textContent = newValue.toLocaleString();
        return;
    }
    
    element.classList.add(newValue > oldValue ? 'counter-up' : 'counter-down');
    element.textContent = newValue.toLocaleString();
    
    setTimeout(() => {
        element.classList.remove('counter-up', 'counter-down');
    }, 500);
}

// Emote-Funktionen (wie zuvor)
async function fetchAllEmotes(broadcasterId, broadcasterLogin) {
    try {
        elements.emotesContainer.innerHTML = '';
        const [twitchEmotes, seventvEmotes, bttvEmotes, ffzEmotes] = await Promise.all([
            fetchTwitchEmotes(broadcasterId),
            fetch7TVEmotes(broadcasterId),
            fetchBTTVEmotes(broadcasterId),
            fetchFFZEmotes(broadcasterId)
        ]);
        displayEmotes([...twitchEmotes, ...seventvEmotes, ...bttvEmotes, ...ffzEmotes]);
    } catch (error) {
        console.error('Emote Error:', error);
    }
}

// ... (restliche Emote-Funktionen wie zuvor)

function handleError() {
    elements.statusDot.className = 'dot error';
    elements.statusText.textContent = 'Error';
    elements.gameName.textContent = 'Unavailable';
    elements.streamTitle.textContent = 'Error loading data';
}

// Initialisierung
document.addEventListener('DOMContentLoaded', () => {
    fetchTwitchData();
    setInterval(fetchTwitchData, 60000);
    
    // Klick-Events für Game Cards
    document.querySelectorAll('.game-card').forEach(card => {
        card.addEventListener('click', function() {
            window.location.href = this.getAttribute('data-href');
        });
    });
});