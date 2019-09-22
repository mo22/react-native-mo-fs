#import <UIKit/UIKit.h>
#import <React/RCTEventEmitter.h>

@interface ReactNativeMoFs : RCTEventEmitter

+ (BOOL)verbose;
+ (void)setVerbose:(BOOL)verbose;

+ (void)disableAutoSwizzle;

// forward these from your AppDelegate.m if you have disabled auto swizzling
+ (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

@end
