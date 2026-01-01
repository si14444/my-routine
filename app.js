let checklistItems = [];

async function loadItems() {
  try {
    if (window.electronAPI && window.electronAPI.loadData) {
      const saved = await window.electronAPI.loadData();
      if (saved) {
        checklistItems = saved;
        console.log("로드된 항목:", checklistItems.length);
      } else {
        console.log("저장된 데이터 없음");
      }
    }
  } catch (error) {
    console.error("로드 오류:", error);
    checklistItems = [];
  }
}

async function saveItems() {
  try {
    if (window.electronAPI && window.electronAPI.saveData) {
      await window.electronAPI.saveData(checklistItems);
      console.log("저장 성공 - 항목 수:", checklistItems.length);
      return true;
    }
  } catch (error) {
    console.error("저장 오류:", error);
    let msg = "저장 실패: " + error.message;
    alert(msg);
    return false;
  }
}

function renderChecklist() {
  const checklist = document.getElementById("checklist");
  const status = document.getElementById("status");

  checklist.innerHTML = "";

  let uncheckedCount = 0;

  checklistItems.forEach((item, index) => {
    const li = document.createElement("li");
    li.style.cursor = "pointer";
    li.onclick = () => toggleItem(index); // Toggle entire row on click

    if (item.completed) {
      li.classList.add("active-row");
    }

    // Checkbox element REMOVED entirely

    const text = document.createElement("span");
    text.className = "item-text";
    if (item.completed) {
      text.classList.add("completed");
    }
    text.textContent = item.text;

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "Remove";
    deleteBtn.onclick = (e) => {
      e.stopPropagation(); // Prevent row toggle when deleting
      deleteItem(index);
    };

    // Only append text and delete button
    li.appendChild(text);
    li.appendChild(deleteBtn);
    checklist.appendChild(li);

    if (!item.completed) {
      uncheckedCount++;
    }
  });

  if (uncheckedCount === 0) {
    status.textContent = "All tasks completed.";
  } else {
    status.textContent = `${uncheckedCount} tasks remaining`;
  }

  return uncheckedCount;
}

function addItem() {
  const input = document.getElementById("newItem");
  const text = input.value.trim();

  console.log("=== addItem 시작 ===");
  console.log("입력 텍스트:", `"${text}"`);
  console.log("현재 항목 수:", checklistItems.length);

  if (!text) {
    console.log("오류: 빈 텍스트");
    input.focus();
    return;
  }

  const newItem = {
    text: text,
    completed: false,
    createdAt: new Date().toISOString(),
    id: Date.now(), // 고유 ID 추가
  };

  checklistItems.push(newItem);
  console.log("추가된 항목:", newItem);
  console.log("전체 목록:", checklistItems);

  input.value = "";
  input.focus();

  const saved = saveItems();
  if (saved) {
    const rendered = renderChecklist();
    console.log("렌더링 완료, 남은 항목:", rendered);
    console.log("=== addItem 성공 ===");
  }
}

function toggleItem(index) {
  checklistItems[index].completed = !checklistItems[index].completed;
  saveItems();
  renderChecklist();
}

function deleteItem(index) {
  checklistItems.splice(index, 1);
  saveItems();
  renderChecklist();
}

function checkAndNotify() {
  const uncheckedCount = renderChecklist();

  if (uncheckedCount > 0) {
    const uncheckedItems = checklistItems.filter((item) => !item.completed);
    const itemTexts = uncheckedItems
      .slice(0, 3)
      .map((item) => item.text)
      .join(", ");

    if (window.electronAPI && window.electronAPI.showNotification) {
      window.electronAPI.showNotification({
        title: "Routine Check",
        body: `${uncheckedCount} tasks remaining: ${itemTexts}${
          uncheckedItems.length > 3 ? "..." : ""
        }`,
      });
    }
  }
}

document.getElementById("newItem").addEventListener("keypress", function (e) {
  if (e.key === "Enter") {
    addItem();
  }
});

// 초기화 시 비동기 로드 대기
async function init() {
  await loadItems();
  renderChecklist();

  // Check every 1 hour (3600000 ms)
  setInterval(checkAndNotify, 3600000);
}

init();
