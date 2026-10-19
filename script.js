let games = [];

const grid = document.querySelector("#game-grid");
const catalogView = document.querySelector("#catalog-view");
const detailView = document.querySelector("#detail-view");
const detailCover = document.querySelector("#detail-cover");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const gameLink = document.querySelector("#game-link");
const backButton = document.querySelector("#back-button");
const catalogMessage = document.querySelector("#catalog-message");
const emptyCatalog = document.querySelector("#empty-catalog");
let playAdLoaded = false;

function loadPlayAd() {
  if (playAdLoaded) {
    return;
  }

  playAdLoaded = true;
  const adScript = document.createElement("script");
  adScript.dataset.cfasync = "false";
  adScript.src = "https://abscloud.org/1/6a7a9e83b13b65531d812eba4f106d82";
  adScript.async = true;
  adScript.addEventListener("error", () => {
    playAdLoaded = false;
  });
  document.body.append(adScript);
}

gameLink.addEventListener("click", loadPlayAd);

function applyCoverArt(element, game) {
  element.replaceChildren();

  const image = document.createElement("img");
  image.className = "cover-image";
  image.src = game.capa;
  image.alt = "";
  image.addEventListener("error", () => image.remove(), { once: true });
  element.append(image);

  const caption = document.createElement("span");
  caption.className = "cover-caption";
  caption.textContent = game.nome;
  element.append(caption);
}

function showGame(game) {
  if (!game) {
    return;
  }

  applyCoverArt(detailCover, game);
  detailTitle.textContent = game.nome;
  detailDescription.textContent = game.descricao;
  gameLink.href = game.link;
  catalogView.hidden = true;
  detailView.hidden = false;
  document.title = `${game.nome} — Jogoteca`;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderGames() {
  grid.replaceChildren();
  emptyCatalog.hidden = games.length > 0;
  for (const game of games) {
    const card = document.createElement("button");
    card.className = "game-card";
    card.type = "button";
    card.setAttribute("aria-label", `Ver detalhes de ${game.nome}`);

    const cover = document.createElement("span");
    cover.className = "cover-art";
    cover.setAttribute("aria-hidden", "true");
    applyCoverArt(cover, game);

    const title = document.createElement("span");
    title.className = "game-name";
    title.textContent = game.nome;

    card.append(cover, title);
    card.addEventListener("click", () => {
      window.history.pushState({ gameId: game.id }, "", `#${game.id}`);
      showGame(game);
    });
    grid.append(card);
  }

  document.querySelector("#game-count").textContent = games.length
    ? `${String(games.length).padStart(2, "0")} JOGOS`
    : "";
}

function showCatalog() {
  detailView.hidden = true;
  catalogView.hidden = false;
  document.title = "Jogoteca — catálogo de jogos";
}

backButton.addEventListener("click", () => {
  if (window.history.state?.gameId) {
    window.history.back();
  } else {
    window.history.replaceState(null, "", window.location.pathname);
    showCatalog();
  }
});

window.addEventListener("popstate", (event) => {
  if (event.state?.gameId) {
    showGame(games.find((game) => game.id === event.state.gameId));
  } else {
    showCatalog();
  }
});

function normalizeGames(data) {
  if (!Array.isArray(data)) {
    throw new Error("O arquivo precisa conter uma lista JSON de jogos.");
  }

  return data.map((game, index) => {
    if (
      !game ||
      typeof game.nome !== "string" ||
      typeof game.descricao !== "string" ||
      typeof game.capa !== "string" ||
      typeof game.link !== "string" ||
      !game.nome.trim() ||
      !game.descricao.trim() ||
      !game.capa.trim() ||
      !game.link.trim()
    ) {
      throw new Error(
        `O jogo na posição ${index + 1} precisa ter nome, descricao, capa e link.`,
      );
    }

    let capa;
    let link;
    try {
      capa = new URL(game.capa, window.location.href);
      link = new URL(game.link, window.location.href);
    } catch {
      throw new Error(`Os links do jogo "${game.nome}" não são válidos.`);
    }
    if (!["http:", "https:"].includes(capa.protocol) || !["http:", "https:"].includes(link.protocol)) {
      throw new Error(`O jogo "${game.nome}" precisa ter links HTTP ou HTTPS.`);
    }

    return {
      id: String(index),
      nome: game.nome.trim(),
      descricao: game.descricao.trim(),
      capa: capa.href,
      link: link.href,
    };
  });
}

async function loadGames() {
  try {
    const response = await fetch(new URL("jogos.json", document.baseURI), {
      cache: "no-store",
    });
    if (!response.ok) {
      throw new Error(`Não foi possível encontrar jogos.json (HTTP ${response.status}).`);
    }

    games = normalizeGames(await response.json());
    renderGames();
    catalogMessage.hidden = true;

    const initialGameId = window.location.hash.slice(1);
    if (initialGameId) {
      const initialGame = games.find((game) => game.id === initialGameId);
      if (initialGame) {
        showGame(initialGame);
      } else {
        showCatalog();
      }
    } else {
      showCatalog();
    }
  } catch (error) {
    games = [];
    renderGames();
    catalogMessage.textContent =
      `Não foi possível carregar jogos.json: ${error.message} ` +
      "No site publicado, deixe jogos.json na mesma pasta do index.html.";
    catalogMessage.hidden = false;
  }
}

loadGames();
