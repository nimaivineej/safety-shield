import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import os from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function getNgrokUrl() {
    try {
        const response = await fetch('http://localhost:4040/api/tunnels');
        if (!response.ok) return null;
        const data = await response.json();
        return data.tunnels?.[0]?.public_url || null;
    } catch {
        return null; // ngrok not running
    }
}

function getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'localhost';
}

async function run() {
    console.log('🔍 Checking for active ngrok tunnel...');
    let apiUrl = await getNgrokUrl();
    let isNgrok = !!apiUrl;

    if (apiUrl) {
        console.log(`✅ Found ngrok tunnel: ${apiUrl}`);
    } else {
        const localIp = getLocalIpAddress();
        apiUrl = `http://${localIp}:5000`; // Assuming backend is on port 5000
        console.log(`📡 ngrok not running. Using local network IP: ${apiUrl}`);
        console.log(`⚠️  Make sure your phone and computer are on the same Wi-Fi network!`);
    }

    // Update src/config/api.config.ts
    const configPath = path.join(__dirname, 'src', 'config', 'api.config.ts');
    console.log(`📝 Updating api.config.ts...`);
    
    if (fs.existsSync(configPath)) {
        let content = fs.readFileSync(configPath, 'utf8');
        
        // Regex to match existing ANDROID_HOST definition
        content = content.replace(
            /(const\s+ANDROID_HOST\s*=\s*['"])(.*?)(['"]\s*;?)/g,
            `$1${apiUrl}$3`
        );
        
        fs.writeFileSync(configPath, content, 'utf8');
        console.log('✅ Updated api.config.ts successfully.');
    } else {
        console.error('❌ Could not find src/config/api.config.ts');
        process.exit(1);
    }
    
    // Update ngrok_url.txt
    if (isNgrok) {
        fs.writeFileSync(path.join(__dirname, 'ngrok_url.txt'), apiUrl, 'utf8');
        console.log('✅ Updated ngrok_url.txt cache.');
    } else {
        if (fs.existsSync(path.join(__dirname, 'ngrok_url.txt'))) {
            fs.writeFileSync(path.join(__dirname, 'ngrok_url.txt'), `URL: ${apiUrl}\n(Using local IP instead of ngrok)`, 'utf8');
            console.log('✅ Updated ngrok_url.txt cache with local IP.');
        }
    }

    // Run build and sync
    try {
        console.log('\n🔨 Building frontend for mobile (vite build)...');
        execSync('npm run build', { stdio: 'inherit', cwd: __dirname });
        
        console.log('\n📱 Syncing to Capacitor android project...');
        execSync('npx cap sync android', { stdio: 'inherit', cwd: __dirname });
        
        console.log('\n🎉 ALL DONE! Your mobile app is synced with the new API URL.');
        if (!isNgrok) {
            console.log('👉 Remember: Your phone MUST be on the same Wi-Fi for local IP to work.');
        } else {
            console.log('👉 ngrok tunnel is active via 4G/LTE/Wi-Fi public internet.');
        }
        console.log('▶️  Run the app in Android Studio (or sync changes) to test.');
    } catch (e) {
        console.error('❌ An error occurred while building/syncing.');
        process.exit(1);
    }
}

run();
