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

function createDiv(word, x, y) {
  const existing = document.getElementById("pop-up");
  if (existing) {
    existing.querySelector("h2").textContent = word;
    existing.style.left = x + 50 + "px";
    existing.style.top = y + "px";
    return;
  }

  let div = document.createElement("div"); //creating div
  div.id = "pop-up";
  div.style.position = "fixed";
  div.style.top = y + "px";
  div.style.left = x + 50 + "px";
  div.innerHTML = `
  <div class="modal-header">
    <h2>${word}</h2>
  </div>

  <div class="content">
    <p>definition here</p>
  </div>
  `;

  document.body.appendChild(div);
}

function showHighlightedText() {
  const selectedText = getHighlightedWord();
  if (selectedText.trim()) {
    const rect = window.getSelection().getRangeAt(0).getBoundingClientRect();
    createDiv(selectedText, rect.left, rect.top);
  }
}

document.addEventListener("mousedown", function (e) {
  const popup = document.getElementById("pop-up");
  if (popup && e.target.id !== "pop-up") {
    popup.remove();
  }
});

document.onmouseup = showHighlightedText;
document.onkeyup = showHighlightedText;
