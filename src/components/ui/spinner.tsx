import { Loader2Icon } from "lucide-react"

import { cn } from "@/lib/utils"
import { useLanguage } from "@/lib/i18n"

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  const { t } = useLanguage();
  return (
    <Loader2Icon
      role="status"
      aria-label={t('Φόρτωση', 'Loading')}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  )
}

export { Spinner }
