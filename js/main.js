// Initialize variables
let sdk;
let currentContent = '';
let lastPrompt = '';
let apiKey = '';
let conversationHistory = [];

// DOM Elements
const promptInput = document.getElementById('promptInput');
const generateBtn = document.getElementById('generateBtn');
const applyChangesBtn = document.getElementById('applyChangesBtn');
const codeOutput = document.getElementById('codeOutput');
const copyBtn = document.getElementById('copyBtn');
const statusMessage = document.getElementById('statusMessage');
const loaderContainer = document.getElementById('loaderContainer');
const apiKeyModal = document.getElementById('apiKeyModal');
const apiKeyInput = document.getElementById('apiKeyInput');
const saveApiKeyBtn = document.getElementById('saveApiKeyBtn');

// Initialize Block SDK
document.addEventListener('DOMContentLoaded', function() {
    initializeBlockSDK();
    setupEventListeners();
    checkApiKey();
});

// Initialize Salesforce Marketing Cloud Block SDK
function initializeBlockSDK() {
    try {
        sdk = new window.sfdc.BlockSDK();
        sdk.getContent(content => {
            currentContent = content;
            codeOutput.value = content;
        });
        
        sdk.getData(data => {
            if (data.apiKey) {
                apiKey = data.apiKey;
            }
            
            if (data.lastPrompt) {
                lastPrompt = data.lastPrompt;
                promptInput.value = lastPrompt;
            }
            
            if (data.conversationHistory) {
                conversationHistory = data.conversationHistory;
            }
        });
    } catch (error) {
        displayStatus('Error initializing Block SDK: ' + error.message, 'error');
    }
}

// Set up event listeners
function setupEventListeners() {
    generateBtn.addEventListener('click', handleGenerate);
    applyChangesBtn.addEventListener('click', applyChanges);
    copyBtn.addEventListener('click', copyCodeToClipboard);
    saveApiKeyBtn.addEventListener('click', saveApiKey);
    
    // Auto-resize textarea when content changes
    codeOutput.addEventListener('input', () => {
        currentContent = codeOutput.value;
    });
}

// Check if API key is set, show modal if not
function checkApiKey() {
    apiKey = localStorage.getItem(CONFIG.storage.apiKey);
    
    if (!apiKey) {
        apiKeyModal.style.display = 'flex';
    }
}

// Save API key from modal
function saveApiKey() {
    const newApiKey = apiKeyInput.value.trim();
    
    if (newApiKey) {
        apiKey = newApiKey;
        localStorage.setItem(CONFIG.storage.apiKey, apiKey);
        
        // Save to SDK data as well
        sdk.getData(data => {
            const updatedData = { ...data, apiKey };
            sdk.setData(updatedData);
        });
        
        apiKeyModal.style.display = 'none';
    } else {
        displayStatus('Please enter a valid API key', 'error');
    }
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
    
    try {
        showLoader(true);
        
        // Update conversation history
        if (conversationHistory.length === 0) {
            // Start a new conversation
            conversationHistory = [
                { role: 'system', content: CONFIG.systemPrompt },
                { role: 'user', content: prompt }
            ];
        } else {
            // Add to existing conversation
            conversationHistory.push({ role: 'user', content: prompt });
        }
        
        // Call OpenAI API
        const response = await callOpenAI(conversationHistory);
        
        // Update the code output
        const generatedCode = response.choices[0].message.content;
        codeOutput.value = generatedCode;
        currentContent = generatedCode;
        
        // Add assistant's response to history
        conversationHistory.push({ 
            role: 'assistant', 
            content: generatedCode 
        });
        
        // Save prompt and conversation history
        lastPrompt = prompt;
        saveDataToSDK();
        
        displayStatus('Code generated successfully', 'success');
    } catch (error) {
        displayStatus('Error generating code: ' + error.message, 'error');
    } finally {
        showLoader(false);
    }
}

// Apply changes to the content block
function applyChanges() {
    if (!currentContent) {
        displayStatus('No code to apply', 'error');
        return;
    }
    
    try {
        sdk.setContent(currentContent);
        displayStatus('Changes applied successfully', 'success');
    } catch (error) {
        displayStatus('Error applying changes: ' + error.message, 'error');
    }
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
            messages: messages,
            temperature: CONFIG.openAI.temperature
        })
    });
    
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'API request failed');
    }
    
    return await response.json();
}

// Save data to SDK
function saveDataToSDK() {
    const data = {
        lastPrompt,
        conversationHistory
    };
    
    sdk.setData(data);
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
    
    // Hide status after 3 seconds
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
