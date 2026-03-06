import React, { useEffect, useMemo } from 'react'
import { Animated, StyleSheet, View } from 'react-native'

interface OverlayProps {
  overlayOpacity?: number
  children?: React.ReactNode
}

function Overlay(props: OverlayProps) {
  const { overlayOpacity = 0.3, children } = props
  const opacity = useMemo(() => new Animated.Value(0), [])

  useEffect(() => {
    Animated.timing(opacity, {
      duration: 350,
      toValue: overlayOpacity,
      useNativeDriver: true,
    }).start()
  }, [opacity, overlayOpacity])

  if (children) {
    return (
      <View style={styles.container}>
        <Animated.View
          style={[
            styles.content,
            {
              opacity,
            },
          ]}
        />
        {children}
      </View>
    )
  }

  return (
    <Animated.View
      style={[
        styles.content2,
        {
          opacity,
        },
      ]}
    />
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'black',
  },
  content2: {
    backgroundColor: 'black',
    flex: 1,
  },
})

export default React.memo(Overlay)
