(() => {
  const COMMONS = "https://commons.wikimedia.org/wiki/";
  const app = document.getElementById("app");
  const oracao = document.getElementById("oracao");

  // ---------- utilidades ----------
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const filePath = (f, w) => `${COMMONS}Special:FilePath/${encodeURIComponent(f.replace(/ /g, "_"))}${w ? `?width=${w}` : ""}`;
  const filePage = (f) => `${COMMONS}File:${encodeURIComponent(f.replace(/ /g, "_"))}`;

  const todosMisterios = MISTERIOS.flatMap((g) => g.itens.map((m, i) => ({ ...m, n: i + 1, grupo: g })));
  const misterioPorId = Object.fromEntries(todosMisterios.map((m) => [m.id, m]));
  const pintorPorId = Object.fromEntries(PINTORES.map((p) => [p.id, p]));

  // Normaliza uma obra para { file?, crop?, nota?, link }
  function obra(pintor, mid) {
    const v = pintor.obras[mid];
    if (!v) return null;
    const o = typeof v === "string" ? { file: v } : { ...v };
    if (o.crop && o.crop.file) o.link = filePage(o.crop.file);
    else if (o.file) o.link = filePage(o.file);
    else if (pintor.fonte) o.link = pintor.fonte.url;
    return o;
  }

  // HTML da imagem (normal ou recorte de uma imagem maior)
  function imagem(o, largura, alt, grande = false) {
    if (o.crop) {
      const c = o.crop;
      const src = c.src || filePath(c.file, grande ? 2000 : 1200);
      const px = ((c.cx - c.w / 2) / (1 - c.w)) * 100;
      const py = ((c.cy - c.h / 2) / (1 - c.h)) * 100;
      const ratio = (c.w * c.iw) / (c.h * c.ih);
      return `<div class="recorte" role="img" aria-label="${esc(alt)}" style="background-image:url('${src}');background-size:${100 / c.w}% ${100 / c.h}%;background-position:${px}% ${py}%;aspect-ratio:${ratio}"></div>`;
    }
    return `<img loading="lazy" src="${filePath(o.file, largura)}" alt="${esc(alt)}">`;
  }

  const diaHoje = () => {
    const d = new Date().getDay(); // 0 = domingo
    return { 0: "gloriosos", 1: "gozosos", 2: "dolorosos", 3: "gloriosos", 4: "luminosos", 5: "dolorosos", 6: "gozosos" }[d];
  };

  // ---------- telas ----------
  function telaMisterios(grupoId) {
    const g = MISTERIOS.find((x) => x.grupo === grupoId) || MISTERIOS[0];
    const hoje = diaHoje();
    app.innerHTML = `
      <div class="filtros" role="tablist">
        ${MISTERIOS.map((x) => `
          <button class="chip ${x.grupo === g.grupo ? "ativo" : ""}" data-grupo="${x.grupo}" role="tab" aria-selected="${x.grupo === g.grupo}">
            ${esc(x.nome.replace("Mistérios ", ""))}${x.grupo === hoje ? '<span class="hoje">hoje</span>' : ""}
            <small>${esc(x.dias)}</small>
          </button>`).join("")}
      </div>
      <h1 class="titulo">${esc(g.nome)}</h1>
      <p class="sub">${esc(g.dias)} · toque em uma pintura para rezar em tela cheia
        <button class="btn-orar" data-orar-grupo="${g.grupo}">▶ Rezar com imagens</button></p>
      ${g.itens.map((m, i) => `
        <section class="misterio" id="${m.id}">
          <div class="misterio-cab">
            <span class="num">${i + 1}º</span>
            <h2>${esc(m.nome)}</h2>
            <span class="ref">${esc(m.ref)}</span>
          </div>
          <div class="faixa">
            ${PINTORES.filter((p) => p.obras[m.id]).map((p) => cartao(p, misterioPorId[m.id])).join("")}
          </div>
          ${(() => {
            const sem = PINTORES.filter((p) => !p.obras[m.id]).map((p) => p.nome);
            return sem.length ? `<p class="ausentes">Sem obra encontrada: ${esc(sem.join(", "))}</p>` : "";
          })()}
        </section>`).join("")}
    `;
  }

  function cartao(p, m, mostrarMisterio = false) {
    const o = obra(p, m.id);
    const titulo = mostrarMisterio ? `${m.n}º · ${m.nome}` : p.nome;
    const sub = mostrarMisterio ? (o && o.nota ? o.nota : m.ref) : (o && o.nota ? o.nota : p.vida);
    if (!o) {
      return `<div class="obra falta"><div class="img">${mostrarMisterio ? "Sem obra deste mistério" : `Sem obra de ${esc(p.nome)} para este mistério`}</div>
        <div class="legenda"><strong>${esc(titulo)}</strong><span>${esc(mostrarMisterio ? m.ref : p.vida)}</span></div></div>`;
    }
    return `<button class="obra" data-p="${p.id}" data-m="${m.id}" data-ctx="${mostrarMisterio ? "pintor" : "misterio"}">
      <div class="img">${imagem(o, 500, `${m.nome} — ${p.nome}`)}</div>
      <div class="legenda"><strong>${esc(titulo)}</strong><span>${esc(sub)}</span></div>
    </button>`;
  }

  function miniatura(p) {
    const primeira = todosMisterios.find((m) => p.obras[m.id]);
    if (!primeira) return `<div class="mini"></div>`;
    return `<div class="mini">${imagem(obra(p, primeira.id), 150, p.nome)}</div>`;
  }

  function telaPintores(pid) {
    const p = pintorPorId[pid];
    app.innerHTML = `
      ${p ? "" : `<h1 class="titulo">Pintores</h1><p class="sub">Escolha um pintor para ver os mistérios pintados por ele.</p>`}
      <div class="pintores-lista">
        ${PINTORES.map((x) => {
          const qtd = Object.keys(x.obras).length;
          return `<a class="pintor-card ${p && p.id === x.id ? "ativo" : ""}" href="#pintor/${x.id}">
            ${miniatura(x)}
            <div><strong>${esc(x.nome)}</strong><span>${esc(x.vida)} · ${qtd ? `${qtd} de 20 mistérios` : "sem imagens ainda"}</span></div>
          </a>`;
        }).join("")}
      </div>
      ${p ? telaPintor(p) : ""}
    `;
    if (p) document.getElementById("pintor-cab")?.scrollIntoView({ block: "start" });
  }

  function telaPintor(p) {
    return `
      <div class="pintor-cab" id="pintor-cab">
        <h1 class="titulo">${esc(p.nome)}</h1>
        <p class="sub">${esc(p.vida)} · ${esc(p.obra)}
          ${Object.keys(p.obras).length ? `<button class="btn-orar" data-orar-pintor="${p.id}">▶ Rezar com imagens</button>` : ""}</p>
        ${p.aviso ? `<p class="aviso">${esc(p.aviso)}${p.fonte ? ` <a href="${p.fonte.url}" target="_blank" rel="noopener">${esc(p.fonte.texto)}</a>` : ""}</p>` : ""}
        ${!p.aviso && p.fonte ? `<p class="sub"><a href="${p.fonte.url}" target="_blank" rel="noopener">${esc(p.fonte.texto)}</a></p>` : ""}
      </div>
      ${MISTERIOS.map((g) => `
        <h2 class="grupo-titulo">${esc(g.nome)}<small>${esc(g.dias)}</small></h2>
        <div class="grade">${g.itens.map((m) => cartao(p, misterioPorId[m.id], true)).join("")}</div>
      `).join("")}
    `;
  }

  // ---------- modo oração ----------
  let seq = [], pos = 0;

  function abrirOracao(lista, inicio = 0) {
    seq = lista.filter(Boolean);
    if (!seq.length) return;
    pos = Math.max(0, Math.min(inicio, seq.length - 1));
    oracao.hidden = false;
    document.body.style.overflow = "hidden";
    mostrar();
    oracao.querySelector(".fechar").focus();
  }
  function fecharOracao() {
    oracao.hidden = true;
    document.body.style.overflow = "";
  }
  function mostrar() {
    const { p, m } = seq[pos];
    const o = obra(p, m.id);
    oracao.querySelector(".quadro").innerHTML = imagem(o, 1600, `${m.nome} — ${p.nome}`, true).replace('loading="lazy" ', "");
    oracao.querySelector(".o-grupo").textContent = `${m.grupo.nome} · ${m.n}º mistério`;
    oracao.querySelector(".o-nome").textContent = m.nome;
    oracao.querySelector(".o-obra").innerHTML =
      `${esc(p.nome)}${o.nota ? ` — ${esc(o.nota)}` : ""} · <a href="${o.link}" target="_blank" rel="noopener">fonte</a>`;
    oracao.querySelector(".contas").innerHTML = m.grupo.itens.map((_, i) => `<i class="${i < m.n ? "on" : ""}"></i>`).join("");
    oracao.querySelector(".esq").style.visibility = pos > 0 ? "visible" : "hidden";
    oracao.querySelector(".dir").style.visibility = pos < seq.length - 1 ? "visible" : "hidden";
    // pré-carrega a próxima
    const prox = seq[pos + 1];
    if (prox) { const po = obra(prox.p, prox.m.id); if (po.file) new Image().src = filePath(po.file, 1600); }
  }
  const mover = (d) => { const n = pos + d; if (n >= 0 && n < seq.length) { pos = n; mostrar(); } };

  // Sequência do grupo: prefere o pintor escolhido; se ele não tiver o mistério, usa o primeiro disponível.
  function seqGrupo(grupoId, pidPreferido) {
    const g = MISTERIOS.find((x) => x.grupo === grupoId);
    return g.itens.map((it) => {
      const m = misterioPorId[it.id];
      const p = (pidPreferido && pintorPorId[pidPreferido].obras[m.id]) ? pintorPorId[pidPreferido] : PINTORES.find((x) => x.obras[m.id]);
      return p ? { p, m } : null;
    });
  }
  const seqPintor = (p) => todosMisterios.filter((m) => p.obras[m.id]).map((m) => ({ p, m }));

  // ---------- eventos ----------
  app.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-grupo]");
    if (chip) { location.hash = `#misterios/${chip.dataset.grupo}`; return; }
    const og = e.target.closest("[data-orar-grupo]");
    if (og) { abrirOracao(seqGrupo(og.dataset.orarGrupo)); return; }
    const op = e.target.closest("[data-orar-pintor]");
    if (op) { abrirOracao(seqPintor(pintorPorId[op.dataset.orarPintor])); return; }
    const card = e.target.closest(".obra[data-p]");
    if (card) {
      const p = pintorPorId[card.dataset.p], m = misterioPorId[card.dataset.m];
      if (card.dataset.ctx === "pintor") {
        const lista = seqPintor(p);
        abrirOracao(lista, lista.findIndex((x) => x.m.id === m.id));
      } else {
        const lista = seqGrupo(m.grupo.grupo, p.id);
        abrirOracao(lista, lista.findIndex((x) => x && x.m.id === m.id));
      }
    }
  });

  oracao.addEventListener("click", (e) => {
    const a = e.target.closest("[data-acao]")?.dataset.acao;
    if (a === "fechar") fecharOracao();
    else if (a === "ant") mover(-1);
    else if (a === "prox") mover(1);
  });
  document.addEventListener("keydown", (e) => {
    if (oracao.hidden) return;
    if (e.key === "Escape") fecharOracao();
    else if (e.key === "ArrowRight" || e.key === " ") { e.preventDefault(); mover(1); }
    else if (e.key === "ArrowLeft") mover(-1);
  });
  let toqueX = null;
  oracao.addEventListener("touchstart", (e) => { toqueX = e.touches[0].clientX; }, { passive: true });
  oracao.addEventListener("touchend", (e) => {
    if (toqueX === null) return;
    const dx = e.changedTouches[0].clientX - toqueX;
    if (Math.abs(dx) > 50) mover(dx < 0 ? 1 : -1);
    toqueX = null;
  });

  // ---------- rotas ----------
  function rota() {
    const [aba, arg] = location.hash.replace(/^#/, "").split("/");
    const emPintores = aba === "pintores" || aba === "pintor";
    document.querySelectorAll(".abas a").forEach((a) => a.classList.toggle("ativa", (a.dataset.aba === "pintores") === emPintores));
    if (emPintores) telaPintores(arg);
    else { telaMisterios(arg || diaHoje()); if (!arg) window.scrollTo(0, 0); }
  }
  window.addEventListener("hashchange", () => { fecharOracao(); rota(); if (!location.hash.startsWith("#pintor/")) window.scrollTo(0, 0); });
  rota();
})();
