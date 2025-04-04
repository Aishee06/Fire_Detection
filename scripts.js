// Store registered users
const registeredUsers = JSON.parse(localStorage.getItem('registeredUsers') || '[]');

// System variables
let cameraStream = null;
let detectionActive = false;
let systemActive = false;
let alertCount = 0;
let detectionInterval = null;
let fakeDetectionTimeout = null;

function saveRegisteredUsers() {
    localStorage.setItem('registeredUsers', JSON.stringify(registeredUsers));
}

function showNotification(message, isError = false) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.style.backgroundColor = isError ? '#ff3b30' : '#4CAF50';
    notification.style.display = 'block';
    
    // Hide notification after 5 seconds
    setTimeout(() => {
        notification.style.display = 'none';
    }, 5000);
}

// Authentication Functions
function showSignup() {
    document.getElementById("welcome-page").style.display = "none";
    document.getElementById("signup-page").style.display = "block";
}

function showLogin() {
    document.getElementById("welcome-page").style.display = "none";
    document.getElementById("login-page").style.display = "block";
}

function goBack() {
    document.getElementById("signup-page").style.display = "none";
    document.getElementById("login-page").style.display = "none";
    document.getElementById("welcome-page").style.display = "block";
}

function submitSignup() {
    const userName = document.getElementById("name").value;
    const userEmail = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    if (!userName || !userEmail || !password) {
        showNotification("Please fill in all fields", true);
        return;
    }
    
    // Check if user already exists
    const userExists = registeredUsers.some(user => user.email === userEmail);
    if (userExists) {
        showNotification("Account already exists. Please login instead.", true);
        setTimeout(() => {
            goBack();
        }, 1500);
        return;
    }
    
    // Add new user
    registeredUsers.push({
        name: userName,
        email: userEmail,
        password: password
    });
    
    // Save users to localStorage
    saveRegisteredUsers();
    
    showNotification("Account created successfully!");
    setTimeout(() => {
        goBack();
    }, 1500);
}

function submitLogin() {
    const userEmail = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    if (!userEmail || !password) {
        showNotification("Please fill in all fields", true);
        return;
    }
    
    // Find the user by email
    const user = registeredUsers.find(u => u.email === userEmail);
    
    if (!user) {
        showNotification("Account doesn't exist. Please sign up first.", true);
        return;
    }
    
    if (user.password !== password) {
        showNotification("Incorrect password. Please try again.", true);
        return;
    }
    
    // Login successful
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("auth-container").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    
    // Save user session
    saveUserSession(user);
    
    showNotification("Login successful!");
}

// Camera and Detection Functions
async function startCamera() {
    try {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                facingMode: 'environment'
            }
        };
        
        // Get camera stream
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        // Set the video source
        const videoElement = document.getElementById('camera-video');
        videoElement.srcObject = cameraStream;
        
        // Hide the "no access" message
        document.getElementById('no-camera-access').style.display = 'none';
        
        // Update UI elements
        document.getElementById('camera-status-dot').style.backgroundColor = '#4CAF50';
        document.getElementById('camera-status-text').textContent = 'Connected';
        document.getElementById('live-badge').textContent = 'LIVE';
        document.getElementById('live-badge').style.color = '#4CAF50';
        
        // Update active cameras count
        document.getElementById('active-cameras').textContent = '1/1';
        
        showNotification('Camera started successfully!');
    } catch (err) {
        console.error('Error accessing camera:', err);
        showNotification('Failed to access camera. Please check permissions.', true);
    }
}

function stopCamera() {
    if (cameraStream) {
        // Stop all tracks
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
        
        // Reset video element
        const videoElement = document.getElementById('camera-video');
        videoElement.srcObject = null;
        
        // Show the "no access" message
        document.getElementById('no-camera-access').style.display = 'flex';
        
        // Update UI elements
        document.getElementById('camera-status-dot').style.backgroundColor = '#ff0000';
        document.getElementById('camera-status-text').textContent = 'Not Connected';
        document.getElementById('live-badge').textContent = 'NOT ACTIVE';
        document.getElementById('live-badge').style.color = '#ff0000';
        
        // Update active cameras count
        document.getElementById('active-cameras').textContent = '0/1';
    }
}

function toggleDetection() {
    if (!cameraStream) {
        showNotification('Please start the camera first', true);
        return;
    }
    
    if (detectionActive) {
        stopDetection();
    } else {
        startDetection();
    }
}

function startDetection() {
    if (!detectionActive && cameraStream) {
        detectionActive = true;
        
        // Update button text and style
        const detectionBtn = document.getElementById('toggle-detection');
        detectionBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Stop Detection';
        detectionBtn.classList.add('active');
        
        // Start the detection process (simulation)
        detectionInterval = setInterval(() => {
            // Simulate random detection events (this would be replaced by actual ML detection)
            if (Math.random() < 0.02) { // 2% chance of detecting fire in each interval
                detectFire();
            }
        }, 2000);
        
        showNotification('Fire detection started');
    }
}

