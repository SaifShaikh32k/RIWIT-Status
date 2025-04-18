let consignmentData = new Map();

// Config
const SHEET_ID = '1R680Q-6ixyQz6V79JGG1-TE0t185n1kRywo0ZylEA90';
const API_KEY = 'AIzaSyATOb3OobOjqGOTEOYgZEE4DezIYWuRmmY';
const REFRESH_INTERVAL = 300000;

function updateLastRefreshTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString();
    document.getElementById('lastRefresh').textContent = `Last refreshed: ${timeString}`;
}

window.addEventListener('load', async function () {
    try {
        document.getElementById('statusDisplay').innerHTML = '<div class="loading"></div>';
        await loadSheetData(SHEET_ID, API_KEY);
        document.getElementById('statusDisplay').textContent = 'Ready to check status';
        updateLastRefreshTime();

        setInterval(async () => {
            try {
                await loadSheetData(SHEET_ID, API_KEY);
                updateLastRefreshTime();
                console.log('Sheet data refreshed successfully');
            } catch (error) {
                console.error('Error refreshing sheet data:', error);
            }
        }, REFRESH_INTERVAL);
    } catch (error) {
        console.error('Error details:', error);
        document.getElementById('statusDisplay').textContent = `Error loading sheet data: ${error.message}`;
    }
});

async function loadSheetData(sheetId, apiKey) {
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Sheet1!A:C?key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Data Fetch Error: ${errorData.error?.message || 'Failed to fetch sheet data'}`);
    }

    const data = await response.json();
    consignmentData.clear();

    if (!data.values || data.values.length === 0) {
        throw new Error('No data found in the sheet');
    }

    for (let i = 1; i < data.values.length; i++) {
        const row = data.values[i];
        if (row && row.length >= 3) {
            const consignmentId = row[0]?.toString().trim();
            const status = row[1]?.toString().trim();
            const createdAt = row[2]?.toString().trim();
            if (consignmentId && status && createdAt) {
                consignmentData.set(consignmentId, { status, createdAt });
            }
        }
    }

    if (consignmentData.size === 0) {
        throw new Error('No valid consignment data found in the sheet');
    }
}

document.getElementById('checkStatus').addEventListener('click', function () {
    const consignmentIdInput = document.getElementById('consignmentId');
    const consignmentId = consignmentIdInput.value.trim();
    const statusDisplay = document.getElementById('statusDisplay');
    const createdAtDisplay = document.getElementById('createdAtDisplay'); // Add this line

    if (!consignmentId) {
        statusDisplay.textContent = 'Please enter a Consignment ID';
        createdAtDisplay.textContent = ''; // Clear Created At field
        return;
    }

    if (consignmentData.size === 0) {
        statusDisplay.textContent = 'Sheet data not loaded yet';
        createdAtDisplay.textContent = ''; // Clear Created At field
        return;
    }

    if (consignmentData.has(consignmentId)) {
        const data = consignmentData.get(consignmentId);
        statusDisplay.innerHTML = `<strong></strong> ${data.status}`;
        createdAtDisplay.innerHTML = `<strong>Created At:</strong> ${data.createdAt}`;
    } else {
        statusDisplay.textContent = 'Consignment ID not found';
        createdAtDisplay.textContent = ''; // Clear Created At field
    }

    consignmentIdInput.value = '';
    consignmentIdInput.focus();
});

document.getElementById('consignmentId').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') {
        document.getElementById('checkStatus').click();
    }
});
