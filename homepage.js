const PAGE_TITLE = "Startpage";

/**
 * `id` should be unique.
 *
 * The string `%s` in the `searchUrl` will be replaced with the search query.
 */
const SEARCH_ENGINES = [
  {
    id: "google",
    label: "Google",
    searchUrl: "https://www.google.com/search?q=%s",
  },
  {
    id: "youtube",
    label: "Youtube",
    searchUrl: "https://www.youtube.com/results?search_query=%s",
  },
  {
    id: "protondb",
    label: "ProntonDB",
    searchUrl: "https://www.protondb.com/search?q=%s",
  },
  {
    id: "howlongtobeat",
    label: "How Long To Beat",
    searchUrl: "https://www.howlongtobeat.com?q=%s",
  },
  {
    id: "yeggi",
    label: "Yeggi",
    searchUrl: "https://www.yeggi.com/q/%s",
  },
  {
    id: "kentekencheck",
    label: "Kenteken Check",
    searchUrl: "https://www.kentekencheck.nl/bruh/%s",
  },
];

// Automatich color scheme
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

function getFaviconUrl(url) {
  const domain = url.match(/:\/\/(.[^/]+)/)[1];
  return `https://favicon.yandex.net/favicon/${domain}`;
}

$(() => {
  console.log("Document ready, jquery loaded succesfully!");

  // set the title of the page
  $("title").text(PAGE_TITLE);
  $("#title").text(PAGE_TITLE);

  const list = $("#engines");
  const skeleton = $("#row-skeleton");

  for (const searchEngine of SEARCH_ENGINES) {
    // generate the form for this search engine
    const row = skeleton.clone();
    row.attr("id", `row-${searchEngine.id}`);
    const form = row.find("form");
    form.attr("id", `form-${searchEngine.id}`);
    form.find("input").attr("id", `input-${searchEngine.id}`);
    form.find("label").attr("for", `input-${searchEngine.id}`);
    form.find("label").find("h5").append(searchEngine.label);
    // fetch favicon for the search engine
    form
      .find("label")
      .find("h5")
      .css({
        background: `url(${getFaviconUrl(searchEngine.searchUrl)}) left center no-repeat`,
        "padding-left": "20px",
      });

    // fill the onSubmit
    form.on("submit", function (e) {
      e.preventDefault();
      const searchVal = $(this).find("input").val();
      const uri = searchEngine.searchUrl.replace("%s", searchVal);
      const encoded = encodeURI(uri);
      console.log(encoded);
      window.location.href = encoded;
      this.reset();
    });

    // append search engine to the end of the list
    list.append(row);
  }

  // remove the skeleton
  skeleton.remove();

  // autofocus first engine
  list.children().first().find("input").trigger("focus");
});
