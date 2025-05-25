const userId = localStorage.getItem('userId'); // assuming you store it

async function fetchMatches() {
  const res = await fetch(`/matches?userId=${userId}`);
  const matches = await res.json();

  const container = document.getElementById('matchesContainer');
  container.innerHTML = matches.map(user => `
    <div class="border p-3 rounded shadow">
      <div class="flex items-center gap-4">
        <img src="${user.photo || '/static/images/dummy-user.png'}" class="w-12 h-12 rounded-full" />
        <div>
          <h3 class="font-semibold">${user.name}</h3>
          <p class="text-sm text-gray-600">${user.destination}</p>
        </div>
        <a href="/chat.html?with=${user._id}" class="ml-auto text-blue-600 underline">Chat 💬</a>
      </div>
    </div>
  `).join('');
}

fetchMatches();
