# SEO Command Center - Instructions Claude

## Règle importante : Auto-publication

Après CHAQUE modification de fichier dans ce projet (Edit, Write), tu DOIS exécuter :

```bash
./scripts/publish.sh
```

Cela publie automatiquement la mise à jour vers les autres ordinateurs.

## Structure du projet

- `src/` - Code React du dashboard
- `electron/` - Code Electron (main.cjs, preload.cjs)
- `scripts/publish.sh` - Script de publication automatique
