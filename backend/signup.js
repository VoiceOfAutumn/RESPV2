document.getElementById('signupForm').addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent form from submitting the default way
  
    const display_name = document.getElementById('display_name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
  
    const formData = { display_name, email, password };
  
    try {
      const response = await fetch('http://localhost:3000/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
  
      const data = await response.json();
  
      if (response.status === 201) {
        alert('User created successfully!');
        // Optionally, redirect the user after signup:
        // window.location.href = '/login.html';
      } else {
        document.getElementById('errorMessage').textContent = data.message;
      }
    } catch (err) {
      console.error('Error:', err);
      document.getElementById('errorMessage').textContent = 'Something went wrong. Please try again.';
    }
  });
  