function stopDetection() {
    if (detectionActive) {
        detectionActive = false;
        
        // Update button text and style
        const detectionBtn = document.getElementById('toggle-detection');
        detectionBtn.innerHTML = '<i class="fas fa-eye"></i> Start Detection';
        detectionBtn.classList.remove('active');
        
        // Stop detection interval
        if (detectionInterval) {
            clearInterval(detectionInterval);
            detectionInterval = null;
        }
        
        // Hide fire alert if showing
        document.getElementById('fire-alert').style.display = 'none';
        
        // Clear any detection boxes
        document.getElementById('detection-overlay').innerHTML = '';
        
        // Clear any pending detection timeouts
        if (fakeDetectionTimeout) {
            clearTimeout(fakeDetectionTimeout);
            fakeDetectionTimeout = null;
        }
        
        showNotification('Fire detection stopped');
    }
}

function detectFire() {
    if (!detectionActive) return;
    
    // Show the fire alert
    const fireAlert = document.getElementById('fire-alert');
    fireAlert.style.display = 'block';
    
    // Create a detection box at a random position
    const overlay = document.getElementById('detection-overlay');
    const detectionBox = document.createElement('div');
    detectionBox.className = 'detection-box';
    
    // Random position (would be determined by actual detection in a real system)
    const x = Math.floor(Math.random() * 60) + 20; // 20-80% of width
    const y = Math.floor(Math.random() * 60) + 20; // 20-80% of height
    const width = Math.floor(Math.random() * 20) + 10; // 10-30% of width
    const height = Math.floor(Math.random() * 20) + 10; // 10-30% of height
    
    detectionBox.style.left = `${x}%`;
    detectionBox.style.top = `${y}%`;
    detectionBox.style.width = `${width}%`;
    detectionBox.style.height = `${height}%`;
    
    // Add label
    const label = document.createElement('div');
    label.className = 'detection-label';
    label.textContent = 'FIRE';
    detectionBox.appendChild(label);
    
    overlay.appendChild(detectionBox);
    
    // Add an alert to the alerts list
    addFireAlert();
    
    // Clear the detection after a few seconds
    fakeDetectionTimeout = setTimeout(() => {
        fireAlert.style.display = 'none';
        detectionBox.remove();
    }, 5000);
}

function addFireAlert() {
    const alertsList = document.getElementById('alerts-list');
    const newAlert = document.createElement('div');
    newAlert.className = 'alert-item';
    
    // Get current time
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    const dateString = now.toLocaleDateString();
    
    // Increment alert count
    alertCount++;
    document.getElementById('alert-count').textContent = alertCount;
    
    // Create alert content
    newAlert.innerHTML = `
        <div class="alert-title">
            <i class="fas fa-fire-alt alert-icon" style="color: #ff512f;"></i>
            Fire Detected
        </div>
        <div class="alert-meta">
            <div class="alert-meta-item">
                <i class="fas fa-calendar"></i>
                <span>${dateString}</span>
            </div>
            <div class="alert-meta-item">
                <i class="fas fa-clock"></i>
                <span>${timeString}</span>
            </div>
            <div class="alert-meta-item">
                <i class="fas fa-video"></i>
                <span>Main Camera</span>
            </div>
        </div>
    `;
    
    // Add to the beginning of the list
    if (alertsList.firstChild) {
        alertsList.insertBefore(newAlert, alertsList.firstChild);
    } else {
        alertsList.appendChild(newAlert);
    }
    
    // Show notification
    showNotification('ALERT: Fire detected!', true);
}

function takeSnapshot() {
    if (!cameraStream) {
        showNotification('Please start the camera first', true);
        return;
    }
    
    const video = document.getElementById('camera-video');
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Draw the current video frame
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Convert to image data URL
    const imageDataUrl = canvas.toDataURL('image/png');
    
    // Create a temporary link to download the image
    const link = document.createElement('a');
    link.href = imageDataUrl;
    link.download = `firefly-snapshot-${new Date().toISOString().replace(/:/g, '-')}.png`;
    link.click();
    
    showNotification('Snapshot saved');
}

function toggleSystemStatus() {
    systemActive = !systemActive;
    
    // Update system status indicator
    const statusDot = document.getElementById('system-status-dot');
    const statusText = document.getElementById('system-status-text');
    const toggleBtn = document.getElementById('detection-toggle-btn');
    
    if (systemActive) {
        statusDot.style.backgroundColor = '#4CAF50';
        statusText.textContent = 'ACTIVE';
        toggleBtn.innerHTML = '<i class="fas fa-power-off"></i><span>Stop Detection</span>';
        
        // Auto-start camera if not already started
        if (!cameraStream) {
            startCamera();
        }
        
        // Auto-start detection if camera is active
        if (cameraStream && !detectionActive) {
            startDetection();
        }
    } else {
        statusDot.style.backgroundColor = '#ff0000';
        statusText.textContent = 'INACTIVE';
        toggleBtn.innerHTML = '<i class="fas fa-power-off"></i><span>Start Detection</span>';
        
        // Stop detection if active
        if (detectionActive) {
            stopDetection();
        }
    }
}

