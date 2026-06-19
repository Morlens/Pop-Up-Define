let saveRange = null;

function getHighlightedWord() {
  let text = "";
  if (typeof window.getSelection != "undefined") {
    text = window.getSelection().toString();
  } else if (
    typeof document.selection != "undefined" &&
    document.selection.type == "Text"
  ) {
    text = document.selection.createRange().text;
  }
  return text;
}

async function createDiv(word, x, y, flipped) {
  const existing = document.getElementById("pop-up");
  if (existing) {
    existing.querySelector("h2").textContent =
      word.charAt(0).toUpperCase() + word.slice(1);
    existing.querySelector("p").textContent = "Loading...";
    existing.style.left = x + "px";
    existing.style.top = y + "px";
    fetchDefinition(
      word,
      existing.querySelector("p"),
      existing.querySelector(".pos-label"),
    );
    return;
  }

  let div = document.createElement("div"); //creating div
  div.id = "pop-up";
  div.style.position = "absolute";
  div.style.top = y + "px";
  div.style.left = x + "px";
  div.innerHTML = `
  <div class="modal-header">
    <h2>${word.charAt(0).toUpperCase() + word.slice(1)}</h2>
    <span class="pos-label"></span>
  </div>

  <div class="content">
    <p>Loading...</p>
  </div>
  `;

  document.body.appendChild(div);
  if (flipped) div.classList.add("flipped");
  div.addEventListener(
    "wheel",
    (e) => {
      const content = div.querySelector(".content");
      content.scrollTop += e.deltaY * 0.8;
      e.preventDefault();
    },
    { passive: false },
  );
  fetchDefinition(
    word,
    div.querySelector("p"),
    div.querySelector(".pos-label"),
  );
}

function showHighlightedText() {
  const selectedText = getHighlightedWord();
  const activeEl = document.activeElement;
  const cleanSelectedText =
    selectedText.trim().split(/\s+/).length > 1
      ? selectedText.trim()
      : selectedText.trim().replace(/[^a-zA-Z]/g, "");
  if (selectedText.trim().length > 50) return;
  if (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") return;
  const popup = document.getElementById("pop-up");

  //this ensures that if you highlight word inside pop-up it does not create
  //another popup
  if (popup && popup.contains(window.getSelection().anchorNode)) return;
  // if (selectedText.trim().split(/\s+/).length > 1) return;
  if (selectedText.includes("-")) return;
  if (!cleanSelectedText) return;

  if (selectedText.trim()) {
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    const popupWidth = 250;
    const spaceOnRight = window.innerWidth - rect.right;
    const flipped = spaceOnRight <= popupWidth;
    const x =
      spaceOnRight > popupWidth
        ? rect.right + window.scrollX + 10
        : rect.left + window.scrollX - popupWidth - 10;

    createDiv(cleanSelectedText, x, rect.top + window.scrollY - 2, flipped);

    saveRange = window.getSelection().getRangeAt(0);
  }
}

async function fetchDefinition(word, element, labelElement) {
  if (word.includes(" ")) {
    fetchWiki(word, element);
    return;
  }
  try {
    const response = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`,
    );
    const data = await response.json();
    // console.log(data);
    const definition = data[0]?.meanings[0]?.definitions[0]?.definition;
    const partOfSpeech = data[0]?.meanings[0]?.partOfSpeech;
    if (!definition) {
      fetchWiki(word, element, labelElement);
      return;
    }
    labelElement.textContent = partOfSpeech ?? "";
    element.textContent = definition;
  } catch (error) {
    element.textContent = "Failed to fetch definition.";
  }
}

async function fetchWiki(word, element) {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&format=json&titles=${encodeURIComponent(word)}&prop=extracts&exintro&origin=*`;
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Word-Explorer/1.0",
      },
    });
    const data = await response.json();
    const pages = data.query.pages;
    const page = Object.values(pages)[0];
    if (page.missing !== undefined || !page.extract) {
      element.textContent = "No information found.";
      return;
    }
    element.innerHTML = page.extract ?? "No information found.";
  } catch (error) {
    element.textContent = "Failed to fetch source.";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Backspace" || e.key === "Delete") {
    const popup = document.getElementById("pop-up");
    if (popup) popup.remove();
  }
});

document.addEventListener("mousedown", function (e) {
  if (e.clientX >= document.documentElement.clientWidth - 20) return;
  const popup = document.getElementById("pop-up");
  if (popup && !popup.contains(e.target)) {
    popup.remove();
  }
});

document.addEventListener("scroll", (event) => {
  if (!saveRange) return;
  const popup = document.getElementById("pop-up");
  const rect = saveRange.getBoundingClientRect();
  if (rect.top < 0 || rect.top > innerHeight) {
    popup.remove();
  }
});
saveRange = null;

document.onmouseup = showHighlightedText;
document.onkeyup = showHighlightedText;
