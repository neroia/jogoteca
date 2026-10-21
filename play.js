const detailContent = document.querySelector("#detail-content");
const detailCover = document.querySelector("#detail-cover");
const detailTitle = document.querySelector("#detail-title");
const detailDescription = document.querySelector("#detail-description");
const gameLink = document.querySelector("#game-link");
const playMessage = document.querySelector("#play-message");

function applyCoverArt(game) {
  detailCover.replaceChildren();

  const image = document.createElement("img");
  image.className = "cover-image";
  image.src = game.capa;
  image.alt = "";
  image.addEventListener("error", () => image.remove(), { once: true });
  detailCover.append(image);

  const caption = document.createElement("span");
  caption.className = "cover-caption";
  caption.textContent = game.nome;
  detailCover.append(caption);
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
      throw new Error(`O jogo na posição ${index + 1} precisa ter nome, descricao, capa e link.`);
    }

    let capa;
    let link;
    try {
      capa = new URL(game.capa, window.location.href);
      link = new URL(game.link, window.location.href);
    } catch {
      throw new Error(`Os links do jogo "${game.nome}" não são válidos.`);
    }
    if (!['http:', 'https:'].includes(capa.protocol) || !['http:', 'https:'].includes(link.protocol)) {
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

async function loadGame() {
  const gameId = new URLSearchParams(window.location.search).get("game");
  if (gameId === null) {
    throw new Error("Selecione um jogo no catálogo antes de abrir esta página.");
  }

  const response = await fetch(new URL("jogos.json", document.baseURI), {
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error(`Não foi possível encontrar jogos.json (HTTP ${response.status}).`);
  }

  const games = normalizeGames(await response.json());
  const game = games.find((item) => item.id === gameId);
  if (!game) {
    throw new Error("Este jogo não está mais disponível no catálogo.");
  }

  applyCoverArt(game);
  detailTitle.textContent = game.nome;
  detailDescription.textContent = game.descricao;
  gameLink.href = game.link;
  document.title = `${game.nome} — Jogoteca`;
  playMessage.hidden = true;
  detailContent.hidden = false;
}

loadGame().catch((error) => {
  playMessage.textContent = error.message;
});
