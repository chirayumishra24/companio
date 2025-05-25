const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const photoInput = document.getElementById('photoInput');

// Start webcam
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => { video.srcObject = stream; })
  .catch(err => console.error("Webcam error:", err));

// Capture photo
document.getElementById('snap').addEventListener('click', () => {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  canvas.getContext('2d').drawImage(video, 0, 0);
  const photoData = canvas.toDataURL('image/png');
  photoInput.value = photoData;
  alert("📸 Photo captured!");
});

// Submit form
document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  const data = Object.fromEntries(formData.entries());

  data.interests = data.interests.split(',').map(i => i.trim()); // convert to array

  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });

  const result = await response.json();
  if (response.ok) {
    alert('✅ Registered successfully!');
    window.location.href = '/matches';
    localStorage.setItem('userId', result.userId);

  } else {
    alert('❌ Registration failed!');
  }
});
