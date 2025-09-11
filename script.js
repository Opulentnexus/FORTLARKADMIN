// ------------------- Firebase Imports -------------------
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// ------------------- Firebase Config -------------------
const firebaseConfig = {
  apiKey: "AIzaSyD1j1NOcVwyPR3LAw025JBHM_1dN_G6qUc",
  authDomain: "fortlark.firebaseapp.com",
  projectId: "fortlark",
  storageBucket: "fortlark.firebasestorage.app",
  messagingSenderId: "908161926384",
  appId: "1:908161926384:web:582dfda11536e1bd6c2e35",
  measurementId: "G-YH4LFRZNFL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ------------------- Elements -------------------
const loginPage = document.getElementById("login-page");
const adminPage = document.getElementById("admin-page");
const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const errorMsg = document.getElementById("error-msg");

// ------------------- Hide admin page by default -------------------
adminPage.classList.add("hidden");

// ------------------- Login -------------------
loginBtn.addEventListener("click", () => {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      errorMsg.textContent = "";
    })
    .catch(error => {
      errorMsg.textContent = error.message;
    });
});










// ------------------- Auth State -------------------
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginPage.classList.add("hidden");
    adminPage.classList.remove("hidden");
    loadUsersPayments(); // ✅ load users only after login
  } else {
    loginPage.classList.remove("hidden");
    adminPage.classList.add("hidden");
  }
});

// ------------------- Sidebar Navigation -------------------
window.showSection = function(sectionId) {
  document.querySelectorAll(".content-section").forEach(sec => sec.classList.remove("active"));
  document.getElementById(sectionId).classList.add("active");

  if (sectionId === "users") initAddUserForm();
  if (sectionId === "payments") loadUsersPayments();
};

