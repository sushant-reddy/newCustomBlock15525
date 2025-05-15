// main.js

// Initialize variables
let sdk;
let currentContent = '';
let lastPrompt = '';
let apiKey = '';
let conversationHistory = [];

// DOM Elements
const promptInput      = document.getElementById('promptInput');
const generateBtn      = document.getElementById('generateBtn');
const applyChangesBtn  = document.getElementById('applyChangesBtn');
const codeOutput       = document.getElementById('codeOutput');
const copyBtn          = document.getElementById('copyBtn');
const statusMessage    = document.getElementById('statusMessage');
const loaderContainer  = document.getElementById('loaderContainer');
const apiKeyModal      = document.getElementById('apiKeyModal');
const apiKeyInput      = document.getElementById('apiKeyInput');
const saveApiKeyBtn    = document.getElementById('saveApiKeyBtn');

// Entry point
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkApiKey();
    initializeBlockSDK(); // always attempt to init SDK on load
});

// Ensure sdk is created if possible
function createSDKInstance() {
    if (!sdk && window.sfdc && window.sfdc.BlockSDK) {
        try {
            sdk = new window.sfdc.BlockSDK();
            console.log('BlockSDK instance created:', sdk);
        } catch (e) {
            console.error('Error creating BlockSDK instance:', e);
        }
    }
}

// Initialize Salesforce Marketing Cloud Block SDK
function initializeBlockSDK() {
    createSDKInstance();

    if (!sdk) {
        displayStatus('SFMC SDK not available. Are you inside Content Builder?', 'error');
        return;
    }

    // Get existing content
    sdk.getContent((content, err) => {
        if (err) {
            console.error('getContent error:', err);
            displayStatus('Failed to load block content', 'error');
            return;
        }
        currentContent = content || '';
        codeOutput.value = currentContent;
    });

    // Get persisted data (apiKey, prompt history, etc.)
    sdk.getData((data, err) => {
        if (err) {
            console.error('getData error:', err);
            return;
        }
        if (data.apiKey)              apiKey = data.apiKey;
        if (data.lastPrompt)          lastPrompt = data.lastPrompt;
        if (data.conversationHistory) conversationHistory = data.conversationHistory;
        if (lastPrompt)               promptInput.value = lastPrompt;
    });
}

// Save API key from modal
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    if (!newApiKey) {
        displayStatus('Please enter a valid API key', 'error');
        return;
    }
    apiKey = newApiKey;
    localStorage.setItem(CONFIG.storage.apiKey, apiKey);

    if (sdk) {
        sdk.setData({ apiKey, lastPrompt, conversationHistory }, err => {
            if (err) console.error('setData error:', err);
        });
    }

    apiKeyModal.style.display = 'none';
    displayStatus('API key saved', 'success');
}

// Handle generate button click
async function handleGenerate() {
    const prompt = promptInput.value.trim();
    if (!prompt) {
        displayStatus('Please enter a prompt', 'error');
        return;
    }
    if (!apiKey) {
        apiKeyModal.style.display = 'flex';
        return;
    }

    showLoader(true);

    try {
        if (conversationHistory.length === 0) {
            conversationHistory = [
                { role: 'system', content: CONFIG.systemPrompt },
                { role: 'user',   content: prompt }
            ];
        } else {
            conversationHistory.push({ role: 'user', content: prompt });
        }

        const response = await callOpenAI(conversationHistory);
        const generatedCode = response.choices[0].message.content;

        codeOutput.value = generatedCode;
        currentContent = generatedCode;
        conversationHistory.push({ role: 'assistant', content: generatedCode });
        lastPrompt = prompt;
        saveDataToSDK();

        displayStatus('Code generated successfully', 'success');
    } catch (error) {
        console.error('OpenAI API error:', error);
        displayStatus('Error generating code: ' + error.message, 'error');
    } finally {
        showLoader(false);
    }
}

// Apply changes to the content block
function applyChanges() {
    // Ensure SDK is initialized before using it
    if (!sdk) {
        createSDKInstance();
    }

    if (!sdk) {
        displayStatus('SDK not initialized', 'error');
        return;
    }
    if (!currentContent) {
        displayStatus('No code to apply', 'error');
        return;
    }

    sdk.setContent(currentContent, err => {
        if (err) {
            console.error('setContent error:', err);
            displayStatus('Error applying changes: ' + err.message, 'error');
            return;
        }
        displayStatus('Changes applied successfully', 'success');
    });
}

// Call OpenAI API
async function callOpenAI(messages) {
    const response = await fetch(CONFIG.openAI.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: CONFIG.openAI.model,
            messages,
            temperature: CONFIG.openAI.temperature
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }

    return response.json();
}

// Save data to SDK and localStorage
function saveDataToSDK() {
    if (!sdk) return;
    const data = { lastPrompt, conversationHistory, apiKey };
    sdk.setData(data, err => {
        if (err) console.error('setData error:', err);
    });
    localStorage.setItem(CONFIG.storage.lastPrompt, lastPrompt);
}

// Copy code to clipboard
function copyCodeToClipboard() {
    codeOutput.select();
    document.execCommand('copy');
    displayStatus('Code copied to clipboard', 'success');
}

// Display status message
function displayStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status ' + type;
    setTimeout(() => {
        statusMessage.className = 'status';
    }, 3000);
}

// Show/hide loader
function showLoader(show) {
    loaderContainer.style.display = show ? 'flex' : 'none';
    generateBtn.disabled = show;
    applyChangesBtn.disabled = show;
}

// Set up event listeners
function setupEventListeners() {
    generateBtn.addEventListener('click', handleGenerate);
    applyChangesBtn.addEventListener('click', applyChanges);
    copyBtn.addEventListener('click', copyCodeToClipboard);
    saveApiKeyBtn.addEventListener('click', saveApiKey);
}

// Check if API key is set, show modal if not
function checkApiKey() {
    apiKey = localStorage.getItem(CONFIG.storage.apiKey) || '';
    if (!apiKey) {
        apiKeyModal.style.display = 'flex';
    }
}
