const { withMainActivity, withAndroidManifest } = require("expo/config-plugins");

/**
 * Prevents Android 12+ SplashScreenManager OnPreDrawListener / ExitAnimationListener
 * from freezing the splash screen overlay on standalone release APKs.
 */
module.exports = function withFixSplashScreen(config) {
  config = withMainActivity(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

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

  config = withAndroidManifest(config, (modConfig) => {
    const app = modConfig.modResults?.manifest?.application?.[0];
    if (app?.activity) {
      for (const act of app.activity) {
        if (
          act.$?.["android:name"] === ".MainActivity" ||
          act.$?.["android:name"]?.endsWith(".MainActivity")
        ) {
          act.$["android:theme"] = "@style/AppTheme";
        }
      }
    }
    return modConfig;
  });

  return config;
};
