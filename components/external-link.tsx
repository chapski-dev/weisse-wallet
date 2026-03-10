import { useAppTheme } from '@/theme/theme';
import { Href, Link } from 'expo-router';
import { openBrowserAsync, WebBrowserPresentationStyle } from 'expo-web-browser';
import { type ComponentProps } from 'react';

type Props = Omit<ComponentProps<typeof Link>, 'href'> & { href: Href & string };

/**
 * Компонент для открытия внешних ссылок.
 *
 * - **Web**: открывает ссылку в новой вкладке (`target="_blank"`)
 * - **iOS/Android**: открывает ссылку во встроенном браузере (in-app browser),
 *   не выбрасывая пользователя из приложения
 *
 * @example
 * ```tsx
 * <ExternalLink href="https://google.com">
 *   Открыть Google
 * </ExternalLink>
 * ```
 */
export function ExternalLink({ href, ...rest }: Props) {
  const them = useAppTheme();
  return (
    <Link
      target="_blank"
      {...rest}
      href={href}
      style={{ color: them.colors.text }}
      onPress={async (event) => {
        if (process.env.EXPO_OS !== 'web') {
          // Prevent the default behavior of linking to the default browser on native.
          event.preventDefault();
          // Open the link in an in-app browser.
          await openBrowserAsync(href, {
            presentationStyle: WebBrowserPresentationStyle.AUTOMATIC,
          });
        }
      }}
    />
  );
}
