(function () {
  "use strict";

  var SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyQM3heOvHQycTjXE8vSqkO8VY_tLk65ALiTDc3TNzvj2br9QdBra8lBMM8Ip_JYgv4bw/exec";
  var REQUEST_TIMEOUT_MS = 15000;
  var MAX_RETRIES = 2;
  var RETRY_DELAY_MS = 500;

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

  var MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  function formatIssueDate(value) {
    if (!value && value !== 0) {
      return "-";
    }

    var raw = String(value).trim();
    var isoLike = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);
    var slashDate = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    var longDate = raw.match(/^[A-Za-z]{3}\s+[A-Za-z]{3}\s+(\d{1,2})\s+(\d{4})/);
    var hasTimeComponent = /T\d{2}:\d{2}/.test(raw);

    if (isoLike) {
      var year = isoLike[1];
      var monthIndex = Number(isoLike[2]) - 1;
      var day = Number(isoLike[3]);

      if (monthIndex >= 0 && monthIndex < 12 && day >= 1 && day <= 31) {
        if (hasTimeComponent) {
          var corrected = new Date(Date.UTC(Number(year), monthIndex, day + 1));

          return corrected.getUTCDate() + " " + MONTH_NAMES[corrected.getUTCMonth()] + " " + corrected.getUTCFullYear();
        }

        return day + " " + MONTH_NAMES[monthIndex] + " " + year;
      }
    }

    if (slashDate) {
      var month = Number(slashDate[1]);
      var slashDay = Number(slashDate[2]);
      var slashYear = slashDate[3];

      if (month >= 1 && month <= 12 && slashDay >= 1 && slashDay <= 31) {
        return slashDay + " " + MONTH_NAMES[month - 1] + " " + slashYear;
      }
    }

    if (longDate) {
      return longDate[1] + " " + raw.split(/\s+/)[1] + " " + longDate[2];
    }

    var parsed = new Date(raw);
    if (!isNaN(parsed.getTime())) {
      return parsed.getUTCDate() + " " + MONTH_NAMES[parsed.getUTCMonth()] + " " + parsed.getUTCFullYear();
    }

    return raw;
  }

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
      var value = data[key] || "-";
      if (key === "issue_date") {
        value = formatIssueDate(data[key]);
      }
      successFields[key].textContent = value;
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

  function wait(ms) {
    return new Promise(function (resolve) {
      setTimeout(resolve, ms);
    });
  }

  function jsonpVerifyOnce(certificateId, attempt) {
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
        "callback=" + encodeURIComponent(callbackName),
        "_ts=" + Date.now(),
        "_attempt=" + attempt
      ].join("&");

      script.src = SCRIPT_URL + "?" + query;
      script.async = true;
      document.body.appendChild(script);
    });
  }

  function jsonpVerify(certificateId) {
    var attempt = 0;

    function runAttempt() {
      return jsonpVerifyOnce(certificateId, attempt)
        .catch(function (error) {
          var isNetworkType = /Unable to reach verification service|timed out/i.test(String(error && error.message));

          if (isNetworkType && attempt < MAX_RETRIES) {
            attempt += 1;
            return wait(RETRY_DELAY_MS).then(runAttempt);
          }

          throw error;
        });
    }

    return runAttempt();
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
