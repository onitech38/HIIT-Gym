#!/bin/bash

INTERVAL=1800  # 30 minutos
BRANCH="autosave"

echo "🚀 Auto-push iniciado (a cada 30min na branch '$BRANCH')"

# Garante que a branch autosave existe
git checkout -B $BRANCH 2>/dev/null || true

while true; do
  # Verifica se há mudanças
  if ! git diff --quiet || ! git diff --cached --quiet || [ -n "$(git ls-files --others --exclude-standard)" ]; then
    git add .
    git commit -m "auto-save: $(date '+%Y-%m-%d %H:%M:%S')"
    
    if git push origin $BRANCH 2>/dev/null; then
      echo "✅ [$(date '+%H:%M:%S')] Push realizado com sucesso"
    else
      # Primeira vez pode precisar setar o upstream
      git push --set-upstream origin $BRANCH
      echo "✅ [$(date '+%H:%M:%S')] Push realizado (upstream configurado)"
    fi
  else
    echo "⏭️  [$(date '+%H:%M:%S')] Sem mudanças, pulando..."
  fi

  sleep $INTERVAL
done