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
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <strong>Participants</strong>
            ${
              details.participants.length > 0
                ? `<ul>${details.participants
                    .map(
                      (participant) =>
                        `<li><span>${participant}</span><button class="remove-participant" type="button" data-activity="${encodeURIComponent(name)}" data-participant="${encodeURIComponent(participant)}" aria-label="Remove ${participant}" title="Remove participant">&#128465;</button></li>`
                    )
                    .join("")}</ul>`
                : "<p class=\"no-participants\">No participants yet</p>"
            }
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });

        activitiesList.querySelectorAll(".remove-participant").forEach((button) => {
          button.addEventListener("click", async () => {
            const activityName = decodeURIComponent(button.dataset.activity);
            const participant = decodeURIComponent(button.dataset.participant);

            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(activityName)}/participants/${encodeURIComponent(participant)}`,
                { method: "DELETE" }
              );

              if (!response.ok) {
                throw new Error("Failed to unregister participant");
              }

              const participantItem = button.closest("li");
              const activityCard = button.closest(".activity-card");
              participantItem.remove();

              const participantList = activityCard.querySelector(".participants-section ul");
              if (participantList.children.length === 0) {
                participantList.outerHTML = '<p class="no-participants">No participants yet</p>';
              }

              const availability = activityCard.querySelector("p:nth-of-type(3)");
              const currentSpots = Number(availability.textContent.match(/\d+/)[0]);
              availability.innerHTML = `<strong>Availability:</strong> ${currentSpots + 1} spots left`;
            } catch (error) {
              console.error("Error removing participant:", error);
            }
          });
        });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

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
        await fetchActivities();
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
});
