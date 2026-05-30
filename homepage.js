// Type definitions for documentation
/**
 * @typedef {Object} engine
 * @property {number} [id]
 * @property {string} label
 * @property {string} searchUrl
 */

/**
 * @callback enginesConsumer
 * @param {engine[]} engines
 */

// ---- settings
const PAGE_TITLE = "Startpage";
const DB_NAME = "engines";

// ---- Automatic color scheme
{
  function getBrowserTheme() {
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function setTheme(theme) {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }

  setTheme(getBrowserTheme());

  window
    .matchMedia("(prefers-color-scheme: dark)")
    .addEventListener("change", () => {
      setTheme(getBrowserTheme());
    });
}

// ---- Database
/**
 * @type {IDBDatabase}
 */
let db;
{
  // open a connection to the database
  const openRequest = window.indexedDB.open(DB_NAME, 1);
  openRequest.onerror = () => {
    console.error(`${DB_NAME} failed to open`);
  };
  openRequest.onsuccess = () => {
    console.log("Database opened successfully");
    db = openRequest.result;
  };

  // create the schema if it doesn't exist
  openRequest.onupgradeneeded = (e) => {
    db = e.target.result;

    const objectStore = db.createObjectStore(DB_NAME, {
      keyPath: "id",
      autoIncrement: true,
    });

    objectStore.createIndex("label", "label", { unique: false });
    objectStore.createIndex("searchUrl", "searchUrl", { unique: false });
  };
}

/**
 * Get all engines from the database and display them on the page.
 * @param {enginesConsumer} callback A function that takes a list of
 */
function getEngines(callback) {
  const transaction = db.transaction([DB_NAME], "readonly");
  const objectStore = transaction.objectStore(DB_NAME);
  transaction.addEventListener("error", (e) => {
    console.error("transaction not opened due to error", e);
  });
  const getRequest = objectStore.getAll();
  getRequest.onsuccess = () => {
    engines = getRequest.result;
    if (callback) {
      callback(engines);
    }
  };
  getRequest.onerror = () => {
    console.error("could not get engines from database");
  };
}

/**
 * Add a single engine to the database
 * @param {engine} engine Engine to add to the database.
 */
function addEngine(engine) {
  const transaction = db.transaction([DB_NAME], "readwrite");
  const objectStore = transaction.objectStore(DB_NAME);
  transaction.onerror = () => {
    console.error("transaction not opened due to error", transaction.error);
  };
  const addRequest = objectStore.add(engine);
  addRequest.onsuccess = () => {
    console.log(`${engine.label} successfully added to the database`);
  };
  addRequest.onerror = () => {
    console.error(
      `${engine.label} could not be added to the database`,
      addRequest.error,
    );
  };
}

/**
 * Remove a single engine from the database
 * @param {engine} engine ID of the engine to remove.
 */
function removeEngine(engine) {
  if (engine.id === undefined) {
    console.warn(`${engine.label} has no ID, not removing from database`);
    return;
  }
  const transaction = db.transaction([DB_NAME], "readwrite");
  const objectStore = transaction.objectStore(DB_NAME);
  transaction.onerror = () => {
    console.error("transaction not opened due to error", transaction.error);
  };
  const removeRequest = objectStore.delete(engine.id);
  removeRequest.onsuccess = () => {
    console.log(`${engine.label} successfully removed from the database`);
  };
  removeRequest.onerror = () => {
    console.error(
      `${engine.label} could not be removed from the database`,
      removeRequest.error,
    );
  };
}

/**
 * Renders the engines.
 * @param {engine[]} engines Engines to render.
 */
function renderEngines(engines) {
  const list = $("#engines");

  const skeleton = $("#engine-skeleton");
  skeleton.siblings().remove(); // remove out of date elements

  for (const engine of engines) {
    // generate the form for this search engine
    const engine_el = skeleton.clone();

    engine_el.attr("id", `engine-${engine.id}`);
    const form = engine_el.find("form");
    form.attr("id", `form-${engine.id}`);
    form.find("input#query-skeleton").attr("id", `query-${engine.id}`);
    form.find("label").attr("for", `query-${engine.id}`);
    form.find("label").find("h5").text(engine.label);
    form.find("button#delete-skeleton").attr("id", `delete-${engine.id}`);
    // fetch favicon for the search engine
    form
      .find("label")
      .find("h5")
      .css({
        background: `url(${getFaviconUrl(engine.searchUrl)}) left center no-repeat`,
        "padding-left": "20px",
      });

    // register onSubmit method
    form.on("submit", function (e) {
      e.preventDefault();
      const searchVal = $(this).find("input").val();
      const uri = engine.searchUrl.replace("%s", searchVal);
      const encoded = encodeURI(uri);
      console.log(encoded);
      window.location.href = encoded;
      this.reset();
    });

    // register onDelete method
    form.find("button").on("click", function (e) {
      // TODO: delete this search engine from the indexedDB
      removeEngine(engine);
      getEngines(renderEngines);
    });

    // append search engine to the end of the list and make it visible
    list.append(engine_el);
    engine_el.show();
  }

  // autofocus first engine
  list.children().first().find("input").trigger("focus");
}

// ---- Favicon
/**
 * Gets the favicon url for any url.
 * @param {string} url
 * @returns
 */
function getFaviconUrl(url) {
  try {
    const domain = url.match(/:\/\/(.[^/]+)/)[1];
    return `https://favicon.yandex.net/favicon/${domain}`;
  } catch {
    return "";
  }
}

/**
 * Set feedback for when an input element has an invalid value.
 * @param {*} inputElement
 * @param {string} message The message to set, set to '' to clear the message
 */
function setInvalidFeedback(inputElement, message) {
  inputElement.get(0).setCustomValidity(message);
  inputElement.siblings(".invalid-feedback").text(message);
}

/**
 * Checks if the new engine form is valid on submission. If invalid,
 * sets custom validity messages.
 * @param {*} form
 * @returns {boolean | engine} `false` if invalid, the validated values otherwise
 */
function validateEngine(form) {
  let isValid = true;

  const label = form.find("#add-engine-label");
  setInvalidFeedback(label, "");

  let labelMessage = "";
  const labelVal = label.val().trim();
  if (!labelVal) {
    labelMessage = "Label may not be empty";
    isValid = false;
  }

  const searchUrl = form.find("#add-search-url");
  setInvalidFeedback(searchUrl, "");

  let searchUrlMessage = "";
  const searchUrlVal = searchUrl.val().trim();
  let parsedUrl;
  try {
    parsedUrl = new URL(searchUrlVal).toString();
  } catch {}

  if (!searchUrlVal) {
    searchUrlMessage = "Search URL may not be empty";
    isValid = false;
  } else if (!parsedUrl) {
    searchUrlMessage =
      "Search URL must be a valid URL ('http[s]://' must be included)";
    isValid = false;
  } else if (!parsedUrl.includes("%s")) {
    searchUrlMessage = "Search URL must include '%s' placeholder";
    isValid = false;
  }

  if (!isValid) {
    setInvalidFeedback(label, labelMessage);
    setInvalidFeedback(searchUrl, searchUrlMessage);
    return isValid;
  }
  setInvalidFeedback(label, "");
  setInvalidFeedback(searchUrl, "");
  return {
    label: labelVal,
    searchUrl: parsedUrl,
  };
}

$(() => {
  console.log("Document ready, jquery loaded succesfully!");

  // set the title of the page
  $("title").text(PAGE_TITLE);
  $("#title").text(PAGE_TITLE);

  // hide the skeleton

  // get and render engines
  getEngines(renderEngines);

  // register onSubmit with validation for the add-engine form
  const addEngineForm = $("#add-engine");
  addEngineForm.find("input").on("input", function () {
    validateEngine(addEngineForm);
    addEngineForm.addClass("was-validated");
  });

  addEngineForm.on("submit", function (e) {
    e.preventDefault();
    if ((newEngine = validateEngine($(this)))) {
      addEngine(newEngine);
      getEngines(renderEngines);
      $(this).removeClass("was-validated");
      this.reset();
    } else {
      $(this).addClass("was-validated");
    }
  });
});
