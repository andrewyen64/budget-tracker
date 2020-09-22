let db;
// Create a new request for a "budget" database.
const request = indexedDB.open("budget", 1);

request.onupgradeneeded = function (event) {
  // Creates an object store called "pending" and sets autoIncrement to true
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// Checks if the app is online before reading from db
request.onsuccess = function (event) {
    db = event.target.result;    
  if (navigator.onLine) {
    checkDatabase();
  }
};

// Send a message if there is an error
request.onerror = function (event) {
  console.log("Oops! You got an error: " + event.target.errorCode);
};

function saveRecord(record) {
  // Create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");
  // Access the pending object store
  const store = transaction.objectStore("pending");
  // Add record to the store with the add method
  store.add(record);
}

function checkDatabase() {
  // Open a transaction on the pending db
  const transaction = db.transaction(["pending"], "readwrite");
  // Access the pending object store
  const store = transaction.objectStore("pending");
  // Get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // If successful, open a transaction on the pending db
          const transaction = db.transaction(["pending"], "readwrite");
          // Access the pending object store
          const store = transaction.objectStore("pending");
          // Clear all items in the store
          store.clear();
        });
    }
  };
}

// Listener for the app when coming back online
window.addEventListener("online", checkDatabase);
