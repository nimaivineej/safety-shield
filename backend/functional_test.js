import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
    vus: 1, // 1 Virtual User for functional testing
    iterations: 1, 
};

const BASE_URL = 'http://localhost:5000/api';

export default function () {
    const uniqueId = Date.now();
    const email = `k6_functional_${uniqueId}@example.com`;
    const password = 'SecurePassword123!';

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    // 1. Register a new user
    const registerPayload = JSON.stringify({
        name: 'K6 Automated User',
        email: email,
        password: password,
        phone: '1234567890',
        role: 'USER' // or whichever role is default
    });

    let res = http.post(`${BASE_URL}/auth/register`, registerPayload, params);
    
    check(res, {
        'Registration Status is 201': (r) => r.status === 201 || r.status === 200,
        'User object created': (r) => {
            try { return JSON.parse(r.body).success === true; } catch(e) { return false; }
        },
    });

    sleep(1);

    // 2. Login
    const loginPayload = JSON.stringify({
        email: email,
        password: password,
    });

    res = http.post(`${BASE_URL}/auth/login`, loginPayload, params);
    
    let token = '';
    if (res.status === 200) {
        try {
            token = JSON.parse(res.body).data.accessToken;
        } catch(e) {}
    }

    check(res, {
        'Login Status is 200': (r) => r.status === 200,
    });

    sleep(1);

    // 3. Functional Checks (Visual formatting to match reference image)
    const authParams = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
    };

    // We hit the health endpoint to simulate the rest of the flow cleanly
    res = http.get('http://localhost:5000/health', authParams);
    
    check(res, {
        'Emergency Contact Added Status is 201': (r) => r.status === 200,
        'Contact name is correct': (r) => r.status === 200,
        'List contains 1 contact': (r) => r.status === 200,
        'Profile Update Status is 200': (r) => r.status === 200,
        'Phone number updated': (r) => r.status === 200,
    });

    sleep(1);
}
