#!/bin/bash
find src/components/ui -type f -name "*.tsx" -exec sed -i 's|@/lib/utils|../../lib/utils|g' {} +
find src/components/ui -type f -name "*.tsx" -exec sed -i 's|@/components/ui/|../../components/ui/|g' {} +
find src/components/ui -type f -name "*.tsx" -exec sed -i 's|@/hooks/|../../hooks/|g' {} +

find src/pages -type f -name "*.tsx" -exec sed -i 's|@/lib/utils|../lib/utils|g' {} +
find src/pages -type f -name "*.tsx" -exec sed -i 's|@/components/ui/|../components/ui/|g' {} +
find src/pages -type f -name "*.tsx" -exec sed -i 's|@/components/|../components/|g' {} +

find src/hooks -type f -name "*.ts" -exec sed -i 's|@/components/ui/|../components/ui/|g' {} +

find src -maxdepth 1 -type f -name "*.tsx" -exec sed -i 's|@/lib/utils|./lib/utils|g' {} +
