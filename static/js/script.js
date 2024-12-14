function scanDevices() {
    const loading = document.getElementById('loading');
    const deviceList = document.getElementById('deviceList');
    loading.style.display = 'flex';
    deviceList.innerHTML = '';

    fetch('/discover')
        .then(response => response.json())
        .then(devices => {
            loading.style.display = 'none';
            devices.forEach(device => {
                const li = document.createElement('div');
                li.className = 'device-item';
                li.innerHTML = `
                    <h3><i class="fas fa-tv"></i> ${device.name}</h3>
                    <p><i class="fas fa-microchip"></i> ${device.model}</p>
                    <p><i class="fas fa-network-wired"></i> ${device.ip}</p>
                    ${device.userdevicename !== device.name ? `<p><i class="fas fa-tag"></i> ${device.userdevicename}</p>` : ''}
                `;
                li.onclick = () => window.location.href = `/remote/${device.ip}`;
                deviceList.appendChild(li);
            });
            if (devices.length === 0) {
                deviceList.innerHTML = '<div class="status-message"><i class="fas fa-exclamation-circle"></i> No devices found</div>';
            }
        })
        .catch(error => {
            loading.style.display = 'none';
            deviceList.innerHTML = '<div class="status-message"><i class="fas fa-exclamation-triangle"></i> Error scanning for devices</div>';
            console.error('Error:', error);
        });
}

function sendCommand(command) {
    const ip = document.getElementById('ipAddress').textContent;
    const button = event.currentTarget;
    const originalBackground = button.style.backgroundColor;
    
    button.style.backgroundColor = 'var(--pine)';
    
    fetch('/command', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            ip: ip,
            command: command
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'error') {
            showToast('Error: ' + data.message);
        }
        setTimeout(() => {
            button.style.backgroundColor = originalBackground;
        }, 200);
    })
    .catch(error => {
        console.error('Error:', error);
        showToast('Failed to send command');
        button.style.backgroundColor = originalBackground;
    });
}

function showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'status-message';
    toast.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

function loadApps() {
    const appsContainer = document.getElementById('apps-container');
    const ip = document.getElementById('ipAddress').textContent;

    fetch(`/apps/${ip}`)
        .then(response => response.json())
        .then(apps => {
            appsContainer.innerHTML = '';
            apps.forEach(app => {
                const button = document.createElement('button');
                button.className = 'app-button';
                button.onclick = () => launchApp(app.id);
                button.innerHTML = `
                    <img src="${app.icon_url}" alt="${app.name}" onerror="this.src='/static/images/app-placeholder.png'">
                    <span>${app.name}</span>
                `;
                appsContainer.appendChild(button);
            });
            if (apps.length === 0) {
                appsContainer.innerHTML = '<div class="status-message">No apps found</div>';
            }
        })
        .catch(error => {
            console.error('Error loading apps:', error);
            appsContainer.innerHTML = '<div class="status-message">Error loading apps</div>';
        });
}

function launchApp(appId) {
    const ip = document.getElementById('ipAddress').textContent;
    fetch(`/launch/${ip}/${appId}`)
        .then(response => response.json())
        .then(data => {
            if (data.status === 'error') {
                console.error('Error launching app:', data.message);
            }
        })
        .catch(error => console.error('Error:', error));
}

// Load apps when the remote page loads
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('apps-container')) {
        loadApps();
    }
});
