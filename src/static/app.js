document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear loading message
      activitiesList.innerHTML = "";
      // Reset activity select options (keep placeholder)
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        const participantsList = (details.participants || [])
          .map((p) => {
            const initial = (p && p.trim()[0]) ? p.trim()[0].toUpperCase() : "";
            // include activity and email as data attributes and add a delete button
            return `<li class="participant-item" data-activity="${name}" data-email="${p}"><span class="avatar">${initial}</span><span class="participant-email">${p}</span><button class="participant-delete" title="Unregister ${p}">&times;</button></li>`;
          })
          .join("");

        const participantsHtml = participantsList
          ? `<ul class="participants-list">${participantsList}</ul>`
          : `<p class="no-participants">No participants yet</p>`;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants">
            <h5>Participants</h5>
            ${participantsHtml}
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Delegate click events for participant deletion
  activitiesList.addEventListener("click", async (event) => {
    const btn = event.target.closest(".participant-delete");
    if (!btn) return;

    const li = btn.closest(".participant-item");
    if (!li) return;

    const email = li.dataset.email;
    const activity = li.dataset.activity;

    if (!email || !activity) return;

    if (!confirm(`Unregister ${email} from ${activity}?`)) return;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants?email=${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (response.ok) {
        li.remove();
        messageDiv.textContent = result.message || "Unregistered successfully.";
        messageDiv.className = "success";
      } else {
        messageDiv.textContent = result.detail || "Failed to unregister.";
        messageDiv.className = "error";
      }
      messageDiv.classList.remove("hidden");
      setTimeout(() => messageDiv.classList.add("hidden"), 4000);
      // refresh list to keep counts correct
      fetchActivities();
    } catch (error) {
      messageDiv.textContent = "Failed to unregister. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error unregistering:", error);
    }
  });

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        // Immediately update the UI for better UX
        addParticipantToDOM(activity, email);
        // Also refresh activities in background to keep counts accurate
        fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();

  // Helper to insert a participant into the DOM immediately after signup
  function addParticipantToDOM(activityName, email) {
    // Find the activity card by matching the header text
    const cards = Array.from(document.querySelectorAll('.activity-card'));
    const card = cards.find(c => {
      const h4 = c.querySelector('h4');
      return h4 && h4.textContent === activityName;
    });
    if (!card) return;

    const participantsContainer = card.querySelector('.participants');
    if (!participantsContainer) return;

    const ul = participantsContainer.querySelector('.participants-list');
    const initial = (email && email.trim()[0]) ? email.trim()[0].toUpperCase() : '';
    const liHtml = `<li class="participant-item" data-activity="${activityName}" data-email="${email}"><span class="avatar">${initial}</span><span class="participant-email">${email}</span><button class="participant-delete" title="Unregister ${email}">&times;</button></li>`;

    if (ul) {
      // append new list item
      ul.insertAdjacentHTML('beforeend', liHtml);
    } else {
      // replace "no participants" message with a new list
      const noEl = participantsContainer.querySelector('.no-participants');
      if (noEl) {
        noEl.remove();
      }
      participantsContainer.insertAdjacentHTML('beforeend', `<ul class="participants-list">${liHtml}</ul>`);
    }
  }
});
