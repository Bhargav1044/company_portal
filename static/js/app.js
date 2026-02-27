/* ================= COMMON UI ================= */

function showScreen(id) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    const target = document.getElementById(id);
    if (target) {
        target.classList.add('active');
    }
}

function showError(id, message) {
    const el = document.getElementById(id);
    if (!el) return;

    el.textContent = message;
    el.classList.add('show');
}

/* =====================================================
   FIRST LOGIN  (login.html)
===================================================== */

const firstLoginForm = document.getElementById('firstLoginForm');

if (firstLoginForm) {
    firstLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const response = await fetch('/api/first-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: document.getElementById('companyEmail').value,
                password: document.getElementById('companyPassword').value
            })
        });

        const data = await response.json();

        if (response.ok) {
            if (data.role === 'admin') {
                window.location.href = "/admin";
            } else {
                window.location.href = "/portal";
            }
        } else {
            showError('firstLoginError', data.error);
        }
    });
}

/* =====================================================
   SIGN UP  (user.html)
===================================================== */

const signUpForm = document.getElementById('signUpForm');

if (signUpForm) {
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('signUpName').value.trim();
        const password = document.getElementById('signUpPassword').value;
        const confirmPassword = document.getElementById('signUpConfirmPassword').value;

        if (password !== confirmPassword) {
            return showError('signUpError', 'Passwords do not match');
        }

        const response = await fetch('/api/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            const successBox = document.getElementById('signUpSuccess');
            successBox.textContent = "Request submitted!";
            successBox.classList.add('show');
        } else {
            showError('signUpError', data.error);
        }
    });
}

/* =====================================================
   SIGN IN  (user.html)
===================================================== */

const signInForm = document.getElementById('signInForm');

if (signInForm) {
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const response = await fetch('/api/signin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: document.getElementById('signInName').value,
                password: document.getElementById('signInPassword').value
            })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem("username", data.username || document.getElementById('signInName').value);
            window.location.href = "/user-dashboard";
        } else {
            showError('signInError', data.error);
        }
    });
}

/* =====================================================
   ADMIN PANEL  (admin.html)
===================================================== */
async function loadAdminPanel() {
    const response = await fetch('/api/adminpanel');
    if (!response.ok) return;

    const data = await response.json();

    document.getElementById('approvedCount').textContent = data.approved_count;
    document.getElementById('pendingCount').textContent = data.pending_count;

    /* ================= PENDING ================= */

    const pendingList = document.getElementById('pendingList');

    if (data.pending_users.length === 0) {
        pendingList.innerHTML = "<p>No pending requests</p>";
    } else {
    pendingList.innerHTML = data.pending_users.map(user => `
        <div class="admin-card">
            <span class="badge badge-blocked">Pending</span>
            <h4>${user.username}</h4>

            <button class="btn-sm btn-edit"
                    onclick="approveUser('${user.id}')">
                    Approve
            </button>

            <button class="btn-sm btn-remove"
                    onclick="rejectUser('${user.id}')">
                    Reject
            </button>
        </div>
    `).join("");
}

    /* ================= APPROVED ================= */

    const approvedList = document.getElementById('approvedList');

    if (data.approved_users.length === 0) {
        approvedList.innerHTML = "<p>No approved users</p>";
    } else {
        approvedList.innerHTML = data.approved_users.map(user => `
            <div class="admin-card">
                <span class="badge ${user.blocked ? 'badge-blocked' : 'badge-approved'}">
                    ${user.blocked ? 'Blocked' : 'Approved'}
                </span>

                <h4>${user.username}</h4>

                <button class="btn-sm btn-edit"
                        onclick="editUser('${user.username}')">
                        Edit
                </button>

                <button class="btn-sm btn-block"
                        onclick="toggleBlock('${user.username}')">
                        ${user.blocked ? 'Unblock' : 'Block'}
                </button>

                <button class="btn-sm btn-remove"
                        onclick="removeUser('${user.username}')">
                        Remove
                </button>
            </div>
        `).join("");
    }
}

/* =====================================================
   ADMIN ACTIONS
===================================================== */

async function approveUser(userId) {
    const response = await fetch(`/api/approve_user/${userId}`, {
        method: "POST"
    });

    const data = await response.json();

    if (data.success) {
        loadAdminPanel();
        alert("User approved successfully!");
    } else {
        alert("Error approving user");
    }
}

async function toggleBlock(username) {
    await fetch('/api/admin/block', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });

    loadAdminPanel();
}

async function removeUser(username) {
    if (!confirm("Remove this user permanently?")) return;

    await fetch('/api/admin/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username })
    });

    loadAdminPanel();
}

async function editUser(oldUsername) {
    const newUsername = prompt("Enter new username:");
    const newPassword = prompt("Enter new password:");

    if (!newUsername || !newPassword) return;

    await fetch('/api/admin/edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            oldUsername,
            newUsername,
            newPassword
        })
    });

    loadAdminPanel();
}

async function rejectUser(userId) {
    if (!confirm("Reject this signup request?")) return;

    const response = await fetch(`/api/reject_user/${userId}`, {
        method: "POST"
    });

    const data = await response.json();

    if (data.success) {
        loadAdminPanel();
        alert("User request rejected.");
    } else {
        alert("Error rejecting user.");
    }
}

function togglePassword(inputId, icon) {
    const input = document.getElementById(inputId);

    if (input.type === "password") {
        input.type = "text";
        icon.textContent = "🙈";
    } else {
        input.type = "password";
        icon.textContent = "👁";
    }
}