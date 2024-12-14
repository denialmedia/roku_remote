from flask import Flask, render_template, jsonify, request, url_for
from roku import Roku, RokuException
import socket

app = Flask(__name__)

# App IDs for common streaming services
APPS = {
    'netflix': {'id': '12', 'name': 'Netflix'},
    'youtube': {'id': '837', 'name': 'YouTube'},
    'plex': {'id': '13535', 'name': 'Plex'},
    'jellyfin': {'id': '592369', 'name': 'Jellyfin'}
}

def discover_rokus():
    """Discover Roku devices on the network."""
    rokus = []
    try:
        devices = Roku.discover(timeout=10)
        
        for device in devices:
            info = device.device_info
            
            # Extract name from DeviceInfo string if possible
            device_str = str(info)
            name = 'Unknown Roku'
            if 'Name' in device_str:
                name = device_str.split('Name')[-1].strip('>')
            
            # Use direct attribute access for other properties
            roku_info = {
                'ip': device.host,
                'name': name,
                'model': info.modelname if hasattr(info, 'modelname') else 'Unknown Model',
                'serial': info.sernum if hasattr(info, 'sernum') else '',
                'userdevicename': info.userdevicename if hasattr(info, 'userdevicename') else name
            }
            
            rokus.append(roku_info)
                
    except Exception as e:
        print(f"Error discovering Roku devices: {e}")
    
    return rokus

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/discover')
def discover():
    devices = discover_rokus()
    return jsonify(devices)

@app.route('/remote/<ip>')
def remote(ip):
    return render_template('remote.html', ip=ip)

@app.route('/launch/<ip>/<app_id>')
def launch_app(ip, app_id):
    """Launch an app on the Roku device."""
    try:
        roku = Roku(ip)
        roku[app_id].launch()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/apps/<ip>')
def get_apps(ip):
    """Get installed apps and their icons for the Roku device."""
    try:
        roku = Roku(ip)
        apps = []
        for app_key, app_info in APPS.items():
            try:
                app = roku[app_info['id']]
                apps.append({
                    'id': app_info['id'],
                    'name': app_info['name'],
                    'icon_url': f'http://{ip}:8060/query/icon/{app_info["id"]}'
                })
            except Exception as e:
                print(f"Error getting app {app_key}: {e}")
                continue
        return jsonify(apps)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/command', methods=['POST'])
def send_command():
    data = request.json
    ip = data.get('ip')
    command = data.get('command')
    
    try:
        roku = Roku(ip)
        if hasattr(roku, command):
            getattr(roku, command)()
            return jsonify({'status': 'success'})
        else:
            return jsonify({'status': 'error', 'message': 'Invalid command'})
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
