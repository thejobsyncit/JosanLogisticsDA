const { withMainActivity, withAndroidStyles } = require("expo/config-plugins");

/**
 * Prevents Android 12+ SplashScreenManager OnPreDrawListener / ExitAnimationListener
 * from freezing the splash screen overlay on standalone release APKs.
 */
module.exports = function withFixSplashScreen(config) {
  config = withMainActivity(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    // Remove SplashScreenManager.registerOnActivity(this) which installs an
    // OnPreDrawListener that can stay locked on Android standalone builds,
    // and restore setTheme(R.style.AppTheme) before super.onCreate(null).
    contents = contents.replace(
      /\/\/\s*setTheme\(R\.style\.AppTheme\);?/g,
      "setTheme(R.style.AppTheme)"
    );
    contents = contents.replace(
      /\s*SplashScreenManager\.registerOnActivity\(this\);?/g,
      "\n    setTheme(R.style.AppTheme)"
    );

    modConfig.modResults.contents = contents;
    return modConfig;
  });

  config = withAndroidStyles(config, (modConfig) => {
    const styles = modConfig.modResults?.resources?.style || [];
    for (const style of styles) {
      if (style.$?.name === "Theme.App.SplashScreen") {
        // Use AppTheme directly as parent so Android 12+ SplashScreen API
        // never holds an exit animation lock over the React Native root view.
        style.$.parent = "AppTheme";
      }
    }
    return modConfig;
  });

  return config;
};

