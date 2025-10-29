// NASA Space Explorer - Beginner-friendly JavaScript
// --------------------------------------------------
// This script fetches APOD-like data from a JSON feed and displays a gallery.
// When a gallery item is clicked, a modal opens with more details.

// 1) Data source URL (provided)
const apodData = 'https://cdn.jsdelivr.net/gh/GCA-Classroom/apod/data.json';

// Array of fun space facts - We'll pick one at random when the page loads
const spaceFacts = [
	"A day on Venus is longer than its year! Venus takes 243 Earth days to rotate once, but only 225 Earth days to orbit the Sun.",
	"One million Earths could fit inside the Sun! The Sun contains 99.86% of the mass in our solar system.",
	"Neutron stars are so dense that a teaspoon of their material would weigh about 6 billion tons on Earth!",
	"The footprints on the Moon will be there for 100 million years because there's no wind or water to erode them.",
	"There are more stars in the universe than grains of sand on all the beaches on Earth!",
	"Jupiter's moon Ganymede is the largest moon in our solar system and is even bigger than the planet Mercury.",
	"Saturn's rings are made of billions of pieces of ice and rock, some as small as grains of sugar and others as big as houses!",
	"The International Space Station travels at 17,500 miles per hour and orbits Earth every 90 minutes.",
	"A year on Neptune lasts 165 Earth years! That means one season on Neptune lasts over 40 Earth years.",
	"The Milky Way galaxy is on a collision course with the Andromeda galaxy, but they won't collide for another 4 billion years!",
	"On Mars, the sunset appears blue instead of orange because of how dust particles scatter light in the thin atmosphere.",
	"The largest known volcano in our solar system is Olympus Mons on Mars, which is about 3 times taller than Mount Everest!"
];

// Function to display a random space fact
const displayRandomFact = () => {
	// Get a random index from 0 to the length of the array
	const randomIndex = Math.floor(Math.random() * spaceFacts.length);
	
	// Get the fact at that random index
	const randomFact = spaceFacts[randomIndex];
	
	// Display it in the HTML element
	const funFactElement = document.getElementById('funFact');
	if (funFactElement) {
		funFactElement.textContent = randomFact;
	}
};

// Display a random fact when the page loads
displayRandomFact();

// 2) Grab key elements from the page
const getImageBtn = document.getElementById('getImageBtn');
const gallery = document.getElementById('gallery');

// 3) We'll keep the fetched items in memory so we can use them in the modal
let apodItems = [];

// 4) Format YYYY-MM-DD to a friendlier format like "Oct 27, 2025"
// Important: We avoid new Date(YYYY-MM-DD) to prevent timezone shifts.
// We format the string manually so it always matches the JSON date exactly.
const formatDate = (isoDate) => {
	if (typeof isoDate !== 'string') return '';
	const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!match) return isoDate; // fallback to the original string if unexpected
	const [, y, m, d] = match;
	const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	const monthName = months[Math.max(0, Math.min(11, parseInt(m, 10) - 1))];
	const day = String(parseInt(d, 10));
	return `${monthName} ${day}, ${y}`;
};

// 5) Show a loading message while fetching
const showLoading = () => {
	gallery.innerHTML = `
		<div class="placeholder">
			<div class="placeholder-icon">🔄</div>
			<p>Loading space photos…</p>
		</div>
	`;
};

// 6) Render the gallery grid with cards
const renderGallery = (items) => {
	// Build HTML for each item. We handle images and videos differently.
	const cards = items.map((item, index) => {
		const { media_type, title, date } = item;

		// Decide what to show in the card for the visual preview
		let visualHTML = '';

		if (media_type === 'image') {
			// Prefer hdurl for quality in modal; for the grid, a smaller "url" is fine
			const imgSrc = item.url || item.hdurl || '';
			visualHTML = `
				<div class="image-wrapper">
					<img src="${imgSrc}" alt="${title}" loading="lazy" />
				</div>
			`;
		} else if (media_type === 'video') {
			// Use the thumbnail if available; otherwise show a simple link preview
			const thumb = item.thumbnail_url;
			if (thumb) {
				visualHTML = `
					<div class="image-wrapper">
						<img src="${thumb}" alt="${title} (video)" loading="lazy" />
					</div>
				`;
			} else {
				visualHTML = `
					<div class="video-placeholder">
						<p>🎬 Video</p>
						<p><small>Click to open</small></p>
					</div>
				`;
			}
		} else {
			// Fallback if an unknown media type appears
			visualHTML = `
				<div class="video-placeholder">
					<p>Unsupported media</p>
				</div>
			`;
		}

		// Each card has a data-index so we can open the right item in the modal
		return `
			<div class="gallery-item" data-index="${index}" tabindex="0" aria-label="Open details for ${title} (${formatDate(date)})">
				${visualHTML}
				<p><strong>${title}</strong></p>
				<p>${formatDate(date)}</p>
			</div>
		`;
	}).join('');

	// Insert all cards into the gallery container
	gallery.innerHTML = cards;
};

// 7) Create a simple modal in JavaScript (once) and reuse it
let modalOverlay = null;
let modalContent = null;

