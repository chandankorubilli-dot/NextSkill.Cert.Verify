(function () {
  "use strict";

  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzVUPydWW1yF0kYajzufH-Y7Llz2VN1oQEyxhMqTYgK7oVafPUO0Do0pYoA_ZVO8ESZFg/exec";
  var REQUEST_TIMEOUT_MS = 15000;

  var input = document.getElementById("certificateId");
  var verifyBtn = document.getElementById("verifyBtn");

  var loadingCard = document.getElementById("loadingCard");
  var successCard = document.getElementById("successCard");
  var errorCard = document.getElementById("errorCard");
  var errorMessage = document.getElementById("errorMessage");

  var successFields = {
    certificate_id: document.getElementById("s_certificate_id"),
    student_name: document.getElementById("s_student_name"),
    issue_date: document.getElementById("s_issue_date"),
    program_name: document.getElementById("s_program_name"),
    batch_name: document.getElementById("s_batch_name"),
    issued_by: document.getElementById("s_issued_by"),
    status: document.getElementById("s_status")
  };

  function setLoading(isLoading) {
    verifyBtn.disabled = isLoading;
    loadingCard.classList.toggle("hidden", !isLoading);
  }

  function clearResults() {
    successCard.classList.add("hidden");
    errorCard.classList.add("hidden");
    errorMessage.textContent = "No record found for this Certificate ID.";
  }

  function showSuccess(data) {
    Object.keys(successFields).forEach(function (key) {
      successFields[key].textContent = data[key] || "-";
    });

    successCard.classList.remove("hidden");
    errorCard.classList.add("hidden");
  }

  function showError(message) {
    var normalizedMessage = (message || "No record found").trim();

    if (normalizedMessage === "No record found") {
      normalizedMessage = "No record found for this Certificate ID.";
    }

    errorMessage.textContent = normalizedMessage;
    errorCard.classList.remove("hidden");
    successCard.classList.add("hidden");
  }

  function jsonpVerify(certificateId) {
    return new Promise(function (resolve, reject) {
      var callbackName = "jsonpVerifyCallback_" + Date.now() + "_" + Math.floor(Math.random() * 1000000);
      var script = document.createElement("script");
      var completed = false;

      function cleanup() {
        if (script.parentNode) {
          script.parentNode.removeChild(script);
        }
        try {
          delete window[callbackName];
        } catch (e) {
          window[callbackName] = undefined;
        }
      }

      var timeout = setTimeout(function () {
        if (completed) {
          return;
        }
        completed = true;
        cleanup();
        reject(new Error("Verification timed out. Please try again."));
      }, REQUEST_TIMEOUT_MS);

      window[callbackName] = function (response) {
        if (completed) {
          return;
        }
        completed = true;
        clearTimeout(timeout);
        cleanup();

        if (response && response.success) {
          resolve(response);
          return;
        }

        reject(new Error((response && response.error) || "No record found"));
      };

      script.onerror = function () {
        if (completed) {
          return;
        }
        completed = true;
        clearTimeout(timeout);
        cleanup();
        reject(new Error("Unable to reach verification service."));
      };

      var query = [
        "action=verify",
        "id=" + encodeURIComponent(certificateId),
        "callback=" + encodeURIComponent(callbackName)
      ].join("&");

      script.src = SCRIPT_URL + "?" + query;
      script.async = true;
      document.body.appendChild(script);
    });
  }

  function runVerification() {
    var certificateId = (input.value || "").trim();

    clearResults();

    if (!certificateId) {
      showError("Please enter a Certificate ID");
      return;
    }

    setLoading(true);

    jsonpVerify(certificateId)
      .then(function (result) {
        showSuccess(result);
      })
      .catch(function (err) {
        showError(err.message);
      })
      .finally(function () {
        setLoading(false);
      });
  }

  verifyBtn.addEventListener("click", runVerification);

  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
      runVerification();
    }
  });

  // Ensure UI starts in a clean state even if classes are altered externally.
  setLoading(false);
  clearResults();
})();
