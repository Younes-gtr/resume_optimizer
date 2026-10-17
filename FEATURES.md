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
    { "name": "string", "description": "string", "technologies": ["string"], "url": "string | null", "show_technologies": "boolean", "required": "boolean" }
  ],
  "skills": [{ "category": "string", "skills": [{ "value": "string", "required": "boolean" }] }],
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

## Feature 5 — Infos personnelles séparées du CV (jamais envoyées au LLM) ✅

Les infos personnelles (nom, email, téléphone, ville, LinkedIn) sont stockées dans un **JSON séparé** du JSON du CV. Elles ne servent qu'à remplir le header du `.tex` et ne transitent jamais par le LLM.

### Format `personal_info.json`

```json
{
  "full_name": "Prénom Nom",
  "email": "prenom.nom@email.com | null",
  "phone": "+33 6 00 00 00 00 | null",
  "location": "Ville, Pays | null",
  "linkedin": "https://www.linkedin.com/in/... | null"
}
```

Seul `full_name` est obligatoire ; les champs `null` sont omis du header.

### Flux utilisateur
Nouvelle étape `personal` entre l'adaptation (Feature 2/adapt) et l'écran final. L'utilisateur choisit :
1. **Saisir ses informations** via un formulaire
2. **Importer un JSON** — le formulaire est pré-rempli avec son contenu, l'utilisateur peut corriger avant de continuer

Sur l'écran final, bouton **"Télécharger personal_info.json"** à côté de "Télécharger cv.json". Les infos sont conservées en mémoire après "Recommencer".

### Backend
- **Schéma** `PersonalInfo` dans `schemas/personal_info_schema.py` ; `LatexRequest` dans `schemas/latex_schema.py`
- `POST /api/v1/latex/generate` : `personal_info` est **obligatoire** (plus de valeurs par défaut)
- `latex_service._header_block()` n'affiche que les champs renseignés

### Frontend
- **Types** `types/personalInfo.types.ts`
- **Page** `PersonalInfoStep.tsx` + **composant** `PersonalInfoForm.tsx`
- **Page** `Done.tsx` (sortie de `App.tsx`)
- **Utils** `utils/jsonFile.ts` (lecture/validation/téléchargement JSON génériques), `utils/personalInfoJson.ts`

---

## Feature 6 — Écran d'accueil : analyser un CV ou importer un JSON existant ✅

Au démarrage, l'utilisateur choisit entre :

1. **Analyser mon CV** → écran de saisie du CV (Feature 2), avec un bouton "Retour"
2. **J'ai déjà un JSON complet** → import d'un `cv.json` (issu de 4a) ; l'analyse LLM est sautée et l'utilisateur arrive directement dans l'éditeur

### Frontend
- **Page `StartChoice.tsx`** : les deux choix + `<input type="file">` conditionnel
- **Util `utils/resumeJson.ts`** : `validateResumeJson()` et `readResumeJsonFile()`, partagés avec l'écran final (4b)
- `App.tsx` : nouvelle étape `start` (étape initiale, et cible du bouton "Recommencer")

---

## Feature 7 — CV LaTeX en anglais, compétences par catégorie, ligne Technologies optionnelle ✅

### 7a — LaTeX en anglais
Tous les titres et libellés du `.tex` sont en anglais (Education, Professional Experience, Projects, Technical Skills, Languages and Interests, "Present"). Le multilingue sera traité plus tard. L'UI reste en français.

### 7b — Compétences par catégorie
`skills` devient une liste de catégories : `{ "category": "Programming Languages", "skills": [TaggedItem] }`.
- Le LLM regroupe les compétences en catégories (en anglais) lors du parsing ; l'adaptation garde les catégories telles quelles et n'omet une catégorie que si elle est vide
- Éditeur : composant `SkillsSection.tsx` — ajouter / renommer / supprimer une catégorie, et gérer ses compétences (avec "Obligatoire")
- LaTeX : une ligne `\textbf{Catégorie:} a, b, c` par catégorie non vide
- Compatibilité : un ancien `cv.json` avec une liste plate est converti en une catégorie "Skills" (backend : validator Pydantic ; frontend : à l'import)

### 7c — Ligne "Technologies" optionnelle par projet
Champ `show_technologies: bool = True` sur chaque projet, case à cocher dans l'éditeur. Si décoché (ou liste vide), la ligne n'apparaît pas dans le `.tex` — utile pour faire tenir le CV sur une page.

---

## Feature 8 — Lettre de motivation adaptée à l'offre (texte + PDF) ✅

Quand le CV a été adapté à une offre, l'écran final propose de générer une **lettre de motivation en anglais**, affichable en texte brut (copiable) et téléchargeable en PDF.

### Règles anti-hallucination
- Le LLM ne reçoit que le **JSON du CV** et **l'offre** — jamais les infos personnelles. Il ne rédige que le contenu (entreprise, poste, destinataire, paragraphes) ; l'en-tête, la date, la formule d'appel, la signature sont ajoutés localement
- Prompt en 3 étapes : (1) **analyse de l'offre** (activité de l'entreprise, missions, exigences) et mise en correspondance avec des preuves du CV — champ `offer_analysis` du JSON, ignoré ensuite ; (2) rédaction en 4–6 paragraphes structurés (présentation + pourquoi l'entreprise, formation, expérience clé liée aux missions, projets/compétences, motivation, conclusion) ; (3) auto-relecture
- Règles strictes : tout fait sur le candidat vient du CV ; aucun chiffre, détail, qualificatif ou niveau inventé ("strong", "robust", "demonstrates"…) ; aucune compétence revendiquée parce que l'offre la demande ; les affirmations sur l'offre doivent être vraies ; température 0.2
- Contrôle déterministe : chiffres absents du CV et de l'offre, crochets (placeholders) → avertissements affichés
- L'utilisateur relit et **édite** la lettre avant export. Une vérification par agents viendra plus tard (cf. roadmap)

### Format (standard, en anglais)
Infos personnelles en haut à gauche → date → destinataire / entreprise / lieu → `Subject: Application for <poste>` → `Dear <destinataire | Hiring Manager>,` → paragraphes → `Sincerely,` + nom.

### Backend
- **Schémas** `schemas/cover_letter_schema.py` : `CoverLetter`, `CoverLetterRequest`, `CoverLetterResponse` (`letter` + `warnings`), `CoverLetterPdfRequest`
- **Services** `cover_letter_service.py` (LLM + contrôles), `cover_letter_pdf_service.py` (PDF avec `reportlab`, sans dépendance LaTeX)
- **Router** `routers/cover_letter.py` : `POST /api/v1/cover-letter/generate`, `POST /api/v1/cover-letter/pdf`
- `llm_service.generate_json()` : parsing JSON de la réponse LLM, partagé avec `resume_service`

### Frontend
- **Composants** `CoverLetterSection.tsx` (génération, avertissements, aperçu, copie, PDF), `CoverLetterEditor.tsx` (champs + corps éditable)
- **Service** `coverLetterService.ts`, **util** `coverLetterText.ts` (texte brut au même format que le PDF), **types** `coverLetter.types.ts`
- `App.tsx` conserve l'offre d'emploi après l'adaptation (`null` si l'étape est passée)
