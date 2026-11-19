import "react-native-gesture-handler";
import "@expo/metro-runtime";
import React from "react";
import { Dimensions, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { registerRootComponent } from "expo";
import { ExpoRoot } from "expo-router";
import { Head } from "expo-router/build/head";
import { ctx } from "expo-router/_ctx";
import {
  SafeAreaFrameContext,
  SafeAreaInsetsContext,
  initialWindowMetrics,
} from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";

try {
  SplashScreen.hide();
} catch {}
SplashScreen.hideAsync().catch(() => {});

const win = Dimensions.get("window");
const fallbackFrame = initialWindowMetrics?.frame ?? {
  x: 0,
  y: 0,
  width: win.width || 360,
  height: win.height || 800,
};
const fallbackInsets = initialWindowMetrics?.insets ?? {
  top: StatusBar.currentHeight || 28,
  right: 0,
  bottom: 16,
  left: 0,
};

const initialLocation = new URL("/", "file:");

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Application Error</Text>
          <ScrollView style={styles.errorScroll}>
            <Text style={styles.errorText}>
              {String(this.state.error?.message || this.state.error)}
            </Text>
            {this.state.error?.stack ? (
              <Text style={styles.errorStack}>{String(this.state.error.stack)}</Text>
            ) : null}
          </ScrollView>
          <Pressable
            style={styles.retryButton}
            onPress={() => this.setState({ error: null })}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}

function RootApp() {
  return (
    <RootErrorBoundary>
      <SafeAreaFrameContext.Provider value={fallbackFrame}>
        <SafeAreaInsetsContext.Provider value={fallbackInsets}>
          <Head.Provider>
            <ExpoRoot context={ctx} location={initialLocation} />
          </Head.Provider>
        </SafeAreaInsetsContext.Provider>
      </SafeAreaFrameContext.Provider>
    </RootErrorBoundary>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    backgroundColor: "#FAF8F3",
    padding: 24,
    paddingTop: 64,
    justifyContent: "center",
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#DC2626",
    marginBottom: 12,
  },
  errorScroll: {
    maxHeight: 360,
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1F1F1F",
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 11,
    color: "#6B7280",
  },
  retryButton: {
    backgroundColor: "#C96A32",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});

registerRootComponent(RootApp);

