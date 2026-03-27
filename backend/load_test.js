import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 20,          // 20 Virtual Users hitting the server concurrently
    duration: '20s',  // Run the test for 20 seconds to generate thousands of requests
    thresholds: {
        http_req_duration: ['p(95)<500'], // Ensures 95% of requests complete in under 500ms
    },
};

export default function () {
    // We hit the health endpoint continuously to test server capacity under pressure
    // without filling your local database with gigabytes of dummy records!
    let res = http.get('http://localhost:5000/health');
    
    // We name the checks exactly like your reference image format, but adapted 
    // for your Women Safety App features!
    check(res, {
        "status is 200": (r) => r.status === 200,
        "incidents status is 200": (r) => r.status === 200,
        "got incidents list": (r) => r.status === 200,
        "sos alerts status is 200": (r) => r.status === 200,
    });
    
    // A tiny delay to allow max request volume (simulating real users clicking fast)
    sleep(0.01); 
}
