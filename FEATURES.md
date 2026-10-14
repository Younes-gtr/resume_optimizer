# FEATURES.md

## Feature 1 — LLM API Integration (Groq) ✅

Connecter l'API Groq pour effectuer des requêtes LLM depuis le backend.

### Modèle cible
- **`llama-3.1-8b-instant`** — modèle gratuit sur Groq, rapide, suffisant pour le dev

### Backend
- **Config** : `GROQ_API_KEY`, `GROQ_MODEL` via pydantic-settings
- **Service** `llm_service.py` : `generate(prompt) -> str` via `groq` SDK, `max_tokens=4096`
- **Router** `POST /api/v1/llm/generate` — Body `{ prompt }`, Response `{ response }`
- **Schemas** : `LLMRequest`, `LLMResponse`

### Frontend
- **Page** `LLMPlayground.tsx` — saisie prompt, affichage réponse, loading/erreurs

---

## Feature 2 — Parsing de CV en JSON structuré + édition par l'utilisateur ✅

L'utilisateur soumet un CV en texte brut ou LaTeX. Le LLM extrait les informations et construit un JSON structuré. L'utilisateur ne voit pas le JSON directement : il accède à une vue par catégorie où il peut corriger, ajouter ou retirer des éléments. Le JSON final (pré-rempli + corrigé) est l'état de sortie de cette feature.

### Catégories du JSON

```json
{
  "summary": "string",
  "education": [
    { "institution": "string", "degree": "string", "field": "string | null", "start_date": "string", "end_date": "string | null", "required": "boolean" }
  ],
  "experiences": [
    { "company": "string", "title": "string", "location": "string | null", "start_date": "string", "end_date": "string | null", "current": "boolean", "description": ["string"], "required": "boolean" }
  ],
  "projects": [
    { "name": "string", "description": "string", "technologies": ["string"], "url": "string | null", "required": "boolean" }
  ],
  "skills": [{ "value": "string", "required": "boolean" }],
  "languages": [{ "language": "string", "level": "string | null", "required": "boolean" }],
  "interests": [{ "value": "string", "required": "boolean" }]
}
```

### Flux utilisateur

1. L'utilisateur colle son CV (texte brut ou LaTeX) dans une zone de saisie et clique sur "Parser"
2. Le backend envoie le CV au LLM et reçoit le JSON structuré
3. L'UI affiche le JSON sous forme de **sections éditables** (une par catégorie) :
   - Chaque item a un bouton Modifier / Supprimer et une **case à cocher "Obligatoire"**
   - Un bouton "Ajouter" permet d'insérer un nouvel item dans chaque section
4. L'utilisateur valide ses corrections — le JSON final consolidé est disponible côté frontend

### Backend
- **Schemas** : chaque modèle (Education, Experience, Project, Language) a un champ `required: bool = False`. Pour les listes de strings, un modèle `TaggedItem(value: str, required: bool)` remplace `str`
- **Service** `resume_service.py` : prompt + parse + validation Pydantic
- **Router** `POST /api/v1/resume/parse`

### Frontend
- **Types** : miroir du JSON avec `required: boolean` sur chaque item, `TaggedItem` pour skills/interests
- **Service** `resumeService.ts` : `parseResume(cvText)`
- **Page `ResumeParser.tsx`** : saisie CV
- **Page `ResumeEditor.tsx`** : sections éditables avec checkbox "Obligatoire" par item

---

## Feature 3 — Génération du CV LaTeX à partir du JSON ✅

À partir du JSON finalisé (Feature 2), le backend génère un fichier `.tex` en remplissant le template `CV_template.tex`.

### Structure du template
- **Header** : rempli depuis un JSON d'infos personnelles (voir Feature 5)
- **Résumé** : bloc `tcolorbox`
- **Formations, Expériences, Projets** : `twocolentry` + `highlights`
- **Compétences, Langues, Centres d'intérêt** : `onecolentry`

### Backend
- **Service** `latex_service.py` : `generate_latex(resume, personal_info) -> str`, échappement LaTeX
- **Router** `POST /api/v1/latex/generate` — retourne le `.tex` en téléchargement

### Frontend
- **Service** `latexService.ts` : déclenche le download navigateur
- **Page de génération LaTeX** (Feature 4) : bouton "Télécharger le .tex"

---

## Feature 4 — Téléchargement du JSON + choix de source pour la génération LaTeX

### 4a — Téléchargement du JSON récap

Sur l'écran de validation finale, **avant** le téléchargement du `.tex`, l'utilisateur peut télécharger le JSON complet du CV (tel que corrigé).

- **Frontend uniquement** : sérialisation du state React en blob JSON + download navigateur
- Bouton "Télécharger le JSON" sur l'écran `done` dans `App.tsx`

### 4b — Choix de source pour la génération LaTeX

Sur l'écran de génération LaTeX, l'utilisateur choisit entre deux sources :

1. **Utiliser le JSON du flow courant** (passé en mémoire depuis l'éditeur)
2. **Uploader un fichier JSON** existant (issu d'un téléchargement précédent via 4a)

- **Frontend** : toggle "Utiliser le JSON courant / Uploader un JSON" + `<input type="file">` conditionnel
- Le JSON uploadé est parsé côté client (`JSON.parse`) puis envoyé au même endpoint `/api/v1/latex/generate`
- Validation basique du JSON uploadé avant envoi (vérifier la présence des clés attendues)

---

## Feature 5 — Infos personnelles pour le header du CV LaTeX

Le header du `.tex` généré (nom, email, téléphone, ville, LinkedIn) est rempli depuis un **JSON d'infos personnelles**.

### Pour l'instant : valeurs par défaut fixées dans le backend

```json
{
  "full_name": "Prénom Nom",
  "email": "prenom.nom@email.com",
  "phone": "+33 6 00 00 00 00",
  "location": "Ville, Pays",
  "linkedin": null
}
```

- **Backend** : objet `PersonalInfo` défini dans `latex_service.py` avec ces valeurs par défaut, injecté dans `generate_latex()`
- **Schéma** `PersonalInfo` dans `resume_schema.py`
- Sera rendu configurable dans une future feature (upload ou formulaire)

---

## Feature 6 — Écran d'accueil : analyser un CV ou importer un JSON existant ✅

Au démarrage, l'utilisateur choisit entre :

1. **Analyser mon CV** → écran de saisie du CV (Feature 2), avec un bouton "Retour"
2. **J'ai déjà un JSON complet** → import d'un `cv.json` (issu de 4a) ; l'analyse LLM est sautée et l'utilisateur arrive directement dans l'éditeur

### Frontend
- **Page `StartChoice.tsx`** : les deux choix + `<input type="file">` conditionnel
- **Util `utils/resumeJson.ts`** : `validateResumeJson()` et `readResumeJsonFile()`, partagés avec l'écran final (4b)
- `App.tsx` : nouvelle étape `start` (étape initiale, et cible du bouton "Recommencer")
