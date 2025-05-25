let users = [];
let currentIndex = 0;
const profileCard = document.getElementById('profileCard');
const profilePhoto = document.getElementById('profilePhoto');
const profileName = document.getElementById('profileName');
const profileInfo = document.getElementById('profileInfo');
const swipeCounter = document.getElementById('swipeCounter');
const destinationDropdown = document.getElementById("destinationFilter");
const compatibilityScore = document.getElementById("compatibilityScore");

let destinationFilter = "";

// Fetch all users
async function fetchUsers() {
  try {
    const res = await fetch('/users');
    users = await res.json();

    // Optional: Sort by compatibility descending
    users.sort((a, b) => (b.compatibility || 0) - (a.compatibility || 0));

    currentIndex = 0;
    showProfile();
  } catch (error) {
    console.error("Error fetching users:", error);
    profileCard.innerHTML = "<p>Failed to load profiles. Please try again later.</p>";
  }
}

// Render the current profile
function showProfile() {
  profileCard.style.opacity = 0;

  setTimeout(() => {
    const filteredUsers = getFilteredUsers();

    if (currentIndex >= filteredUsers.length) {
      profileCard.innerHTML = "<p>No more users to show. Check back later!</p>";
      swipeCounter.textContent = "";
      profileCard.style.opacity = 1;
      return;
    }

    const user = filteredUsers[currentIndex];

    profilePhoto.src = user.photo || "/static/images/dummy-user.png";
    profileName.textContent = user.name;
    profileInfo.textContent = `${user.gender} | ${user.destination} | Interests: ${user.interests?.join(", ") || "N/A"}`;
    compatibilityScore.textContent = `Compatibility: ${user.compatibility || 0}%`;
    swipeCounter.textContent = `Swipe ${currentIndex + 1} of ${filteredUsers.length}`;

    profileCard.style.opacity = 1;
  }, 200);
}

// Like a user
async function likeUser() {
  const filteredUsers = getFilteredUsers();
  const likedUserId = filteredUsers[currentIndex]._id;

  try {
    const res = await fetch('/like', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ likedId: likedUserId })
    });

    const result = await res.json();
    if (result.match) {
      alert("🎉 It's a match! You can now chat with your travel buddy.");
    }
  } catch (error) {
    console.error("Error liking user:", error);
  }

  currentIndex++;
  showProfile();
}

// Dislike a user
function dislikeUser() {
  currentIndex++;
  showProfile();
}

// Filter logic
function getFilteredUsers() {
  return destinationFilter ? users.filter(u => u.destination === destinationFilter) : users;
}

// Event Listeners
document.getElementById('likeBtn').addEventListener('click', likeUser);
document.getElementById('dislikeBtn').addEventListener('click', dislikeUser);
destinationDropdown.addEventListener('change', (e) => {
  destinationFilter = e.target.value;
  currentIndex = 0;
  showProfile();
});

fetchUsers();
