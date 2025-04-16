const ddragonURL = 'https://ddragon.leagueoflegends.com/cdn/15.1.1/data/fr_FR/champion.json';
const iconBaseURL = 'https://ddragon.leagueoflegends.com/cdn/15.1.1/img/champion/';
const searchInput = document.getElementById('searchInput');
const championList = document.getElementById('championList');
let allChampions = [];
let selectedRole = null;

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
const apiUrl = "https://ton-app.onrender.com";


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
    const matchesRole = !selectedRole || champ.tags.includes(selectedRole);
    return matchesSearch && matchesRole;
  });

  championList.innerHTML = filtered.map(champ => `
    <div class="text-center cursor-pointer" onclick="openModal('${champ.id}')">
      <img src="${iconBaseURL + champ.image.full}" alt="${champ.name}" class="w-16 mx-auto rounded" />
      <p class="text-sm mt-1">${champ.name}</p>
    </div>
  `).join('');
}

async function deleteCounter(champion, counterName) {
  const confirmed = confirm(`Supprimer ${counterName} comme counter ?`);
  if (!confirmed) return;

  await fetch(`${apiUrl}/counters/${champion}/${counterName}`, {
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
  
    modalCounters.innerHTML = counters
    .sort((a, b) => a.order - b.order)
    .map(counter => `
      <div class="flex items-center justify-between bg-gray-700 p-2 rounded">
        <div class="flex items-center">
          <img src="${iconBaseURL + counter.name + '.png'}" alt="${counter.name}" class="w-10 h-10 rounded mr-3" />
          <div>
            <p class="font-semibold">${counter.name}</p>
            ${counter.comment ? `<p class="text-sm text-gray-300">${counter.comment}</p>` : ''}
          </div>
        </div>
        <button onclick="deleteCounter('${selectedChampion.name}', '${counter.name}')" class="text-red-400 hover:text-red-600 text-lg">✖</button>
      </div>
    `).join('');
}
  


addCounterBtn.addEventListener('click', () => {
  counterNoteInput.value = '';
  counterOrderSelect.value = '1';
  addCounterModal.classList.remove('hidden');
  addCounterModal.classList.add('flex');
});

function closeAddCounterModal() {
  addCounterModal.classList.add('hidden');
  addCounterModal.classList.remove('flex');
}

function populateCounterSelect() {
  counterChampionSelect.innerHTML = allChampions.map(champ => `
    <option value="${champ.id}" data-url="${iconBaseURL + champ.image.full}">${champ.name}</option>
  `).join('');

  // Init Tom Select avec template custom
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
  const order = parseInt(counterOrderSelect.value);

  const payload = {
    name: counterName,
    comment: counterText,
    order
  };

  await fetch(`${apiUrl}/counters/${selectedChampion.name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  closeAddCounterModal();
  renderCounters(selectedChampion.name);
});




loadChampions();
