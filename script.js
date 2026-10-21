let games = [];

const grid = document.querySelector("#game-grid");
const catalogMessage = document.querySelector("#catalog-message");
const emptyCatalog = document.querySelector("#empty-catalog");

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
      const playUrl = new URL("play.html", window.location.href);
      playUrl.searchParams.set("game", game.id);
      window.location.assign(playUrl);
    });
    grid.append(card);
  }

  document.querySelector("#game-count").textContent = games.length
    ? `${String(games.length).padStart(2, "0")} JOGOS`
    : "";
}

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
