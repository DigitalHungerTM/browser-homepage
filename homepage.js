// Type definitions for documentation
/**
 * @typedef {{label: string, searchUrl: string}} engine
 */

/**
 * @callback enginesConsumer
 * @param {engine[]} engines
 */

// ---- settings
const PAGE_TITLE = "Startpage";
const DB_NAME = "engines";

/**
 * `id` should be unique.
 * @type {engine[]}
 */
const SEARCH_ENGINES = [
  {
    // id: "google",
    label: "Google",
    searchUrl: "https://www.google.com/search?q=%s",
  },
  {
    // id: "youtube",
    label: "Youtube",
    searchUrl: "https://www.youtube.com/results?search_query=%s",
  },
  {
    // id: "protondb",
    label: "ProntonDB",
    searchUrl: "https://www.protondb.com/search?q=%s",
  },
  {
    // id: "howlongtobeat",
    label: "How Long To Beat",
    searchUrl: "https://www.howlongtobeat.com?q=%s",
  },
  {
    // id: "yeggi",
    label: "Yeggi",
    searchUrl: "https://www.yeggi.com/q/%s",
  },
  {
    // id: "kentekencheck",
    label: "Kenteken Check",
    searchUrl: "https://www.kentekencheck.nl/bruh/%s",
  },
  {
    // id: "apple-music-artwork",
    label: "Apple Music Artwork",
    searchUrl:
      "https://www.bendodson.com/projects/apple-music-artwork-finder/?query=%s&storefront=us",
  },
];

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
 * Add a single engine to the database
 * @param {engine} engine Engine to add to the database.
 */
function addEngineToDB(engine) {
  const transaction = db.transaction([DB_NAME], "readwrite");
  const objectStore = transaction.objectStore(DB_NAME);
  transaction.onerror = () => {
    console.error("transaction not opened due to error", transaction.error);
  };
  const addRequest = objectStore.add(engine);
  addRequest.onsuccess = () => {
    console.log(`${engine.label} successfully added to the store`);
  };
  addRequest.onerror = (e) => {
    console.error(`${engine.label} could not be added to the store`, e);
  };

  getEngines(renderEngines);
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
 * Renders the engines.
 * @param {engine[]} engines Engines to render.
 */
function renderEngines(engines) {
  const list = $("#engines");

  const skeleton = $("#engine-skeleton");

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
      // window.location.href = encoded;
      this.reset();
    });

    // register onDelete method
    form.find("button").on("click", function (e) {
      // TODO: delete this search engine from the indexedDB
      console.warn("DELETE BUTTON CLICKED");
    });

    // append search engine to the end of the list
    list.append(engine_el);
  }
  // remove the skeleton
  skeleton.remove();

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
  const domain = url.match(/:\/\/(.[^/]+)/)[1];
  return `https://favicon.yandex.net/favicon/${domain}`;
}

$(() => {
  console.log("Document ready, jquery loaded succesfully!");

  // set the title of the page
  $("title").text(PAGE_TITLE);
  $("#title").text(PAGE_TITLE);

  // get and render engines
  getEngines(renderEngines);
});
