// Jollibee Login App - Single Page Application

// Configuration
const CONFIG = {
    API_URL: 'https://dummyjson.com/auth/login',
    TOKEN_KEY: 'accessToken',
    TOKEN_EXPIRY: 30,
    PLACEHOLDER_IMAGE: 'https://via.placeholder.com/150/ef4444/ffffff'
};

// API Service
const API = {
    async checkUserExists(username) {
        const response = await fetch(`https://dummyjson.com/users/search?q=${username}`);
        if (!response.ok) return false;
        
        const data = await response.json();
        return data.users.some(user => user.username === username);
    },

    async login(username, password) {
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                username, 
                password, 
                expiresInMins: CONFIG.TOKEN_EXPIRY 
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return response.json();
    }
};

// DOM Helper
const getElement = (id) => document.getElementById(id);

// UI Management
const UI = {
    showError(message) {
        const errorText = getElement('errorText');
        const errorMessage = getElement('errorMessage');
        if (errorText) errorText.textContent = message;
        if (errorMessage) errorMessage.classList.remove('hidden');
    },
    
    hideError() {
        const errorMessage = getElement('errorMessage');
        if (errorMessage) errorMessage.classList.add('hidden');
    },
    
    showLoading() {
        const loginButton = getElement('loginButton');
        const buttonText = getElement('buttonText');
        const loadingSpinner = getElement('loadingSpinner');
        
        if (loginButton) loginButton.disabled = true;
        if (buttonText) buttonText.classList.add('hidden');
        if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    },
    
    hideLoading() {
        const loginButton = getElement('loginButton');
        const buttonText = getElement('buttonText');
        const loadingSpinner = getElement('loadingSpinner');
        
        if (loginButton) loginButton.disabled = false;
        if (buttonText) buttonText.classList.remove('hidden');
        if (loadingSpinner) loadingSpinner.classList.add('hidden');
    },

    showProfile(userData) {
        const { firstName, lastName, email, image } = userData;
        
        // Update profile elements
        const profileImage = getElement('profileImage');
        const userName = getElement('userName');
        const userEmail = getElement('userEmail');
        const firstNameEl = getElement('firstName');
        const lastNameEl = getElement('lastName');
        const profileEmail = getElement('profileEmail');
        
        if (profileImage) profileImage.src = image || `${CONFIG.PLACEHOLDER_IMAGE}?text=${firstName?.charAt(0) || 'U'}`;
        if (userName) userName.textContent = `${firstName} ${lastName}`;
        if (userEmail) userEmail.textContent = email;
        if (firstNameEl) firstNameEl.textContent = firstName;
        if (lastNameEl) lastNameEl.textContent = lastName;
        if (profileEmail) profileEmail.textContent = email;
        
        // Update left sidebar content
        const leftHeading = getElement('leftHeadingProfile');
        const leftDescription = getElement('leftDescriptionProfile');
        const leftLogoText = getElement('leftLogoTextProfile');
        
        if (leftHeading) leftHeading.textContent = 'Mabuhay!';
        if (leftDescription) leftDescription.textContent = 'You have successfully logged in to your Jollibee account. Enjoy your favorite meals and discover new flavors!';
        if (leftLogoText) leftLogoText.textContent = 'jolibi';
        
        // Update right section heading
        const rightHeading = getElement('rightHeading');
        if (rightHeading) rightHeading.textContent = 'Profile';
        
        // Setup logout button
        const logoutButton = getElement('logoutButton');
        if (logoutButton) {
            logoutButton.addEventListener('click', this.showLogin);
        }
        
        // Switch views
        const loginContainer = getElement('loginContainer');
        const profileContainer = getElement('profileContainer');
        
        if (loginContainer) loginContainer.classList.add('hidden');
        if (profileContainer) profileContainer.classList.remove('hidden');
    },
    
    showLogin() {
        localStorage.removeItem(CONFIG.TOKEN_KEY);
        
        // Reset left sidebar content
        const leftHeading = getElement('leftHeading');
        const leftDescription = getElement('leftDescription');
        
        if (leftHeading) leftHeading.textContent = 'Bida ang saya!';
        if (leftDescription) leftDescription.textContent = 'Mula sa unang kagat ng Chickenjoy hanggang sa tamis ng Jolly Spaghetti, bawat bisita ay nadadala sa mundo ng saya at ligaya. Dito sa Jollibee, bawat pagkain ay kwento, bawat tawa ay espesyal, at bawat sandali ay puno ng kasiyahan. Halina\'t maranasan ang saya na hatid ng paboritong bida ng bawat pamilya—Jollibee!';
        
        // Reset right section heading
        const rightHeading = getElement('rightHeading');
        if (rightHeading) rightHeading.textContent = 'Welcome Back';
        
        const profileContainer = getElement('profileContainer');
        const loginContainer = getElement('loginContainer');
        const loginForm = getElement('loginForm');
        
        if (profileContainer) profileContainer.classList.add('hidden');
        if (loginContainer) loginContainer.classList.remove('hidden');
        if (loginForm) loginForm.reset();
        
        this.hideError();
    }
};

// Authentication
const Auth = {
    async login(username, password) {
        try {
            UI.showLoading();
            UI.hideError();

            // First check if username exists
            const userExists = await API.checkUserExists(username);
            if (!userExists) {
                UI.showError('Invalid credentials. Please try again.');
                return;
            }

            // If user exists, try to login
            const data = await API.login(username, password);

            if (data.accessToken) {
                localStorage.setItem(CONFIG.TOKEN_KEY, data.accessToken);
                UI.showProfile(data);
            } else {
                UI.showError('Incorrect password. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            if (error.message.includes('HTTP error! status: 400')) {
                UI.showError('Incorrect password. Please try again.');
            } else if (error.message.includes('HTTP error')) {
                UI.showError('Network error. Please check your connection.');
            } else {
                UI.showError('Login failed. Please try again.');
            }
        } finally {
            UI.hideLoading();
        }
    }
};

// Event Handlers
const Events = {
    init() {
        const loginForm = getElement('loginForm');
        
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin);
            
            // Hide error on input
            ['username', 'password'].forEach(id => {
                const input = getElement(id);
                if (input) {
                    input.addEventListener('input', UI.hideError);
                }
            });
        }
    },

    async handleLogin(e) {
        e.preventDefault();
        
        const username = getElement('username')?.value?.trim();
        const password = getElement('password')?.value;

        if (!username || !password) {
            UI.showError('Please fill in all fields.');
            return;
        }

        if (password.length < 6) {
            UI.showError('Password must be at least 6 characters long.');
            return;
        }

        await Auth.login(username, password);
    }
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    Events.init();
    
    // Initialize left sidebar content
    const leftHeading = getElement('leftHeading');
    const leftDescription = getElement('leftDescription');
    const leftLogoText = getElement('leftLogoText');
    const mobileLogoText = getElement('mobileLogoText');
    
    if (leftHeading) leftHeading.textContent = 'Bida ang saya!';
    if (leftDescription) leftDescription.textContent = 'Mula sa unang kagat ng Chickenjoy hanggang sa tamis ng Jolly Spaghetti, bawat bisita ay nadadala sa mundo ng saya at ligaya. Dito sa Jollibee, bawat pagkain ay kwento, bawat tawa ay espesyal, at bawat sandali ay puno ng kasiyahan. Halina\'t maranasan ang saya na hatid ng paboritong bida ng bawat pamilya—Jollibee!';
    if (leftLogoText) leftLogoText.textContent = 'jolibi';
    if (mobileLogoText) mobileLogoText.textContent = 'jolibi';
});