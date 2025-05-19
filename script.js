document.addEventListener('DOMContentLoaded', function() {
    // Load repository data
    fetch('Gcuore.json')
        .then(response => response.json())
        .then(data => {
            // Initialize the repository
            initRepository(data);
        })
        .catch(error => {
            console.error('Error loading repository data:', error);
            document.getElementById('apps-grid').innerHTML = `
                <div class="error-message">
                    <p>Error loading repository data. Please try again later.</p>
                </div>
            `;
        });

    // Add event listeners
    document.getElementById('add-repo-btn').addEventListener('click', function() {
        addToAltStore();
    });

    // Close modal when clicking the X
    document.querySelector('.close-modal').addEventListener('click', function() {
        document.getElementById('app-modal').style.display = 'none';
    });

    // Close modal when clicking outside of it
    window.addEventListener('click', function(event) {
        if (event.target === document.getElementById('app-modal')) {
            document.getElementById('app-modal').style.display = 'none';
        }
    });
});

function initRepository(repoData) {
    // Set repository theme color
    document.documentElement.style.setProperty('--primary-color', repoData.tintColor || '#56e2b2');
    document.documentElement.style.setProperty('--secondary-color', adjustColor(repoData.tintColor || '#56e2b2', -20));

    // Generate QR code for the repository
    generateQRCode(window.location.href);

    // Populate apps
    const appsGrid = document.getElementById('apps-grid');
    if (repoData.apps && repoData.apps.length > 0) {
        repoData.apps.forEach(app => {
            const appCard = createAppCard(app);
            appsGrid.appendChild(appCard);
        });
    } else {
        appsGrid.innerHTML = '<p>No apps available in this repository.</p>';
    }
}

function createAppCard(app) {
    const latestVersion = app.versions && app.versions.length > 0 ? app.versions[0] : null;
    
    const appCard = document.createElement('div');
    appCard.className = 'app-card';
    appCard.innerHTML = `
        <div class="app-header">
            <img src="${app.iconURL}" alt="${app.name}" class="app-icon">
            <div class="app-info">
                <h3>${app.name}</h3>
                <p class="app-developer">${app.developerName || 'Unknown Developer'}</p>
            </div>
        </div>
        <div class="app-body">
            <p class="app-subtitle">${app.subtitle || ''}</p>
            <p class="app-description">${app.localizedDescription || 'No description available.'}</p>
            ${latestVersion ? `
                <div class="app-version">
                    <span>Version ${latestVersion.version || 'Unknown'}</span>
                    <span>${formatDate(latestVersion.date)}</span>
                </div>
            ` : ''}
            <span class="app-category">${app.category || 'Uncategorized'}</span>
        </div>
    `;

    // Add click event to open modal with app details
    appCard.addEventListener('click', function() {
        showAppDetails(app);
    });

    return appCard;
}

function showAppDetails(app) {
    const latestVersion = app.versions && app.versions.length > 0 ? app.versions[0] : null;
    
    const modalContent = document.getElementById('modal-content-container');
    modalContent.innerHTML = `
        <div class="app-detail-header">
            <img src="${app.iconURL}" alt="${app.name}" class="app-detail-icon">
            <div class="app-detail-info">
                <h2>${app.name}</h2>
                <p class="app-detail-developer">${app.developerName || 'Unknown Developer'}</p>
                <span class="app-detail-category">${app.category || 'Uncategorized'}</span>
            </div>
        </div>
        <div class="app-detail-body">
            <div class="app-detail-description">
                ${app.localizedDescription || 'No description available.'}
            </div>
            
            ${latestVersion ? `
                <div class="app-detail-version">
                    <div class="version-header">
                        <span class="version-number">Version ${latestVersion.version || 'Unknown'}</span>
                        <span class="version-date">${formatDate(latestVersion.date)}</span>
                    </div>
                    <p class="version-notes">${latestVersion.localizedDescription || 'No release notes available.'}</p>
                    <a href="${latestVersion.downloadURL}" class="download-btn" target="_blank">Download IPA (${formatFileSize(latestVersion.size)})</a>
                </div>
            ` : '<p>No version information available.</p>'}
            
            ${app.appPermissions && Object.keys(app.appPermissions.privacy || {}).length > 0 ? `
                <div class="app-permissions">
                    <h3 class="permissions-title">App Permissions</h3>
                    <div class="permissions-list">
                        ${Object.entries(app.appPermissions.privacy).map(([key, value]) => `
                            <div class="permission-item">
                                <div class="permission-name">${formatPermissionName(key)}</div>
                                <div class="permission-description">${value}</div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('app-modal').style.display = 'block';
}

function addToAltStore() {
    // Create the AltStore URL
    const altStoreURL = `altstore://source?url=${encodeURIComponent(window.location.href)}`;
    
    // Try to open AltStore
    window.location.href = altStoreURL;
    
    // Show a message after a short delay
    setTimeout(() => {
        alert("If AltStore didn't open, make sure it's installed on your device and try again. You can also manually add this repository by copying the URL and adding it in AltStore.");
    }, 1000);
}

function generateQRCode(url) {
    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = '';
    
    new QRCode(qrContainer, {
        text: url,
        width: 128,
        height: 128,
        colorDark: "#000000",
        colorLight: "#ffffff",
        correctLevel: QRCode.CorrectLevel.H
    });
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'Unknown date';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    } catch (e) {
        return 'Unknown date';
    }
}

function formatFileSize(bytes) {
    if (!bytes || isNaN(bytes)) return 'Unknown size';
    
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function formatPermissionName(key) {
    // Remove the 'NS' prefix and add spaces before capital letters
    return key.replace('NS', '')
        .replace(/([A-Z])/g, ' $1')
        .trim();
}

function adjustColor(hex, percent) {
    // Validate hex string
    hex = hex.replace(/^\s*#|\s*$/g, '');
    if (hex.length === 3) {
        hex = hex.replace(/(.)/g, '$1$1');
    }
    
    // Convert to RGB
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    // Adjust color
    const adjustR = Math.max(0, Math.min(255, r + percent));
    const adjustG = Math.max(0, Math.min(255, g + percent));
    const adjustB = Math.max(0, Math.min(255, b + percent));
    
    // Convert back to hex
    return '#' + 
        ((1 << 24) + (adjustR << 16) + (adjustG << 8) + adjustB)
        .toString(16).slice(1);
}