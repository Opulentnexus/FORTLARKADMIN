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

// ------------------- Logout -------------------
logoutBtn.addEventListener("click", () => {
  signOut(auth);
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

// ------------------- Generate 10 Months -------------------
function generateMonths(startMonth) {
  const months = [];
  const [year, month] = startMonth.split("-").map(Number);
  for (let i = 0; i < 10; i++) {
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
      tr.innerHTML = `<td>${user.name}</td><td>${user.email}</td><td>${user.phone || ""}</td>`;

      // Payments column
      const paymentTd = document.createElement("td");
      const months = generateMonths(user.registrationMonth || "2025-01");

      months.forEach(month => {
        const btn = document.createElement("button");
        const paid = user.payments && user.payments[month] && user.payments[month].status;

        btn.textContent = paid ? "Paid" : "Unpaid";
        btn.style.margin = "2px";
        btn.style.padding = "5px";
        btn.style.background = paid ? "green" : "red";
        btn.style.color = "white";

        btn.addEventListener("click", async (e) => {
          e.stopPropagation();

          if (!user.payments) user.payments = {};
          const current = user.payments[month] || { status: false, amount: 0 };
          const newStatus = !current.status;

          user.payments[month] = {
            status: newStatus,
            amount: newStatus ? 3000 : 0
          };

          await updateDoc(doc(db, "users", userDoc.id), {
            payments: user.payments
          });

          // Update button instantly
          btn.textContent = newStatus ? "Paid" : "Unpaid";
          btn.style.background = newStatus ? "green" : "red";
        });

        paymentTd.appendChild(btn);
      });
      tr.appendChild(paymentTd);

      // Profit (Latest) column
      const profitViewTd = document.createElement("td");
      profitViewTd.textContent = `₹${Number(user.profit || 0)}`;
      profitViewTd.style.fontWeight = "bold";
      profitViewTd.style.color = "#2e7d32";
      tr.appendChild(profitViewTd);

      // Profit (Edit) column
      const profitTd = document.createElement("td");

      const profitInput = document.createElement("input");
      profitInput.type = "number";
      profitInput.min = "0";
      profitInput.step = "1";
      profitInput.value = Number(user.profit || 0);
      profitInput.style.width = "90px";
      profitInput.style.padding = "6px";
      profitInput.style.border = "1px solid #ccc";
      profitInput.style.borderRadius = "6px";

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
        const newProfit = Number(profitInput.value) || 0;
        await updateDoc(doc(db, "users", userDoc.id), { profit: newProfit });

        // update latest profit column instantly
        profitViewTd.textContent = `₹${newProfit}`;
        alert(`Profit updated to ₹${newProfit} for ${user.name}`);
      });

      profitTd.appendChild(profitInput);
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
function initAddUserForm() {
  const addBtn = document.getElementById("addUserBtn");
  if (!addBtn) return;

  addBtn.addEventListener("click", async () => {
    const name = document.getElementById("newName").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const number = document.getElementById("newNumber").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const startMonth = document.getElementById("newStartMonth").value.trim();
    const msg = document.getElementById("addUserMsg");

    if (!name || !email || !number || !password || !startMonth) {
      msg.textContent = "Please fill all fields.";
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
        payments: {},
        profit: 0
      });

      msg.textContent = "User added successfully!";
      msg.style.color = "green";

      document.getElementById("newName").value = "";
      document.getElementById("newEmail").value = "";
      document.getElementById("newNumber").value = "";
      document.getElementById("newPassword").value = "";
      document.getElementById("newStartMonth").value = "";

    } catch (err) {
      msg.textContent = "Error adding user: " + err.message;
      msg.style.color = "red";
    }
  });
}

// ------------------- Winner Top-up -------------------
document.getElementById("winner-topup-form").addEventListener("submit", async function(e) {
  e.preventDefault();
  const amount = document.getElementById("winner-amount").value.trim();
  const date = document.getElementById("winner-date").value.trim();

  if (!amount || !date) {
    document.getElementById("topup-msg").textContent = "Please enter both amount and date!";
    return;
  }

  try {
    await setDoc(doc(db, "settings", "winnerTopup"), {
      amount: amount,
      date: date
    });

    document.getElementById("topup-msg").textContent =
      `✅ Winner top-up of ₹${amount} set for ${date}!`;
  } catch (err) {
    console.error("Error saving topup:", err);
    document.getElementById("topup-msg").textContent = "❌ Error saving topup!";
  }
});

