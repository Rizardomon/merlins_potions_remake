---
issue: MP-001
title: Estrutura inicial do storefront — anúncio, header, categorias, catálogo, drawers, sacola, newsletter e footer
language: pt-BR
input: qa_script
source_hash: ""
criteria:
  - id: MP-001:AC-1
    text: Announcement bar — "Free shipping on orders over $50" above the header.
  - id: MP-001:AC-2
    text: Header — brand "Merlin's Potions", search field ("Search our stock"), "Sign in" link (no action), "Bag" button with live item count that opens the bag.
  - id: MP-001:AC-3
    text: Category navigation — Potions (active), Ingredients, Books, Supplies, Charms, Clearance (highlighted). Only Potions has content; the others are visible, not clickable, and carry a discreet "Soon" badge.
  - id: MP-001:AC-4
    text: 'Catalogue — heading "Potions", item count ("Catalogue · 06 items"), intro copy, sort chips, responsive grid of cards. Each card: number, image on a tinted background, name, price, effect, ingredient count, "Add to bag". Clicking the card opens the detail; clicking "Add to bag" adds one unit without opening it.'
  - id: MP-001:AC-5
    text: Search — filters live by name or ingredient, case-insensitive; count updates; empty state as above.
  - id: MP-001:AC-6
    text: 'Sort — Featured (catalogue order), Price: low to high, Price: high to low; active chip visually selected.'
  - id: MP-001:AC-7
    text: 'Product detail drawer — slides from the right over a dimmed page: image, "Potion · No. 0X", name, price, "Use / Effect", ingredient chips, quantity stepper, "Add to bag · $total". Adding closes the drawer and shows the toast.'
  - id: MP-001:AC-8
    text: Add-to-bag toast — "N × Potion added" with "View bag"; disappears after ~2.5 s.
  - id: MP-001:AC-9
    text: Bag drawer — "Your bag", free-shipping message and progress bar ("You're $X away from free shipping" / "Your order ships free"), line items with image, name, line total, stepper and "Remove", subtotal, "Checkout" button (no action).
  - id: MP-001:AC-10
    text: Bag persistence — bag contents survive reload and browser restart on the same device, with no expiry.
  - id: MP-001:AC-11
    text: Newsletter — email field and "Subscribe"; on valid submit shows "You're on the list. Watch your inbox for owl post.". No email is stored.
  - id: MP-001:AC-12
    text: Footer — Company, Contact us, Shipping, Returns, Careers; Facebook, X, Pinterest, Tumblr; "© 2026 Merlin's Potions". Links have no destination yet.
excluded:
  - criterion: MP-001:AC-10
    reason: Reinicialização completa do navegador não é reproduzível de forma confiável em sessão Playwright; a persistência via localStorage sem expiração é exercitada pelo cenário de reload (R-12). Reinício fica para walkthrough manual, conforme decisão do QA script.
supersedes: []
specs:
  MP-001/R-01: "cc2938a6620c4b2c84188e1b0f937dc8e2c1d5a91e2139ede7d2004ee596074c"
  MP-001/R-02: "f924ad420f38313a2a7b291b226f5ef5ec1ba0e563737091a4978c10ce45949e"
  MP-001/R-03: "4d133e9d06cb1f71d001b80c3f942a03152e7f905772cf9f76555f155071df85"
  MP-001/R-04: "a8986e751a8e66ab494c40e6bebf1826f1be14b171afe36fba9001ea7fef048c"
  MP-001/R-05: "46df9e5a9b015a417bf2e7ffe4dab4221ca42fb0f4e0b7cb4938aa99f9f269ad"
  MP-001/R-06: "85de5122a785ef403196a277a08d88022e18d1a70ed511778edc4cb1c77f8d77"
  MP-001/R-07: "9ced21b6f6e521f4a9b0210d997970f71d8aeea9ccad32060250a4f07c04960c"
  MP-001/R-08: "ce6352f55ed57aeabf8303cfb5235fd68b4826a48cd16d014656b960a218b446"
  MP-001/R-09: "16ab7126f6e13a6f60e6d3031dfa9b39aa403b64b0b77c4ba2bff4cf187bf713"
  MP-001/R-10: "f4bee65172680d9a7ee53fcb3e47726a8b7e4ac5d8bf12c846b695ab631af2f0"
  MP-001/R-11: "08eba26e2d2d7db6b1594c62da5d694ac3eb0e831209155283bf78ca8b988837"
  MP-001/R-12: "f517a8382b1e9439b212c48e9b9abf511a78940b74aabd15e1b6adc2e5981f4c"
  MP-001/R-13: "668e737fd5d5e19e208e125bd80719825bac685a2ab1e7d3c13de67efdc0ebda"
  MP-001/R-14: "2e8e3de4fc8f83ce4523835f7efabce7de2f6401b7467e2539424ea1137d05af"
  MP-001/R-15: "1993a602bb50a541a15bdb1355cabd65b4659639f85545bda45e9650b14ab5fd"