// ------------------- Generate Months -------------------
function generateMonths(startMonth, count) {
  const months = [];
  const [year, month] = startMonth.split("-").map(Number);
  for (let i = 0; i < count; i++) {
    const d = new Date(year, month - 1 + i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

// ------------------- Load Users Table with Payments -------------------
async function loadUsersPayments() {
  const usersTable = document.querySelector("#users-table tbody");
  if (!usersTable) return;
  usersTable.innerHTML = "";

  try {
    const querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach(userDoc => {
      const user = userDoc.data();
      const tr = document.createElement("tr");

      // Name, Email, Phone
     // ---------------- User Info (Name, Email, Phone, Chit Type) ----------------
let chitTypeText = "";
if (user.chitType === "normal") {
  chitTypeText = `Normal (${user.scheme || "2500"})`;
} else if (user.chitType === "gold") {
  chitTypeText = "Gold";
} else if (user.chitType === "both") {
  chitTypeText = `Both (Normal: ${user.scheme || "2500"}, Gold: 3000)`;
} else {
  chitTypeText = "N/A";
}

tr.innerHTML = `
  <td>${user.name}</td>
  <td>${user.email}</td>
  <td>${user.phone || ""}</td>
  <td>${chitTypeText}</td>
`;


// Payments column
const paymentTd = document.createElement("td");

// ---------------- NORMAL CHIT ----------------
if (user.chitType === "normal" || user.chitType === "both") {
  const normalMonths = generateMonths(user.registrationMonth || "2025-01", 10);

  // ✅ decide scheme amount based on saved scheme
  const schemeAmount =
    user.scheme === "2500" ? 2500 :
    user.scheme === "3000" ? 3000 :
    2600; // fallback for old users

  normalMonths.forEach(month => {
    const btn = document.createElement("button");
    const paid = user.payments?.normal?.[month]?.status;

    btn.textContent = paid ? "Paid" : "Unpaid";
    btn.style.margin = "2px";
    btn.style.padding = "6px 10px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.background = paid ? "green" : "grey";
    btn.style.color = "white";
    btn.title = `₹${schemeAmount} for ${month} (Normal)`;

    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!user.payments) user.payments = {};
      if (!user.payments.normal) user.payments.normal = {};

      const current = user.payments.normal[month] || { status: false, amount: 0 };
      const newStatus = !current.status;

      user.payments.normal[month] = {
        status: newStatus,
        amount: newStatus ? schemeAmount : 0
      };

      await updateDoc(doc(db, "users", userDoc.id), { payments: user.payments });

      btn.textContent = newStatus ? "Paid" : "Unpaid";
      btn.style.background = newStatus ? "green" : "red";
    });

    paymentTd.appendChild(btn);
  });

  if (user.chitType === "both") {
    paymentTd.appendChild(document.createElement("br")); // ✅ gap before gold chit
  }
}

// ---------------- GOLD CHIT ----------------
if (user.chitType === "gold" || user.chitType === "both") {
  const goldMonths = generateMonths(user.registrationMonth || "2025-01", 10);

  goldMonths.forEach(month => {
    const btn = document.createElement("button");
    const paid = user.payments?.gold?.[month]?.status;

    btn.textContent = paid ? "Paid" : "Unpaid";
    btn.style.margin = "2px";
    btn.style.padding = "6px 10px";
    btn.style.border = "none";
    btn.style.borderRadius = "6px";
    btn.style.cursor = "pointer";
    btn.style.background = paid ? "green" : "orange";
    btn.style.color = "white";
    btn.title = `₹3000 for ${month} (Gold)`;

    btn.addEventListener("click", async (e) => {
      e.stopPropagation();

      if (!user.payments) user.payments = {};
      if (!user.payments.gold) user.payments.gold = {};

      const current = user.payments.gold[month] || { status: false, amount: 0 };
      const newStatus = !current.status;

      user.payments.gold[month] = {
        status: newStatus,
        amount: newStatus ? 3000 : 0
      };

      await updateDoc(doc(db, "users", userDoc.id), { payments: user.payments });

      btn.textContent = newStatus ? "Paid" : "Unpaid";
      btn.style.background = newStatus ? "green" : "yellow";
    });

    paymentTd.appendChild(btn);
  });
}

tr.appendChild(paymentTd);

      // ---------------- Profits (View) ----------------
      const profitViewTd = document.createElement("td");

      if (user.chitType === "normal") {
        profitViewTd.innerHTML = `Normal: ₹${Number(user.profits?.normal || 0)}`;
      } else if (user.chitType === "gold") {
        profitViewTd.innerHTML = `Gold: ₹${Number(user.profits?.gold || 0)}`;
      } else if (user.chitType === "both") {
        profitViewTd.innerHTML = `
          Normal: ₹${Number(user.profits?.normal || 0)} <br>
          Gold: ₹${Number(user.profits?.gold || 0)}
        `;
      }

      profitViewTd.style.fontWeight = "bold";
      profitViewTd.style.color = "#2e7d32";
      tr.appendChild(profitViewTd);

      // ---------------- Profits (Edit) ----------------
      const profitTd = document.createElement("td");

      // Keep references for update
      let normalInput, goldInput;

      if (user.chitType === "normal" || user.chitType === "both") {
        normalInput = document.createElement("input");
        normalInput.type = "number";
        normalInput.min = "0";
        normalInput.step = "1";
        normalInput.value = Number(user.profits?.normal || 0);
        normalInput.style.width = "80px";
        normalInput.style.marginBottom = "4px";
        profitTd.appendChild(normalInput);

        if (user.chitType === "both") {
          profitTd.appendChild(document.createElement("br"));
        }
      }

      if (user.chitType === "gold" || user.chitType === "both") {
        goldInput = document.createElement("input");
        goldInput.type = "number";
        goldInput.min = "0";
        goldInput.step = "1";
        goldInput.value = Number(user.profits?.gold || 0);
        goldInput.style.width = "80px";
        profitTd.appendChild(goldInput);
      }

      const saveProfitBtn = document.createElement("button");
      saveProfitBtn.textContent = "Save";
      saveProfitBtn.style.marginLeft = "8px";
      saveProfitBtn.style.padding = "6px 10px";
      saveProfitBtn.style.border = "none";
      saveProfitBtn.style.borderRadius = "6px";
      saveProfitBtn.style.cursor = "pointer";
      saveProfitBtn.style.background = "#1976d2";
      saveProfitBtn.style.color = "white";

      saveProfitBtn.addEventListener("click", async (e) => {
        e.stopPropagation();

        const newNormal = normalInput ? Number(normalInput.value) || 0 : 0;
        const newGold = goldInput ? Number(goldInput.value) || 0 : 0;

        await updateDoc(doc(db, "users", userDoc.id), {
          profits: { normal: newNormal, gold: newGold }
        });

        if (user.chitType === "normal") {
          profitViewTd.innerHTML = `Normal: ₹${newNormal}`;
        } else if (user.chitType === "gold") {
          profitViewTd.innerHTML = `Gold: ₹${newGold}`;
        } else {
          profitViewTd.innerHTML = `
            Normal: ₹${newNormal} <br>
            Gold: ₹${newGold}
          `;
        }

        alert(`Profits updated for ${user.name}`);
      });

      profitTd.appendChild(saveProfitBtn);
      tr.appendChild(profitTd);

      // Delete column
      const deleteTd = document.createElement("td");
      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.style.background = "#d32f2f";
      deleteBtn.style.color = "white";
      deleteBtn.style.border = "none";
      deleteBtn.style.borderRadius = "5px";
      deleteBtn.style.padding = "8px 12px";
      deleteBtn.style.fontSize = "1rem";
      deleteBtn.style.cursor = "pointer";

      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation();
        if (confirm("Are you sure you want to delete this user?")) {
          await deleteDoc(doc(db, "users", userDoc.id));
          await loadUsersPayments();
          alert("User deleted successfully!");
        }
      });

      deleteTd.appendChild(deleteBtn);
      tr.appendChild(deleteTd);

      usersTable.appendChild(tr);
    });
  } catch (err) {
    console.error("Error loading users:", err.message);
  }
}