const ensureModal = () => {
	if (modalOverlay) return; // Already created

	// Create overlay (dark background)
	modalOverlay = document.createElement('div');
	modalOverlay.id = 'modalOverlay';
	modalOverlay.setAttribute('role', 'dialog');
	modalOverlay.setAttribute('aria-modal', 'true');
	modalOverlay.style.display = 'none'; // hidden by default

	// Create modal content box
	modalContent = document.createElement('div');
	modalContent.id = 'modalContent';

	// Close button
	const closeBtn = document.createElement('button');
	closeBtn.textContent = '✖';
	closeBtn.className = 'modal-close-btn';
	closeBtn.addEventListener('click', () => closeModal());

	modalContent.appendChild(closeBtn);

	// Container for dynamic media + text
	const inner = document.createElement('div');
	inner.id = 'modalInner';
	modalContent.appendChild(inner);

	// Close when clicking the overlay background
	modalOverlay.addEventListener('click', (e) => {
		if (e.target === modalOverlay) closeModal();
	});

	modalOverlay.appendChild(modalContent);
	document.body.appendChild(modalOverlay);

	// ESC key closes the modal
	document.addEventListener('keydown', (e) => {
		if (e.key === 'Escape') {
			closeModal();
		}
	});
};

// 8) Open the modal with a specific item
const openModal = (item) => {
	ensureModal();
	const inner = document.getElementById('modalInner');

	const title = item.title || 'Untitled';
	const date = formatDate(item.date || '');
	const explanation = item.explanation || '';

	// Decide what to show in the modal depending on media type
	let mediaHTML = '';
	if (item.media_type === 'image') {
		const bigSrc = item.hdurl || item.url || '';
		mediaHTML = `<img src="${bigSrc}" alt="${title}" />`;
	} else if (item.media_type === 'video') {
		// Try to embed if it's a YouTube/Vimeo embed URL, otherwise provide a link
		if (item.url && item.url.includes('embed')) {
			// Extract video ID from embed URL to create a direct YouTube link
			const videoId = item.url.match(/embed\/([a-zA-Z0-9_-]+)/)?.[1];
			const watchUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : item.url;
			
			mediaHTML = `
				<div class="video-embed">
					<iframe src="${item.url}" title="${title}" frameborder="0" allowfullscreen></iframe>
				</div>
				<p class="video-fallback">
					<small>If the video doesn't load, <a href="${watchUrl}" target="_blank" rel="noopener">watch it on YouTube</a></small>
				</p>
			`;
		} else if (item.url) {
			mediaHTML = `
				<p>
					This is a video. Watch here:
					<a href="${item.url}" target="_blank" rel="noopener">${item.url}</a>
				</p>
			`;
		} else {
			mediaHTML = `<p>Video unavailable.</p>`;
		}
	} else {
		mediaHTML = `<p>Unsupported media type.</p>`;
	}

	// Fill the modal content
	inner.innerHTML = `
		<h2>${title}</h2>
		<p class="modal-date">${date}</p>
		<div class="modal-media">${mediaHTML}</div>
		<p class="modal-explanation">${explanation}</p>
	`;

	// Show the modal
	modalOverlay.style.display = 'flex';
};

// 9) Close modal helper
const closeModal = () => {
	if (modalOverlay) {
		modalOverlay.style.display = 'none';
	}
};

// 10) Fetch data when the button is clicked
const fetchAndRender = async () => {
	// Show a loading message
	showLoading();

	try {
		const res = await fetch(apodData);
		if (!res.ok) {
			throw new Error(`Network error: ${res.status}`);
		}
		const data = await res.json();

		// Ensure we have an array
		if (!Array.isArray(data)) {
			throw new Error('Unexpected data format (expected an array).');
		}

		// Save for modal use, then render
		apodItems = data;
		renderGallery(apodItems);
	} catch (err) {
		// Show a friendly error message
		gallery.innerHTML = `
			<div class="placeholder">
				<div class="placeholder-icon">⚠️</div>
				<p>Sorry, we couldn’t load space photos. Please try again.</p>
				<p><small>${err.message}</small></p>
			</div>
		`;
	}
};

// 11) Set up event listeners
if (getImageBtn) {
	getImageBtn.addEventListener('click', fetchAndRender);
}

// Delegate clicks inside the gallery to open the modal
gallery.addEventListener('click', (e) => {
	// Find the closest card with data-index
	const card = e.target.closest('.gallery-item');
	if (!card) return;
	const index = parseInt(card.getAttribute('data-index'), 10);
	const item = apodItems[index];
	if (item) openModal(item);
});

// Also allow keyboard activation (Enter) on focused cards
gallery.addEventListener('keydown', (e) => {
	if (e.key !== 'Enter') return;
	const card = e.target.closest('.gallery-item');
	if (!card) return;
	const index = parseInt(card.getAttribute('data-index'), 10);
	const item = apodItems[index];
	if (item) openModal(item);
});

// Tip: You could auto-load on page load by calling fetchAndRender() here.
// We’ll wait for the button click to match the project instructions.
