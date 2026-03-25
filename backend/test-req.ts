async function run() {
  const url = 'http://localhost:5000/api/auth';
  const token = '44aa781927047d5d19a97fadc52bed1ddc77751aee8a6ea0a6837360006c04ee';
  const res = await fetch(url + '/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password: 'newpassword123' })
  });
  console.log('Reset response:', await res.json());
}
run();