---

## Resumo de cobertura

Este fragmento cobre os 12 critérios de aceite da issue `MP-001` (Estrutura inicial do storefront da Merlin's Potions), derivados da seção "Core Features" (P0) do PRD e do QA script aprovado. O critério AC-10 (sobrevivência a reinício do navegador) é parcialmente excluído da automação — o reload é coberto por R-12; o reinício completo fica para walkthrough manual.

---

### MP-001/R-01 — Barra de anúncio de frete grátis

```regression-scenario
id: MP-001/R-01
area: storefront
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-1
preconditions: "Leitura apenas; app acessível em http://localhost:3010. Nenhuma autenticação necessária."
```

**Passos**

1. Navegue para `/`.
2. Verifique que o banner "Free shipping on orders over $50" está visível no topo da página, acima do header principal.
3. Verifique que o texto contém exatamente "Free shipping on orders over $50".

**Resultado esperado**

A barra de anúncio aparece acima do header e exibe o texto correto.

---

### MP-001/R-02 — Header com marca, busca, Sign in e botão Bag com contador

```regression-scenario
id: MP-001/R-02
area: storefront
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-2
preconditions: "Leitura apenas; sacola limpa (localStorage key mp.bag.v1 removida antes do teste)."
```

**Passos**

1. Navegue para `/` com localStorage limpo.
2. Verifique que o link "Merlin's Potions — home" está visível no header.
3. Verifique que a caixa de busca com label "Search products" está visível.
4. Verifique que o botão "Sign in" está visível.
5. Verifique que o botão do Bag está visível com contador 0.
6. Clique no botão do Bag.
7. Verifique que o `dialog "Shopping bag"` abre.

**Resultado esperado**

Marca, busca, "Sign in" e Bag com contador 0 estão presentes. Clicar em Bag abre o drawer da sacola.

---

### MP-001/R-03 — Navegação de categorias com Potions ativa e demais com badge Soon

```regression-scenario
id: MP-001/R-03
area: storefront
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-3
preconditions: "Leitura apenas; app acessível em http://localhost:3010."
```

**Passos**

1. Navegue para `/`.
2. Verifique que a `navigation "Product categories"` exibe os itens: Potions, Ingredients, Books, Supplies, Charms, Clearance.
3. Verifique que "Potions" está visível sem badge "Soon" (categoria ativa).
4. Verifique que Ingredients, Books, Supplies, Charms e Clearance exibem o texto "Soon".
5. Clique no item "Ingredients" (inativo) e verifique que a URL permanece em `/`.

**Resultado esperado**

Seis categorias visíveis; "Potions" ativa sem badge; demais com texto "Soon"; clicar nas inativas não altera a URL.

---

### MP-001/R-04 — Catálogo de poções: heading, contagem e estrutura dos cards

```regression-scenario
id: MP-001/R-04
area: catalogue
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-4
preconditions: "Leitura apenas; catálogo semeado com 6 poções via módulo NestJS mocado."
```

**Passos**

1. Navegue para `/`.
2. Verifique que o heading `h1` "Potions" está visível dentro da região "Potions catalogue".
3. Verifique que o texto "Catalogue · 06 items" está visível.
4. Verifique que exatamente 6 botões "View details for …" (cards) estão renderizados.
5. No primeiro card ("Aging Potion"), verifique que são visíveis: número ("No. 01"), imagem, nome ("Aging Potion"), preço ("US$ 12.99"), parágrafo de efeito, contagem de ingredientes ("4 ingredients") e botão "Add to bag".

**Resultado esperado**

Heading "Potions", contagem "Catalogue · 06 items" e 6 cards completos exibidos.

---

### MP-001/R-05 — Quick-add não abre drawer de detalhe e incrementa contador do Bag

```regression-scenario
id: MP-001/R-05
area: catalogue
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-4
preconditions: "Sacola limpa (localStorage key mp.bag.v1 removida antes do teste)."
```

**Passos**

1. Navegue para `/` com localStorage limpo.
2. Clique no botão "Add Aging Potion to bag" dentro do card.
3. Verifique que o `dialog "Product detail"` NÃO está visível.
4. Verifique que o botão do Bag exibe contador 1.

**Resultado esperado**

"Add to bag" no card adiciona 1 item sem abrir o drawer de detalhe; contador do Bag passa para 1.

---

### MP-001/R-06 — Busca por nome filtra catálogo com atualização de contagem

```regression-scenario
id: MP-001/R-06
area: catalogue
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-5
preconditions: "Leitura apenas; catálogo com 6 poções carregado."
```

**Passos**

1. Navegue para `/`.
2. Preencha a caixa de busca "Search potions" com `love` (minúsculas).
3. Verifique que apenas o card "Love Potion" permanece visível e a contagem atualiza.
4. Limpe o campo de busca.
5. Verifique que os 6 cards voltam a ser exibidos.

**Resultado esperado**

Filtro por nome é case-insensitive e atualiza a contagem; limpar restaura os 6 cards.

---

### MP-001/R-07 — Busca sem correspondência exibe estado vazio com "Clear search"

```regression-scenario
id: MP-001/R-07
area: catalogue
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-5
preconditions: "Leitura apenas; catálogo com 6 poções carregado."
```

**Passos**

1. Navegue para `/`.
2. Preencha "Search potions" com `zzzzz`.
3. Verifique que o estado vazio é exibido.
4. Verifique que há uma ação ou botão com texto "Clear search" visível.
5. Clique em "Clear search".
6. Verifique que os 6 cards são restaurados.

**Resultado esperado**

Estado vazio exibe a query e ação "Clear search"; clicar restaura o catálogo completo.

---

### MP-001/R-08 — Ordenação por preço com chip ativo atualizado

```regression-scenario
id: MP-001/R-08
area: catalogue
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-6
preconditions: "Leitura apenas; catálogo com 6 poções carregado."
```

**Passos**

1. Navegue para `/`.
2. Verifique que o botão "Featured" está pressionado (`aria-pressed=true`) por padrão.
3. Clique em "Price: low to high".
4. Capture os preços dos cards e verifique que estão em ordem crescente.
5. Verifique que "Price: low to high" está pressionado.
6. Clique em "Price: high to low".
7. Verifique que os preços estão em ordem decrescente e que "Price: high to low" está pressionado.

**Resultado esperado**

Chip "Featured" selecionado por padrão; ordenação crescente e decrescente funcionam; chip ativo atualiza.

---

### MP-001/R-09 — Drawer de detalhe da poção com stepper e total dinâmico

```regression-scenario
id: MP-001/R-09
area: catalogue
tier: full
sources:
  - MP-001
criteria:
  - MP-001:AC-7
preconditions: "Sacola limpa (localStorage key mp.bag.v1 removida antes do teste). Interação com catálogo existente — sem prefixo KPROC-REG-."
```

**Passos**

1. Navegue para `/`.
2. Clique em "View details for Aging Potion" (corpo do card).
3. Verifique que o `dialog "Product detail"` abre.
4. Verifique que são visíveis: imagem "Aging Potion", texto "Potion · No. 01", heading "Aging Potion", preço "US$ 12.99", heading "Use / Effect", lista de ingredientes, controles de quantidade e botão "Add to bag · US$ 12.99".
5. Clique em "Increase quantity" para definir quantidade 2.
6. Verifique que o botão exibe "Add to bag · US$ 25.98".
7. Clique em "Add to bag · US$ 25.98".
8. Verifique que o `dialog "Product detail"` fecha.
9. Verifique que um toast aparece.

**Resultado esperado**

Drawer abre com todos os elementos; stepper incrementa e atualiza total; ao adicionar, drawer fecha e toast é exibido.

---

### MP-001/R-10 — Toast de adição: texto, duração e ação "View bag"

```regression-scenario
id: MP-001/R-10
area: catalogue
tier: full
sources:
  - MP-001
criteria:
  - MP-001:AC-8
preconditions: "Sacola limpa (localStorage key mp.bag.v1 removida antes do teste)."
```

**Passos**

1. Navegue para `/`.
2. Clique em "Add Aging Potion to bag" (quick-add no card).
3. Verifique que um toast aparece com texto contendo "Aging Potion added" e link/botão "View bag".
4. Aguarde ~3 segundos sem interagir.
5. Verifique que o toast desapareceu.
6. Clique em "Add Aging Potion to bag" novamente.
7. Com o toast visível, clique em "View bag".
8. Verifique que o `dialog "Shopping bag"` abre.

**Resultado esperado**

Toast exibe mensagem de adição com ação "View bag"; some após ~2,5 s; "View bag" abre o drawer da sacola.

---

### MP-001/R-11 — Drawer da sacola: conteúdo, progresso de frete e edição de itens

```regression-scenario
id: MP-001/R-11
area: bag
tier: full
sources:
  - MP-001
criteria:
  - MP-001:AC-9
preconditions: "Sacola limpa (localStorage key mp.bag.v1 removida antes do teste)."
```

**Passos**

1. Navegue para `/`.
2. Clique em "Add Aging Potion to bag" para adicionar 1 item (US$ 12.99).
3. Clique em "Open bag" no header.
4. Verifique que o `dialog "Shopping bag"` exibe: heading "Your bag", barra de progresso de frete, item "Aging Potion" com imagem/preço/stepper/"Remove", subtotal "US$ 12.99" e botão "Checkout".
5. Verifique que a mensagem de frete contém "away from free shipping".
6. Clique em "Increase quantity of Aging Potion".
7. Verifique que o subtotal atualiza.
8. Clique em "Remove Aging Potion from bag".
9. Verifique que a linha é removida e uma mensagem de sacola vazia aparece.

**Resultado esperado**

Drawer exibe todos os elementos; progresso de frete correto; stepper atualiza subtotal; "Remove" remove a linha; estado vazio exibido.

---

### MP-001/R-12 — Persistência da sacola após reload

```regression-scenario
id: MP-001/R-12
area: bag
tier: full
sources:
  - MP-001
criteria:
  - MP-001:AC-10
preconditions: "Sacola limpa (localStorage key mp.bag.v1 removida antes do teste)."
```

**Passos**

1. Navegue para `/`.
2. Adicione "Aging Potion" via quick-add.
3. Adicione "Bulgeye Potion" via quick-add.
4. Anote o contador do Bag (esperado: 2).
5. Recarregue a página (`page.reload()`).
6. Verifique que, após o reload, o contador do Bag ainda exibe 2.
7. Abra o drawer e verifique que os dois itens e o subtotal correto persistem.

**Resultado esperado**

Após reload, contador e itens da sacola são restaurados via `localStorage` (`mp.bag.v1`).

---

### MP-001/R-13 — Newsletter: submit válido exibe confirmação

```regression-scenario
id: MP-001/R-13
area: newsletter
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-11
preconditions: "Leitura apenas; app acessível em http://localhost:3010."
```

**Passos**

1. Navegue para `/`.
2. Role até a região "Newsletter signup".
3. Verifique que o campo "Email address" e o botão "Subscribe" estão visíveis.
4. Preencha o campo com `owl@example.com`.
5. Clique em "Subscribe".
6. Verifique que a mensagem "You're on the list. Watch your inbox for owl post." aparece.

**Resultado esperado**

Submit válido exibe a mensagem de confirmação sem redirecionar a página.

---

### MP-001/R-14 — Footer com links de seção, redes sociais e copyright

```regression-scenario
id: MP-001/R-14
area: storefront
tier: smoke
sources:
  - MP-001
criteria:
  - MP-001:AC-12
preconditions: "Leitura apenas; app acessível em http://localhost:3010."
```

**Passos**

1. Navegue para `/`.
2. Role até o footer (`contentinfo`).
3. Verifique que os links Company, Contact us, Shipping, Returns e Careers estão visíveis em `navigation "Company links"`.
4. Verifique que os links Facebook, X, Pinterest e Tumblr estão visíveis em `navigation "Social media links"`.
5. Verifique que o parágrafo "© 2026 Merlin's Potions" está visível.

**Resultado esperado**

Links de seção e redes sociais visíveis; copyright exibido; nenhum link navega para fora da página.

---

### MP-001/R-15 — Escape fecha drawers de detalhe e sacola

```regression-scenario
id: MP-001/R-15
area: storefront
tier: full
sources:
  - MP-001
criteria:
  - MP-001:AC-7
  - MP-001:AC-9
preconditions: "Sacola limpa (localStorage key mp.bag.v1 removida antes do teste)."
```

**Passos**

1. Navegue para `/`.
2. Clique em "View details for Aging Potion" para abrir o drawer de detalhe.
3. Pressione `Escape`.
4. Verifique que o `dialog "Product detail"` fecha (não está visível).
5. Adicione um item via quick-add e abra o drawer da sacola pelo botão "Open bag".
6. Pressione `Escape`.
7. Verifique que o `dialog "Shopping bag"` fecha.

**Resultado esperado**

`Escape` fecha o drawer de detalhe e o drawer da sacola.
