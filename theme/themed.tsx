import { FC, ForwardedRef, forwardRef, useMemo } from 'react';
import {
  Pressable,
  TouchableHighlight,
  TouchableOpacity,
  TouchableOpacityProps,
  View as DefaultView,
  ViewProps as DefaultViewProps,
} from 'react-native';
import { TouchableOpacity as TouchableOpacityGH } from 'react-native-gesture-handler';

import { useAppTheme } from './theme';

export type colorKeys = keyof ReturnType<typeof useAppTheme>['colors']

type ThemeProps = {
  lightColorName?: colorKeys
  darkColorName?: colorKeys
  colorName?: colorKeys
}

type MyViewProps = {
  relative?: true
  absolute?: true
  onPress?: () => void
  effect?: 'opacity' | 'scale' | 'none' | 'highlight' | 'ripple' | 'gestureHandler'
}

type ViewProps = ThemeProps & DefaultView['props'] & MyViewProps


export type View = DefaultView
export const View = forwardRef(ViewWithRef);

function ViewWithRef(
  props: ViewProps & {
    onPress?: TouchableOpacityProps['onPress']
    onLongPress?: TouchableOpacityProps['onLongPress']
  },
  ref: ForwardedRef<DefaultView>,
) {
  const {
    style,
    relative,
    absolute,
    onPress,
    effect,
    colorName,
    lightColorName,
    darkColorName,
    onLongPress,
    ...otherProps
  } = props;
  const theme = useAppTheme();
  const key = colorName || (theme.dark ? darkColorName : lightColorName);

  const styles = useMemo(
    () => [
      {
        backgroundColor: key && theme.colors[key],
        position: relative ? 'relative' : absolute ? 'absolute' : undefined,
      } as const,
      style,
    ],
    [key, theme.colors, relative, absolute, style],
  );

  const Component = useMemo(() => {
    if (onLongPress || onPress) {
      switch (effect) {
        case 'none':
          return Pressable;
        case 'highlight':
          return TouchableHighlight;
        case 'gestureHandler':
          return TouchableOpacityGH;
        default:
          return TouchableOpacity;
      }
    }
    return DefaultView as unknown as FC<DefaultViewProps>;
  }, [effect, onPress, onLongPress]);

  // @ts-ignore
  return <Component ref={ref} style={styles} onPress={onPress} onLongPress={onLongPress} {...otherProps} />;
}
