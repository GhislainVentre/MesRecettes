import { decodeEntities, extractUrl, guessCategory, parseDuration, parseRecipeHtml, parseServings } from '../importRecipe';

const page = (jsonLd: unknown, body = '') =>
  `<html><head><script type="application/ld+json">${JSON.stringify(jsonLd)}</script></head><body>${body}</body></html>`;

it('extractUrl', () => {
  expect(extractUrl('Regarde https://www.marmiton.org/recettes/x.aspx !')).toBe('https://www.marmiton.org/recettes/x.aspx');
  expect(extractUrl('www.750g.com/tarte-r1.htm')).toBe('https://www.750g.com/tarte-r1.htm');
  expect(extractUrl('blanquette')).toBeNull();
});

it('parseDuration', () => {
  expect(parseDuration('PT20M')).toBe(20);
  expect(parseDuration('PT2H')).toBe(120);
  expect(parseDuration('PT1H30M')).toBe(90);
  expect(parseDuration('P0DT1H5M')).toBe(65);
  expect(parseDuration('PT0M')).toBeNull();
  expect(parseDuration('45')).toBe(45);
  expect(parseDuration(undefined)).toBeNull();
});

it('parseServings', () => {
  expect(parseServings('4 personnes')).toBe(4);
  expect(parseServings(['6', '6 parts'])).toBe(6);
  expect(parseServings(8)).toBe(8);
  expect(parseServings('quelques')).toBeNull();
});

it('guessCategory', () => {
  expect(guessCategory('Plat principal')).toBe('plat');
  expect(guessCategory(['Dessert'])).toBe('dessert');
  expect(guessCategory('Entrée')).toBe('entree');
  expect(guessCategory('Apéritif')).toBe('aperitif');
  expect(guessCategory('Tarte')).toBeNull();
});

it('decodeEntities', () => {
  expect(decodeEntities('d&#039;amandes &amp; cr&egrave;me &#x153;uf')).toBe("d'amandes & crème œuf");
});

it('lit un JSON-LD dans un @graph (Marmiton)', () => {
  const html = page(
    {
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'Organization', name: 'Marmiton' },
        {
          '@type': 'Recipe',
          name: 'Blanquette de veau : recette traditionnelle : la meilleure recette',
          image: ['https://img.example/blanquette.jpg', 'https://img.example/blanquette.webp'],
          recipeYield: '4 personnes',
          prepTime: 'PT15M',
          cookTime: 'PT2H',
          recipeCategory: 'Plat principal',
          recipeIngredient: ['1 kg de veau', '2  carottes', "25 cl de vin d&#039;Alsace"],
          recipeInstructions: [
            { '@type': 'HowToStep', text: 'Faire revenir la viande.' },
            { '@type': 'HowToStep', text: 'Laisser mijoter.' },
          ],
        },
      ],
    },
    '<h1 class="title">\n  Blanquette de veau : recette traditionnelle\n</h1>',
  );
  expect(parseRecipeHtml(html, 'https://www.marmiton.org/r.aspx')).toEqual({
    title: 'Blanquette de veau : recette traditionnelle',
    category: 'plat',
    imageUrl: 'https://img.example/blanquette.jpg',
    servings: 4,
    prepMinutes: 15,
    cookMinutes: 120,
    ingredients: ['1 kg de veau', '2 carottes', "25 cl de vin d'Alsace"],
    steps: ['Faire revenir la viande.', 'Laisser mijoter.'],
    sourceUrl: 'https://www.marmiton.org/r.aspx',
  });
});

it('gère ImageObject, sections et étapes en texte', () => {
  const html = page([
    {
      '@type': ['Recipe', 'NewsArticle'],
      name: 'Crêpes',
      image: { '@type': 'ImageObject', url: '/img/crepes.png' },
      recipeInstructions: [
        { '@type': 'HowToSection', name: 'Pâte', itemListElement: [{ '@type': 'HowToStep', text: 'Mélanger.<br>Reposer 1 h.' }] },
        'Cuire.',
      ],
    },
  ]);
  const recipe = parseRecipeHtml(html, 'https://exemple.fr/recettes/crepes');
  expect(recipe?.imageUrl).toBe('https://exemple.fr/img/crepes.png');
  expect(recipe?.steps).toEqual(['Mélanger.', 'Reposer 1 h.', 'Cuire.']);
  expect(recipe?.servings).toBeNull();
});

it('se rabat sur les microdonnées', () => {
  const html = `<html><head><meta property="og:image" content="https://img.example/a.jpg"></head><body>
    <h1>Soupe</h1>
    <li itemprop="recipeIngredient">3 poireaux</li>
    <li itemprop="recipeIngredient">1 l d'eau</li>
    <div itemprop="recipeInstructions">Couper.<br/>Cuire 30 min.</div></body></html>`;
  expect(parseRecipeHtml(html, 'https://exemple.fr/soupe')).toMatchObject({
    title: 'Soupe',
    imageUrl: 'https://img.example/a.jpg',
    ingredients: ['3 poireaux', "1 l d'eau"],
    steps: ['Couper.', 'Cuire 30 min.'],
  });
});

it('renvoie null sans recette', () => {
  expect(parseRecipeHtml('<html><h1>Accueil</h1></html>', 'https://exemple.fr')).toBeNull();
});
