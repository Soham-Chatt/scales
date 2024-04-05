let scales = {};
let chords = {};

fetch("./info.json")
  .then(response => response.json())
  .then(data => {
    scales = data.scales;
    chords = data.chords;
    initSelectOptions();
  });

document.getElementById('keySelect').addEventListener('change', function () {
  let selectedKey = this.value;
  displayKeyDetails(selectedKey);
});

document.addEventListener('DOMContentLoaded', function () {
  const pianoKeys = document.querySelectorAll('#piano rect');
  pianoKeys.forEach(key => {
    key.addEventListener('click', function () {
      this.style.fill = this.style.fill === 'green' ? (this.id.endsWith('#') ? 'black' : 'white') : 'green';
      findKey();
    });
  });

  initSelectOptions();
});

document.getElementById('clearNotes').onclick = clearSelectedNotes;
document.getElementById('keyTable').style.display = 'none';

function highlightPianoKeys(notes) {
  const pianoKeys = document.querySelectorAll('#piano rect');
  pianoKeys.forEach(key => {
    key.style.fill = key.id.endsWith('#') ? 'black' : 'white';
  });

  notes.forEach(note => {
    const key = document.getElementById(note);
    if (key) {
      key.style.fill = 'green';
    }
  });
}

function displayKeyDetails(key) {
  let keyDetails = document.getElementById('keyDetails');
  let keyTable = document.getElementById('keyTable');

  if (key !== 'Choose a key') {
    keyTable.style.display = '';
    keyDetails.innerHTML = '';

    let notes = scales[key] || [];
    let chordsForKey = chords[key] || [];
    let maxLength = Math.max(notes.length, chordsForKey.length);

    highlightPianoKeys(notes);

    for (let i = 0; i < maxLength; i++) {
      let note = notes[i] || '';
      let chord = chordsForKey[i] || '';
      let row = `<tr><td>${note}</td><td>${chord}</td></tr>`;
      keyDetails.innerHTML += row;
    }
  } else {
    keyTable.style.display = 'none';
    highlightPianoKeys([]);
  }
}

function findKey() {
  let selectedButtons = Array.from(document.querySelectorAll('#noteButtons .btn-success'));
  const selectedNotes = Array.from(document.querySelectorAll('#piano rect'))
    .filter(key => key.style.fill === 'green')
    .map(key => key.id);

  document.getElementById('possibleKey').style.display = selectedNotes.length === 0 ? 'none' : 'block';

  if (selectedNotes.length > 7) {
    alert('Please select at most 7 notes');
    selectedButtons[selectedButtons.length - 1].classList.remove('btn-success');
    return;
  }

  let matches = [];
  const enharmonics = {'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb'};

  Object.entries(scales).forEach(([key, notes]) => {
    let matchingNotesCount = selectedNotes.filter(selectedNote => {
      return notes.some(note => {
        return note === selectedNote || note === enharmonics[selectedNote] || enharmonics[note] === selectedNote;
      });
    }).length;

    let matchPercentage = (matchingNotesCount / notes.length) * 100;
    if (matchingNotesCount > 0) {
      matches.push({key, matchingNotesCount, matchPercentage});
    }
  });

  matches.sort((a, b) => b.matchingNotesCount - a.matchingNotesCount);
  let topMatch = matches[0];
  let topMatches = matches.filter(match => match.matchPercentage === topMatch.matchPercentage);

  if (topMatch && topMatch.matchPercentage === 100) {
    document.getElementById('possibleKey').innerHTML = `${topMatch.key} (100% match)`;
    document.getElementById('keySelect').value = topMatch.key;
    displayKeyDetails(topMatch.key)
  } else {
    document.getElementById('possibleKey').innerHTML = topMatches.slice(0, 3).map(match => `${match.key} (${match.matchPercentage.toFixed(2)}% match)`).join('<br>');
  }
}

function clearSelectedNotes() {
  document.querySelectorAll('#piano rect').forEach(key => {
    key.style.fill = key.id.endsWith('#') ? 'black' : 'white';
  });

  document.getElementById('possibleKey').textContent = 'Please select notes to find a key';
}

function initSelectOptions() {
  let keySelect = document.getElementById('keySelect');

  keySelect.innerHTML = '<option selected>Choose a key</option>';

  Object.keys(scales).forEach(function (key) {
    let option = new Option(key, key);
    keySelect.add(option);
  });

  let allNotes = new Set();
  Object.values(scales).forEach(scale => scale.forEach(note => allNotes.add(note)));
  allNotes = Array.from(allNotes).sort();
  allNotes = allNotes.concat(allNotes.splice(0, allNotes.indexOf('C')));
  allNotes = allNotes.filter(note => !note.includes('b'));

  let noteButtonsContainer = document.getElementById('noteButtons');
  noteButtonsContainer.innerHTML = '';

  allNotes.forEach(note => {
    let button = document.createElement('button');
    button.classList.add('btn', 'btn-lg', 'btn-outline-light', 'm-1');
    button.textContent = note;
    button.dataset.note = note;

    button.onclick = function () {
      this.classList.toggle('btn-success');
      findKey();
    };

    noteButtonsContainer.appendChild(button);
  });
}