// ------------------- Add User Form -------------------
let addUserInitDone = false; // ✅ prevent multiple listeners

function initAddUserForm() {
  if (addUserInitDone) return;
  addUserInitDone = true;

  const chitTypeSelect = document.getElementById("newChitType");
  const schemeContainer = document.getElementById("schemeContainer");
  const schemeSelect = document.getElementById("normalScheme");

  // 🔹 Show / Hide scheme dropdown
  chitTypeSelect.addEventListener("change", () => {
    if (chitTypeSelect.value === "normal" || chitTypeSelect.value === "both") {
      schemeContainer.style.display = "block";
      schemeSelect.setAttribute("required", "true");
    } else {
      schemeContainer.style.display = "none";
      schemeSelect.removeAttribute("required");
      schemeSelect.value = "";
    }
  });

  const addBtn = document.getElementById("addUserBtn");
  if (!addBtn) return;

  addBtn.addEventListener("click", async () => {
    const name = document.getElementById("newName").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const number = document.getElementById("newNumber").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const startMonth = document.getElementById("newStartMonth").value.trim();
    const chitType = chitTypeSelect.value.trim();
    const scheme = schemeSelect.value.trim(); // ✅ capture scheme
    const msg = document.getElementById("addUserMsg");

    if (!name || !email || !number || !password || !startMonth || !chitType) {
      msg.textContent = "Please fill all fields.";
      msg.style.color = "red";
      return;
    }

    if ((chitType === "normal" || chitType === "both") && !scheme) {
      msg.textContent = "Please select a scheme for Normal chit.";
      msg.style.color = "red";
      return;
    }

    try {
      const uid = email.replace(/[@.]/g, "_");

      await setDoc(doc(db, "users", uid), {
        name,
        email,
        phone: number,
        password: password,
        registrationMonth: startMonth,
        chitType: chitType,
        scheme: chitType === "normal" || chitType === "both" ? scheme : null, // ✅ save scheme
        payments: { normal: {}, gold: {} },
        profits: { normal: 0, gold: 0 }
      });

      msg.textContent = "User added successfully!";
      msg.style.color = "green";

      // Clear inputs
      document.getElementById("newName").value = "";
      document.getElementById("newEmail").value = "";
      document.getElementById("newNumber").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("newStartMonth").value = "";
      chitTypeSelect.value = "";
      schemeSelect.value = "";
      schemeContainer.style.display = "none";

      loadUsersPayments();

    } catch (err) {
      msg.textContent = "Error adding user: " + err.message;
      msg.style.color = "red";
    }
  });
}


