#import <UIKit/UIKit.h>
#import <React/RCTEventEmitter.h>

@interface ReactNativeMoFs : RCTEventEmitter

+ (bool)verbose;
+ (void)setVerbose:(BOOL)verbose;

+ (void)disableAutoSwizzle;
+ (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options;

@end
