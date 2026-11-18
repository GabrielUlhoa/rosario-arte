# Mistérios do Rosário na Arte

Site estático (sem backend) que mostra os 20 mistérios do Rosário pintados por
Lorenzo Lotto, Cosimo Daddi, Francesco Madonnina, Giulio Lizzari, Giotto, Duccio,
Hans Memling, Hans Holbein (o Jovem), Albrecht Dürer e Martin Schongauer —
um auxílio visual na hora de rezar.

- **Por mistério**: abre direto no grupo do dia (gozosos, dolorosos, gloriosos, luminosos).
- **Por pintor**: todos os mistérios de um artista.
- **Modo oração**: toque numa obra → tela cheia; setas / deslizar para o próximo mistério.

## Estrutura

```
site/
  index.html   página
  style.css    visual (claro/escuro automático)
  app.js       navegação e modo oração
  data.js      ← mistérios, pintores e obras (edite aqui)
```

As imagens vêm do Wikimedia Commons (domínio público) via `Special:FilePath`,
então o repositório fica leve. Para trocar/adicionar uma obra, edite `data.js`
colocando o nome exato do arquivo no Commons, ex.:

```js
g2: "Giotto - Scrovegni - -16- - Visitation.jpg",
```

## Rodar localmente

```bash
python3 -m http.server 8000 --directory site
```

## Publicar grátis no GitHub Pages

1. Crie um repositório público no GitHub (ex.: `rosario-arte`) e envie este projeto.
2. No repositório: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
3. O workflow `.github/workflows/pages.yml` publica a pasta `site/` a cada push.
4. O endereço será `https://SEU-USUARIO.github.io/rosario-arte/`.

Alternativas igualmente grátis: Cloudflare Pages ou Netlify (arraste a pasta `site/`).
