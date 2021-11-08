let db;
let budgetVersion;

const request = indexedDB.open("budgetDB", budgetVersion || 21);

request.onupgradeneeded = function (e) {
  const { oldVersion } = e;
  const newVersion = e.newVersion || db.version;

  console.log(`DB Updated from version ${oldVersion} to ${newVersion}`);

  db = e.target.result;

  if (db.objectStoreNames.length === 0) {
    db.createObjectStore("BudgetStorage", { autoIncrement: true });
  }
};

request.onerror = function (e) {
  console.log(`Woops! ${e.target.errorCode}`);
};

function checkDatabase() {
  console.log("check database invoked");

  let transaction = db.transaction(["BudgetStorage"], "readwrite");

  const storage = transaction.objectStore("BudgetStorage");

  const getAll = storage.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((res) => {
          if (res.length !== 0) {
            transaction = db.transaction(["BudgetStorage"], "readwrite");

            const currentStore = transaction.objectStore("BudgetStorage");

            currentStore.clear();
            console.log("Clearing store 🧹");
          }
        });
    }
  };
}

request.onsuccess = function (e) {
  console.log("success");
  db = e.target.result;

  if (navigator.onLine) {
    console.log("Backend online! 🗄️");
    checkDatabase();
  }
};

const saveRecord = (data) => {
  console.log("Save record invoked");
  const transaction = db.transaction(["BudgetStorage"], "readwrite");

  const store = transaction.objectStore("BudgetStorage");

  store.add(data);
};

window.addEventListener("online", checkDatabase);
