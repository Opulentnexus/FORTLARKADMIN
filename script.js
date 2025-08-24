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
  } else {
    loginPage.classList.remove("hidden");
    adminPage.classList.add("hidden");
  }
});



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
  if (sectionId === "payments") loadUsersPayments(); // optional if you have payments tab
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
      const months = generateMonths(user.registrationMonth || "2025-01"); // default month if missing
      months.forEach(month => {
        const btn = document.createElement("button");
        const paid = user.payments && user.payments[month];
        btn.textContent = paid ? "Paid" : "Unpaid";
        btn.style.margin = "2px";
        btn.style.padding = "5px";
        btn.style.background = paid ? "green" : "red";
        btn.style.color = "white";

        // Payment toggle listener
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const newStatus = !paid;
          if (!user.payments) user.payments = {};
          user.payments[month] = newStatus;
          await updateDoc(doc(db, "users", userDoc.id), { payments: user.payments });
          btn.textContent = newStatus ? "Paid" : "Unpaid";
          btn.style.background = newStatus ? "green" : "red";
        });

        paymentTd.appendChild(btn);
      });
      tr.appendChild(paymentTd);

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

      // Delete listener attached immediately
      deleteBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // prevents tap issues on mobile
        if (confirm("Are you sure you want to delete this user?")) {
          await deleteDoc(doc(db, "users", userDoc.id));
          await loadUsersPayments(); // reload table after deletion
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
  if (!addBtn) return; // prevent errors if form is missing

  addBtn.addEventListener("click", async () => {
    const name = document.getElementById("newName").value.trim();
    const email = document.getElementById("newEmail").value.trim();
    const number = document.getElementById("newNumber").value.trim();
    const password = document.getElementById("newPassword").value.trim(); // NEW
    const startMonth = document.getElementById("newStartMonth").value.trim();
    const msg = document.getElementById("addUserMsg");

    if (!name || !email || !number || !password || !startMonth) { // check password
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
        password: password, // NEW
        registrationMonth: startMonth,
        payments: {}
      });

      msg.textContent = "User added successfully!";
      msg.style.color = "green";

      // Clear form
      document.getElementById("newName").value = "";
      document.getElementById("newEmail").value = "";
      document.getElementById("newNumber").value = "";
      document.getElementById("newPassword").value = ""; // NEW
      document.getElementById("newStartMonth").value = "";

    } catch (err) {
      msg.textContent = "Error adding user: " + err.message;
      msg.style.color = "red";
    }
  });
}