function testAlert() {
    // Simulate a fire detection event
    if (cameraStream) {
        detectFire();
        showNotification('Test alert triggered');
    } else {
        showNotification('Please start the camera first', true);
    }
}

function exportLogs() {
    // Create a text log with all alerts
    const alerts = document.querySelectorAll('.alert-item');
    let logText = "Firefly Detection System - Export Log\n";
    logText += "Generated: " + new Date().toLocaleString() + "\n\n";
    logText += "Total Alerts: " + alerts.length + "\n\n";
    
    alerts.forEach((alert, index) => {
        const title = alert.querySelector('.alert-title').textContent.trim();
        const meta = alert.querySelectorAll('.alert-meta-item');
        
        logText += `Alert #${index + 1}: ${title}\n`;
        meta.forEach(item => {
            logText += `- ${item.textContent.trim()}\n`;
        });
        logText += "\n";
    });
    
    // Create a blob with the log text
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    // Create a link to download the log
    const link = document.createElement('a');
    link.href = url;
    link.download = `firefly-logs-${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    
    showNotification('Logs exported successfully');
}

function showSettings() {
    // For now, just show a notification
    showNotification('Settings feature will be available in the next update');
}

// Initialize the user dropdown functionality
document.addEventListener('DOMContentLoaded', function() {
    // Toggle user dropdown
    const userProfile = document.querySelector('.user-profile');
    const userDropdown = document.getElementById('user-dropdown');
    
    userProfile.addEventListener('click', function(e) {
        userDropdown.classList.toggle('show-dropdown');
        e.stopPropagation();
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function() {
        userDropdown.classList.remove('show-dropdown');
    });
    
    // Navigation menu functionality
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.dashboard-page');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(navItem => navItem.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Hide all pages
            pages.forEach(page => page.style.display = 'none');
            
            // Show the corresponding page
            const pageName = this.getAttribute('data-page');
            document.getElementById(pageName).style.display = 'block';
        });
    });
    
    // Check if user is logged in (if there's data in localStorage)
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        const userData = JSON.parse(currentUser);
        document.getElementById("user-name").textContent = userData.name;
        document.getElementById("auth-container").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
    }
    
    // Initialize backend connection
    initializeBackend();
});

// Function to handle backend communication
function initializeBackend() {
    // Simulating backend connection status
    console.log("Connecting to backend services...");
    
    // Mock API endpoints for a real implementation:
    const API_ENDPOINTS = {
        FIRE_DETECTION: '/api/detection',
        ALERTS: '/api/alerts',
        SYSTEM_STATUS: '/api/system/status',
        USER_AUTH: '/api/auth'
    };
    
    // In a real implementation, this would make actual API calls
    setTimeout(() => {
        console.log("Backend services connected");
        // You could fetch initial data here, such as:
        // - Existing alerts
        // - System status
        // - User configuration
    }, 1000);
}

// Handle login on page load or refresh (keeping user session)
function checkExistingSession() {
    const sessionData = localStorage.getItem('currentUser');
    if (sessionData) {
        const userData = JSON.parse(sessionData);
        document.getElementById("user-name").textContent = userData.name;
        document.getElementById("auth-container").style.display = "none";
        document.getElementById("dashboard").style.display = "block";
    }
}

// Save current user session when logging in
function saveUserSession(userData) {
    localStorage.setItem('currentUser', JSON.stringify(userData));
}

// Update the login function to save session
function submitLogin() {
    const userEmail = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    
    if (!userEmail || !password) {
        showNotification("Please fill in all fields", true);
        return;
    }
    
    // Find the user by email
    const user = registeredUsers.find(u => u.email === userEmail);
    
    if (!user) {
        showNotification("Account doesn't exist. Please sign up first.", true);
        return;
    }
    
    if (user.password !== password) {
        showNotification("Incorrect password. Please try again.", true);
        return;
    }
    
    // Login successful
    document.getElementById("user-name").textContent = user.name;
    document.getElementById("auth-container").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    
    // Save user session
    saveUserSession(user);
    
    showNotification("Login successful!");
}

// Update logout to clear session
function logout() {
    // Stop camera if active
    stopCamera();
    
    // Stop detection if active
    stopDetection();
    
    // Reset the dashboard
    document.getElementById("dashboard").style.display = "none";
    document.getElementById("auth-container").style.display = "flex";
    document.getElementById("welcome-page").style.display = "block";
    document.getElementById("signup-page").style.display = "none";
    document.getElementById("login-page").style.display = "none";
    document.getElementById("user-dropdown").classList.remove("show-dropdown");
    
    // Clear user session
    localStorage.removeItem('currentUser');
    
    showNotification("Logged out successfully!");
}

// Call this function when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Other initialization code here...
    
    // Check for existing session
    checkExistingSession();
});