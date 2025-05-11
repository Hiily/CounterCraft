const ddragonURL = 'https://ddragon.leagueoflegends.com/cdn/15.2.1/data/fr_FR/champion.json';
const iconBaseURL = 'https://ddragon.leagueoflegends.com/cdn/15.2.1/img/champion/';
const searchInput = document.getElementById('searchInput');
const championList = document.getElementById('championList');
let allChampions = [];
let selectedRole = null;
let championRoles = {};

// Elements pour les modals
const modal = document.getElementById('modal');
const modalChampionIcon = document.getElementById('modalChampionIcon');
const modalCounters = document.getElementById('modalCounters');
const addCounterBtn = document.getElementById('addCounterBtn');

const addCounterModal = document.getElementById('addCounterModal');
const counterChampionSelect = document.getElementById('counterChampion');
const counterNoteInput = document.getElementById('counterNote');
const counterOrderSelect = document.getElementById('counterOrder');
const addCounterForm = document.getElementById('addCounterForm');

let selectedChampion = null;
let fakeCounters = {}; 
const apiUrl = "https://countercraft.onrender.com";

async function loadChampionRoles() {
  const res = await fetch('/static/championRoles.json');
  championRoles = await res.json();
}

async function loadChampions() {
  const res = await fetch(ddragonURL);
  const data = await res.json();
  allChampions = Object.values(data.data);
  updateChampionList();
  populateCounterSelect();
}

function updateChampionList() {
  const search = searchInput.value.toLowerCase();
  const filtered = allChampions.filter(champ => {
    const matchesSearch = champ.name.toLowerCase().includes(search);
    const roles = championRoles[champ.id] || [];
    const matchesRole = !selectedRole || roles.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  championList.innerHTML = filtered.map(champ => `
    <div class="text-center cursor-pointer" onclick="openModal('${champ.id}')">
      <img src="${iconBaseURL + champ.image.full}" alt="${champ.name}" class="w-16 mx-auto rounded" />
      <p class="text-sm mt-1">${champ.name}</p>
    </div>
  `).join('');
}

async function deleteCounter(champion, counterName, role) {
  const confirmed = confirm(`Supprimer ${counterName} comme counter (${role}) ?`);
  if (!confirmed) return;

  await fetch(`${apiUrl}/counters/${champion}/${counterName}/${role}`, {
    method: "DELETE"
  });

  renderCounters(champion);
}


document.querySelectorAll('.role-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.role-icon').forEach(i => i.classList.remove('active'));
    icon.classList.add('active');
    selectedRole = icon.dataset.role;
    updateChampionList();
  });
});

searchInput.addEventListener('input', updateChampionList);

function openModal(championId) {
  const champ = allChampions.find(c => c.id === championId);
  selectedChampion = champ;

  modalChampionIcon.src = iconBaseURL + champ.image.full;
  modalChampionIcon.alt = champ.name;

  renderCounters(champ.name);
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeModal() {
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

async function renderCounters(championName) {
  const res = await fetch(`${apiUrl}/counters/${championName}`);
  const counters = await res.json();

  // Grouper les counters par rôle
  const grouped = {};
  for (const counter of counters) {
    const role = counter.role || "Autre";
    if (!grouped[role]) grouped[role] = [];
    grouped[role].push(counter);
  }

  // Construire l'affichage
  modalCounters.innerHTML = Object.entries(grouped)
  .map(([role, roleCounters]) => {
    const iconRole = ["Top", "Jungle", "Mid", "Bot", "Support"].includes(role) ? role : "All";
    return `
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-2">
          <img src="/static/icon/${iconRole}.png" alt="${role}" class="w-6 h-6" />
        </div>
        ${roleCounters
          .sort((a, b) => a.rank - b.rank)
          .map(counter => `
            <div class="flex items-center justify-between bg-gray-700 p-2 rounded mb-2">
              <div class="flex items-center">
                <img src="${iconBaseURL + counter.name + '.png'}" alt="${counter.name}" class="w-10 h-10 rounded mr-3" />
                <div>
                  <p class="font-semibold">${counter.name}</p>
                  ${counter.comment ? `<p class="text-sm text-gray-300">${counter.comment}</p>` : ''}
                </div>
              </div>
              <button onclick="deleteCounter('${selectedChampion.name}', '${counter.name}', '${role}')" class="text-red-400 hover:text-red-600 text-lg">✖</button>
            </div>
          `).join('')}
      </div>
    `;
  }).join('');

}



addCounterBtn.addEventListener('click', () => {
  counterNoteInput.value = '';
  counterOrderSelect.value = '1';

  updateCounterForRoleOptions();
  addCounterModal.classList.remove('hidden');
  addCounterModal.classList.add('flex');
});

function updateCounterForRoleOptions() {
  const roleSelect = document.getElementById('counterForRole');
  const roles = championRoles[selectedChampion.id] || [];

  roleSelect.innerHTML = roles.map(role => `
    <option value="${role}">${role}</option>
  `).join('');
}

function closeAddCounterModal() {
  addCounterModal.classList.add('hidden');
  addCounterModal.classList.remove('flex');
}

function populateCounterSelect() {
  counterChampionSelect.innerHTML = allChampions.map(champ => `
    <option value="${champ.id}" data-url="${iconBaseURL + champ.image.full}">${champ.name}</option>
  `).join('');

  new TomSelect('#counterChampion', {
    maxOptions: 999,
    render: {
      option: function(data, escape) {
        return `<div class="flex items-center">
          <img src="${escape(data.url)}" class="w-5 h-5 mr-2 rounded" />
          <span>${escape(data.text)}</span>
        </div>`;
      },
      item: function(data, escape) {
        return `<div class="flex items-center">
          <img src="${escape(data.url)}" class="w-5 h-5 mr-2 rounded" />
          <span>${escape(data.text)}</span>
        </div>`;
      }
    }
  });
}

addCounterForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const counterName = counterChampionSelect.value;
  const counterText = counterNoteInput.value.trim();
  const rank = parseInt(counterOrderSelect.value);
  const role = document.getElementById('counterForRole').value;

  const payload = {
    name: counterName,
    comment: counterText,
    rank,
    role
  };
  

  try {
    const response = await fetch(`${apiUrl}/counters/${selectedChampion.name}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ Erreur API :", errorData);
      alert("Erreur lors de l'enregistrement du counter !");
      return;
    }

    closeAddCounterModal();
    renderCounters(selectedChampion.name);

  } catch (error) {
    console.error("❌ Erreur réseau :", error);
    alert("Erreur de communication avec le serveur.");
  }
});

// 🔁 Appel initial (on attend les rôles puis on charge les champions)
(async () => {
  await loadChampionRoles();
  await loadChampions();
})();

document.querySelectorAll('.role-icon').forEach(icon => {
  icon.addEventListener('click', () => {
    document.querySelectorAll('.role-icon').forEach(i => {
      i.classList.remove(
        "bg-emerald-600",
        "bg-opacity-20",
        "ring-2",
        "ring-emerald-400",
        "rounded-lg",
        "p-1",
        "scale-105"
      );
    });

    icon.classList.add(
      "bg-emerald-600",
      "bg-opacity-20",
      "ring-2",
      "ring-emerald-400",
      "rounded-lg",
      "p-1",
      "scale-105"
    );

    selectedRole = icon.dataset.role;
    updateChampionList();
  });
});

