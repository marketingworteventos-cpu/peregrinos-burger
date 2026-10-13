# Peregrino's Burger — site

Site de uma página do **Peregrino's Burger**, feito em HTML, CSS e JavaScript puros — sem frameworks,
sem etapa de build e sem dependências externas (as fontes também estão na pasta).
Para ver o site, basta abrir o arquivo `index.html` no navegador.

## Seções

1. **Início** — chamada principal, botões, aviso "aberto agora" (calculado pelo horário de São Paulo) e os três lanches em destaque.
2. **Faixa amarela** — resumo das regras da casa (batata em todos os lanches, domingo 18h às 22h, retirada no local).
3. **Cardápio** — os 4 lanches do cardápio impresso, com foto, preço, descrição e botão de adicionar ao pedido.
4. **Fritas e bebidas** — porção de fritas e lista de bebidas, também com botão de adicionar.
5. **Como pedir** — os três passos (montar, enviar pelo WhatsApp, retirar) e o aviso "Apenas retirada no local".
6. **Onde estamos** — horário, endereço (com link para o Google Maps) e WhatsApp.

### Pedido pelo WhatsApp

O cliente adiciona itens, vê o total na barra amarela que aparece no rodapé da tela e abre a janela
**Seu pedido**: informa o nome, escolhe o horário de retirada (próximo domingo, de 30 em 30 minutos,
das 18h às 21h30) e toca em **Enviar pedido pelo WhatsApp**. O WhatsApp abre no número da loja com a
mensagem pronta (itens, total, nome, retirada e observações). O pedido fica guardado no aparelho do
cliente até ele limpar ou enviar de novo.

## Estrutura

```
├── index.html          ← conteúdo (textos, cardápio, preços, horários, contatos)
├── css/style.css       ← visual (cores e fontes no topo, em :root)
├── js/main.js          ← interações (menu, aberto agora, pedido pelo WhatsApp)
├── favicon.svg         ← ícone de hambúrguer (também usado no cabeçalho)
├── .github/workflows/pages.yml   ← publica o site no GitHub Pages a cada alteração na main
└── assets/
    ├── fotos/          ← lanches, fritas e bebidas (recortadas do cardápio impresso)
    ├── marca/          ← logo, mapa da Itália e textura de madeira
    ├── fontes/         ← Barlow Condensed (títulos), Barlow (textos) e Caveat (anotação à mão)
    └── og-image.jpg    ← imagem exibida ao compartilhar o link (WhatsApp, Instagram…)
```

## O que mudar e onde

| O quê | Onde |
| --- | --- |
| **Preço** de um item | o valor `R$` com a classe `js-preco`, em `#cardapio` ou `#extras` no `index.html`. O total, o "a partir de" do início e a mensagem do WhatsApp leem esse valor sozinhos. Atualize também o JSON-LD no `<head>` (usado pelo Google). |
| **Texto/ingredientes** de um lanche | `.lanche__desc` do item no `index.html` (e a descrição no JSON-LD) |
| **Horário** de funcionamento | `ABRE`, `FECHA` e `ULTIMA_RETIRADA` no topo do `js/main.js`, os textos "domingo, 18h às 22h" no `index.html` e o JSON-LD |
| **WhatsApp** | `TELEFONE` no `js/main.js` (formato `55` + DDD + número) e os links `wa.me` no `index.html` |
| **Endereço** | seção `#visite`, rodapé, link do Maps e JSON-LD |
| **Cores** | `:root` no topo do `css/style.css` |
| Link de compartilhamento | `og:image` no `<head>`: depois de publicar, use a URL completa da imagem |

Para incluir um item novo, copie um bloco `data-item` existente (com `data-id`, `data-tipo` e `data-nome`)
— o botão de adicionar e o pedido passam a funcionar para ele automaticamente.

## Fotos

As fotos foram **recortadas da imagem do cardápio** (1254 px), então estão com a resolução limitada.
Quando tiver as fotos originais em alta, é só substituir os arquivos de `assets/fotos/` mantendo os
mesmos nomes (`dayenu`, `jubileu`, `rivh`, `franguinho`, `fritas`, `bebidas`) — de preferência com
fundo transparente (PNG/WebP), que é como o layout espera.

## Identidade visual aplicada

| Cor | Hex | Uso |
| --- | --- | --- |
| Amarelo | `#fac100` | títulos, botões, faixa e destaques |
| Vermelho | `#d8020f` | etiquetas de preço |
| Madeira / noite | `#0d0907` + textura | fundo da página (tábuas escuras, como no cardápio) |
| Verde, branco e vermelho | `#00923f` · `#fbf5ea` · `#d8020f` | faixa da Itália sob os títulos |
| Kraft | `#e0b784` | anotações à mão (cor da sacola) |

Títulos em **Barlow Condensed** itálico, com bordas "de pincel" nos títulos grandes (filtro SVG), como o
"NOSSO CARDÁPIO" do impresso; textos em **Barlow**; anotações em **Caveat**.

## Publicar (GitHub Pages)

O site entra no ar sozinho a cada alteração na branch `main`, pelo workflow `.github/workflows/pages.yml`.
Na primeira vez, ative o Pages uma única vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

O endereço fica: <https://marketingworteventos-cpu.github.io/peregrinos-burger/>

Se o site ganhar um domínio próprio, troque o endereço do `<link rel="canonical">` e das tags `og:url` e
`og:image` no `<head>` do `index.html` (a imagem de compartilhamento precisa do endereço completo).

Qualquer outra hospedagem estática também serve (Netlify, Vercel, Cloudflare Pages): publique os arquivos
`index.html`, `favicon.svg`, `css/`, `js/` e `assets/`.

## Testar localmente com servidor

```bash
python3 -m http.server 8000   # depois abra http://localhost:8000
```

## Acessibilidade e desempenho

Link "pular para o conteúdo", navegação completa por teclado (a janela do pedido prende o foco e fecha
com Esc), `aria-*` nos controles e anúncio das mudanças do pedido para leitores de tela, respeito a
`prefers-reduced-motion`, contraste calculado para as combinações da paleta, fontes hospedadas
localmente com `font-display: swap`, imagens em WebP com `width`/`height` e carregamento preguiçoso.
O site inteiro tem cerca de 1 MB e nenhuma biblioteca externa.
