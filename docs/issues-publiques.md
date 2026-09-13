# Issues GitHub publiques — rédaction

Le dépôt est **public**. Les issues liées à la feuille de route d’accueil sont lues par des non-devs. Rédiger pour **eux**.

## Template

```markdown
## Pour qui
…

## Problème
… (usage réel, pas stack technique)

## Ce qu’on verra
… (comportement observable dans le widget)

## Hors scope
- …
- …

## Comment commenter
… (invitation courte ; rappeler : pas de noms / emails / montants sensibles)
```

## Règles

| Faire | Ne pas faire |
|-------|----------------|
| Langage métier (mission, CRA, bon de commande) | `fetchTable`, allowlist, MemoryRouter, ACL techniques |
| Une intention claire par issue | Big-bang multi-écrans |
| Hors scope explicite | Promettre IA / notifs / sync auto |
| Inviter au commentaire | Coller inventaires nominatifs, emails, View As |

## Lien avec l’accueil

Après création d’une issue de roadmap : ajouter `issueUrl` dans [`src/content/publicRoadmap.ts`](../../src/content/publicRoadmap.ts) (même PR ou PR suivante).

Référence ordre produit : [`AGENTS.md`](../../AGENTS.md) §2 (Grist-first + feuille de route).
