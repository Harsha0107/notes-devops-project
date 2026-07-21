const form = document.querySelector("#note-form");
const noteIdInput = document.querySelector("#note-id");
const titleInput = document.querySelector("#title");
const contentInput = document.querySelector("#content");
const notesContainer = document.querySelector("#notes");
const noteCount = document.querySelector("#note-count");
const statusBadge = document.querySelector("#status");
const saveButton = document.querySelector("#save-button");
const resetButton = document.querySelector("#reset-button");
const searchInput = document.querySelector("#search");
const sortInput = document.querySelector("#sort");
const formTitle = document.querySelector("#form-title");
const characterCount = document.querySelector("#character-count");
const toast = document.querySelector("#toast");

let notes = [];
let searchTerm = "";
let sortMode = "updated";
let pinnedNotes = JSON.parse(localStorage.getItem("pinnedNotes") || "[]");
const apiBases = location.protocol === "file:" ? ["http://localhost:3001", "http://localhost:3000"] : [""];

const templates = {
  deploy: {
    title: "Deployment checklist",
    content: "1. Run tests\n2. Build Docker image\n3. Push to ECR\n4. Deploy to EC2\n5. Check /health",
  },
  bug: {
    title: "Bug fix",
    content: "Issue:\n\nRoot cause:\n\nFix:\n\nVerification:",
  },
  learn: {
    title: "Today I learned",
    content: "Topic:\n\nWhat I understood:\n\nCommand or concept to remember:",
  },
};

function setStatus(message) {
  statusBadge.textContent = message;
  statusBadge.dataset.state = message.toLowerCase();
}

function resetForm() {
  noteIdInput.value = "";
  form.reset();
  saveButton.textContent = "Save note";
  formTitle.textContent = "Create note";
  updateCharacterCount();
  titleInput.focus();
}

function renderNotes() {
  noteCount.textContent = String(notes.length);
  const visibleNotes = sortNotes(
    notes.filter((note) => {
      const haystack = `${note.title} ${note.content}`.toLowerCase();
      return haystack.includes(searchTerm.toLowerCase());
    })
  );

  if (visibleNotes.length === 0) {
    const message = notes.length === 0 ? "No notes yet. Add your first deployment thought." : "No notes match your search.";
    notesContainer.innerHTML = `<div class="empty">${message}</div>`;
    return;
  }

  notesContainer.innerHTML = visibleNotes
    .map(
      (note) => `
        <article class="note-card ${isPinned(note._id) ? "is-pinned" : ""}">
          <div>
            <div class="card-topline">
              <span>${isPinned(note._id) ? "Pinned" : "Note"}</span>
              <button type="button" class="icon-button" data-action="pin" data-id="${note._id}" aria-label="${isPinned(note._id) ? "Unpin" : "Pin"} note">
                ${isPinned(note._id) ? "Unpin" : "Pin"}
              </button>
            </div>
            <h3>${highlightMatch(note.title)}</h3>
            <p>${escapeHtml(note.content)}</p>
          </div>
          <time datetime="${note.updatedAt}">${formatDate(note.updatedAt)}</time>
          <footer>
            <button type="button" data-action="edit" data-id="${note._id}">Edit</button>
            <button type="button" class="secondary small" data-action="copy" data-id="${note._id}">Copy</button>
            <button type="button" class="danger" data-action="delete" data-id="${note._id}">Delete</button>
          </footer>
        </article>
      `
    )
    .join("");
}

function sortNotes(items) {
  return [...items].sort((first, second) => {
    const firstPinned = isPinned(first._id);
    const secondPinned = isPinned(second._id);

    if (firstPinned !== secondPinned) {
      return firstPinned ? -1 : 1;
    }

    if (sortMode === "title") {
      return first.title.localeCompare(second.title);
    }

    if (sortMode === "oldest") {
      return new Date(first.createdAt) - new Date(second.createdAt);
    }

    return new Date(second.updatedAt) - new Date(first.updatedAt);
  });
}

function isPinned(id) {
  return pinnedNotes.includes(id);
}

function togglePinned(id) {
  pinnedNotes = isPinned(id) ? pinnedNotes.filter((noteId) => noteId !== id) : [...pinnedNotes, id];
  localStorage.setItem("pinnedNotes", JSON.stringify(pinnedNotes));
}

function highlightMatch(value) {
  const escapedValue = escapeHtml(value);
  const term = searchTerm.trim();

  if (!term) return escapedValue;

  const escapedTerm = escapeRegExp(escapeHtml(term));
  return escapedValue.replace(new RegExp(`(${escapedTerm})`, "ig"), "<mark>$1</mark>");
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2200);
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

function updateCharacterCount() {
  characterCount.textContent = `${contentInput.value.length} / 5000`;
}

async function request(path, options = {}) {
  let lastError;

  for (const base of apiBases) {
    try {
      const response = await fetch(`${base}${path}`, {
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
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError;
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
  showToast(id ? "Note updated" : "Note saved");
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
    updateCharacterCount();
    saveButton.textContent = "Update note";
    formTitle.textContent = "Edit note";
    titleInput.focus();
  }

  if (button.dataset.action === "pin") {
    togglePinned(note._id);
    renderNotes();
    showToast(isPinned(note._id) ? "Note pinned" : "Note unpinned");
  }

  if (button.dataset.action === "copy") {
    await navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    showToast("Note copied");
  }

  if (button.dataset.action === "delete") {
    const confirmed = window.confirm(`Delete "${note.title}"?`);
    if (!confirmed) return;

    setStatus("Deleting...");
    await request(`/api/notes/${note._id}`, { method: "DELETE" });
    await loadNotes();
    showToast("Note deleted");
  }
});

contentInput.addEventListener("input", updateCharacterCount);

searchInput.addEventListener("input", (event) => {
  searchTerm = event.target.value;
  renderNotes();
});

sortInput.addEventListener("change", (event) => {
  sortMode = event.target.value;
  renderNotes();
});

document.querySelector(".quick-templates").addEventListener("click", (event) => {
  const button = event.target.closest("[data-template]");
  if (!button) return;

  const template = templates[button.dataset.template];
  titleInput.value = template.title;
  contentInput.value = template.content;
  updateCharacterCount();
  titleInput.focus();
});

updateCharacterCount();

loadNotes().catch((error) => {
  console.error(error);
  setStatus("Offline");
  notesContainer.innerHTML = '<div class="empty">Could not load notes. Check the API and MongoDB containers.</div>';
});
