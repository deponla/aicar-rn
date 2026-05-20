import { PlatformPressable } from 'expo-router/react-navigation';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, MouseEvent } from 'react';
import { type ColorValue, type GestureResponderEvent } from 'react-native';

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
        // Only trigger haptics on real iOS devices (not simulator)
        if (process.env.EXPO_OS === 'ios' && Device.isDevice) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        onPressIn?.(ev);
      }}
    />
  );
}
