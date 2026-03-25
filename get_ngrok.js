const http = require('http');

http.get('http://localhost:4040/api/tunnels', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        try {
            const json = JSON.parse(data);
            const url = json.tunnels[0].public_url;
            console.log(`NGROK_URL=${url}`);
        } catch (e) {
            console.log(`ERROR: ${e.message}`);
        }
    });
}).on('error', (err) => {
    console.log(`ERROR: ${err.message}`);
});
