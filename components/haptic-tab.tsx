import { PlatformPressable } from 'expo-router/react-navigation';
import * as Device from 'expo-device';
import type { ComponentProps, MouseEvent } from 'react';
import { Platform, type ColorValue, type GestureResponderEvent } from 'react-native';

type HapticTabProps = Omit<ComponentProps<typeof PlatformPressable>, 'pressColor' | 'hoverEffect'> & {
  pressColor?: ColorValue;
  hoverEffect?: {
    color?: ColorValue;
    hoverOpacity?: number;
    activeOpacity?: number;
  };
  onPress?: (e: MouseEvent<HTMLAnchorElement, globalThis.MouseEvent> | GestureResponderEvent) => void;
};

export function HapticTab(props: HapticTabProps) {
  const { hoverEffect, onPressIn, pressColor, ...rest } = props;

  return (
    <PlatformPressable
      {...rest}
      pressColor={typeof pressColor === 'string' ? pressColor : undefined}
      hoverEffect={
        hoverEffect
          ? {
            ...hoverEffect,
            color:
              typeof hoverEffect.color === 'string'
                ? hoverEffect.color
                : undefined,
          }
          : undefined
      }
      onPressIn={(ev) => {
        if (Platform.OS === 'ios' && Device.isDevice) {
          void import('expo-haptics')
            .then((Haptics) => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light))
            .catch(() => undefined);
        }
        onPressIn?.(ev);
      }}
    />
  );
}
