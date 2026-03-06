import { useMemo } from 'react'

import { useAppTheme } from './theme'

export function useStyles<T, TProps extends any[]>(
  styles: (theme: App.Theme, ...props: TProps) => T,
  ...props: TProps
): T {
  const theme: App.Theme = useAppTheme()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => styles(theme, ...props), [styles, theme, ...props])
}
