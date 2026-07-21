const form = document.querySelector("#note-form");
const noteIdInput = document.querySelector("#note-id");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const notesContainer = document.querySelector("#notes");
const noteCount = document.querySelector("#note-count");
const statusBadge = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");
const resetButton = document.querySelector("#reset-button");

let notes = [];

function setStatus(message) {
  statusBadge.textContent = message;
}

function resetForm() {
  noteIdInput.value = "";
  form.reset();
  saveButton.textContent = "Save note";
  titleInput.focus();
}

function renderNotes() {
  noteCount.textContent = String(notes.length);

  if (notes.length === 0) {
    notesContainer.innerHTML = '<div class="empty">No notes yet. Add your first deployment thought.</div>';
    return;
  }

  notesContainer.innerHTML = notes
    .map(
      (note) => `
        <article class="note-card">
          <div>
            <h3>${escapeHtml(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
          </div>
          <footer>
            <button type="button" data-action="edit" data-id="${note._id}">Edit</button>
            <button type="button" class="danger" data-action="delete" data-id="${note._id}">Delete</button>
          </footer>
        </article>
      `
    )
    .join("");
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.message || "Request failed");
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

async function loadNotes() {
  setStatus("Loading...");
  notes = await request("/api/notes");
  renderNotes();
  setStatus("Online");
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const id = noteIdInput.value;
  const payload = {
    title: titleInput.value.trim(),
    content: contentInput.value.trim(),
  };

  setStatus("Saving...");

  if (id) {
    await request(`/api/notes/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  } else {
    await request("/api/notes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  resetForm();
  await loadNotes();
});

resetButton.addEventListener("click", resetForm);

notesContainer.addEventListener("click", async (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const note = notes.find((item) => item._id === button.dataset.id);
  if (!note) return;

  if (button.dataset.action === "edit") {
    noteIdInput.value = note._id;
    titleInput.value = note.title;
    contentInput.value = note.content;
    saveButton.textContent = "Update note";
    titleInput.focus();
  }

  if (button.dataset.action === "delete") {
    setStatus("Deleting...");
    await request(`/api/notes/${note._id}`, { method: "DELETE" });
    await loadNotes();
  }
});

loadNotes().catch((error) => {
  console.error(error);
  setStatus("Offline");
  notesContainer.innerHTML = '<div class="empty">Could not load notes. Check the API and MongoDB containers.</div>';
});
