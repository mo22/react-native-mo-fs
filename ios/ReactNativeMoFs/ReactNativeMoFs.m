#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <React/RCTUIManager.h>
#import <React/RCTNetworking.h>
#import <CommonCrypto/CommonCrypto.h>
#import <CoreServices/CoreServices.h>
#import "ReactNativeMoFs.h"
#import <objc/runtime.h>

#if __has_feature(modules)
@import MobileCoreServices;
#endif

#if __has_include(<RCTBlob/RCTBlobManager.h>)
#import <RCTBlob/RCTBlobManager.h>
#else
#import "RCTBlobManager.h"
#endif

static void methodSwizzle(Class cls1, SEL sel1, Class cls2, SEL sel2) {
    Method m1 = class_getInstanceMethod(cls1, sel1); // original
    Method m2 = class_getInstanceMethod(cls2, sel2); // new
    assert(m2);
    if (m1) {
        assert(class_addMethod(cls1, sel2, method_getImplementation(m1), method_getTypeEncoding(m1)));
        method_exchangeImplementations(m1, m2);
    } else {
        assert(class_addMethod(cls1, sel1, method_getImplementation(m2), method_getTypeEncoding(m2)));
    }
}

NSString* utiForPath(NSString* path) {
    return CFBridgingRelease(UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef _Nonnull)([path pathExtension]), nil));
}

NSString* utiForMimeType(NSString* mimeType) {
    return CFBridgingRelease(UTTypeCreatePreferredIdentifierForTag(kUTTagClassMIMEType, (__bridge CFStringRef _Nonnull)mimeType, NULL));
}

NSString* mimeTypeForPath(NSString* path) {
    NSString* uti = utiForPath(path);
    NSString* mime = CFBridgingRelease(UTTypeCopyPreferredTagWithClass((__bridge CFStringRef _Nonnull)(uti), kUTTagClassMIMEType));
    if (!mime) return @"application/octet-stream";
    return mime;
}

NSString* hexStringForData(NSData* data) {
    NSMutableString *output = [NSMutableString stringWithCapacity:data.length * 2];
    for (int i = 0; i < data.length; i++) [output appendFormat:@"%02x", ((const unsigned char*)data.bytes)[i]];
    return output;
}


@interface ReactNativeMoFsInteractionDelegate : NSObject <UIDocumentInteractionControllerDelegate>
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
@property NSMutableSet* refs;
@end
@implementation ReactNativeMoFsInteractionDelegate
- (void)documentInteractionControllerDidDismissOpenInMenu:(UIDocumentInteractionController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (void)documentInteractionControllerDidDismissOptionsMenu:(UIDocumentInteractionController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (void)documentInteractionControllerDidEndPreview:(UIDocumentInteractionController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (UIViewController *)documentInteractionControllerViewControllerForPreview:(UIDocumentInteractionController *)controller {
    return RCTSharedApplication().delegate.window.rootViewController;
}
@end



@interface ReactNativeMoFsPickerDelegate : NSObject <UIDocumentPickerDelegate>
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
@property NSMutableSet* refs;
@end
@implementation ReactNativeMoFsPickerDelegate
- (void)documentPicker:(UIDocumentPickerViewController *)controller didPickDocumentsAtURLs:(NSArray <NSURL *>*)urls {
    NSMutableArray* res = [NSMutableArray new];
    for (NSURL* url in urls) {
        [res addObject:[url absoluteString]];
    }
    self.resolve(res);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
- (void)documentPickerWasCancelled:(UIDocumentPickerViewController *)controller {
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:controller];
}
@end



@interface ReactNativeMoFsImagePickerControllerDelegate : NSObject <UIImagePickerControllerDelegate, UINavigationControllerDelegate>
@property RCTPromiseResolveBlock resolve;
@property RCTPromiseRejectBlock reject;
@property NSMutableSet* refs;
@end
@implementation ReactNativeMoFsImagePickerControllerDelegate
- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary<UIImagePickerControllerInfoKey, id> *)info {
    NSMutableDictionary* res = [NSMutableDictionary new];
    for (NSString* key in info.allKeys) {
        id value = info[key];
        if ([value isKindOfClass:[UIImage class]]) {
            continue;
        }
        if ([value isKindOfClass:[NSURL class]]) {
            value = [value absoluteString];
        } else if ([value isKindOfClass:[NSString class]]) {
            // fine
        } else if ([value isKindOfClass:[NSNumber class]]) {
            // fine
        } else if ([key isEqualToString:@"UIImagePickerControllerCropRect"]) {
            value = @{
                @"x": @([value CGRectValue].origin.x),
                @"y": @([value CGRectValue].origin.y),
                @"width": @([value CGRectValue].size.width),
                @"height": @([value CGRectValue].size.height),
            };
        } else {
            // NSLog(@"XXX %@ %@ %@", key, value, [value class]);
            // skip
            continue;
        }
        res[key] = value;
    }
    self.resolve(res);
    [picker dismissViewControllerAnimated:YES completion:nil];
    [self.refs removeObject:self];
    [self.refs removeObject:picker];
}
- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker {
    [picker dismissViewControllerAnimated:YES completion:nil];
    self.resolve(nil);
    [self.refs removeObject:self];
    [self.refs removeObject:picker];
}
@end



static BOOL g_verbose = NO;
static BOOL g_disableAutoSwizzle = NO;

@interface ReactNativeMoFs ()
@property NSMutableSet* refs;
@property BOOL observing;
@property NSDictionary* lastOpenURL;
@end

@implementation ReactNativeMoFs

RCT_EXPORT_MODULE()

+ (void)disableAutoSwizzle {
    g_disableAutoSwizzle = YES;
}

+ (BOOL)requiresMainQueueSetup {
    // this is called during didFinishLaunching and is the last place where we can
    // hook openURL before we would get the initial openURL notification
    if (!g_disableAutoSwizzle) {
        [self swizzleOpenURL];
    }
    return YES;
}

- (NSArray<NSString *> *)supportedEvents {
    return @[ @"ReactNativeMoFsOpenURL" ];
}

+ (void)swizzleOpenURL {
    if (self.verbose) NSLog(@"ReactNativeMoFs.swizzleOpenURL");
    assert([NSThread isMainThread]);
    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
        id<UIApplicationDelegate> appDelegate = RCTSharedApplication().delegate;
        assert(appDelegate);
        methodSwizzle(
            [appDelegate class], @selector(application:openURL:options:),
            [self class],@selector(swizzled_application:openURL:options:)
        );
        RCTSharedApplication().delegate = appDelegate;
    });
}

- (BOOL)swizzled_application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    [ReactNativeMoFs application:application openURL:url options:options];
    if ([self respondsToSelector:@selector(swizzled_application:openURL:options:)]) {
        return [self swizzled_application:application openURL:url options:options];
    } else {
        return NO;
    }
}

+ (BOOL)application:(UIApplication *)application openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options {
    if (self.verbose) NSLog(@"ReactNativeMoFs.openURL %@", url);
    RCTBridge* bridge = ((RCTRootView*)RCTSharedApplication().delegate.window.rootViewController.view).bridge;
    NSDictionary* args = @{
        @"url": [url absoluteString],
        @"options": options,
    };
    ReactNativeMoFs* realself = [bridge moduleForClass:[ReactNativeMoFs class]];
    realself.lastOpenURL = args;
    if (realself.observing) {
        [realself sendEventWithName:@"ReactNativeMoFsOpenURL" body:args];
    }
    return YES;
}

- (NSDictionary *)constantsToExport {
    NSMutableDictionary* constants = [NSMutableDictionary new];
    constants[@"paths"] = @{
        @"bundle": [[NSBundle mainBundle] bundlePath],
        @"document": [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject],
        @"caches": [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject],
        @"library": [NSSearchPathForDirectoriesInDomains(NSLibraryDirectory, NSUserDomainMask, YES) lastObject],
    };
    return constants;
}

- (void)startObserving {
    self.observing = YES;
}

- (void)stopObserving {
    self.observing = NO;
}

+ (BOOL)verbose {
    return g_verbose;
}

+ (void)setVerbose:(BOOL)verbose {
    g_verbose = verbose;
}

RCT_EXPORT_METHOD(setVerbose:(BOOL)verbose) {
    [[self class] setVerbose:verbose];
}

- (BOOL)verbose {
    return [[self class] verbose];
}

- (RCTBlobManager*)blobManager {
#if __has_feature(modules)
    return [self.bridge moduleForClass:NSClassFromString(@"RCTBlobManager")];
#else
    return [self.bridge moduleForClass:[RCTBlobManager class]];
#endif
}

RCT_EXPORT_METHOD(getLastOpenURL:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(self.lastOpenURL);
}

RCT_EXPORT_METHOD(getMimeType:(NSString*)extension resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(mimeTypeForPath(extension));
}

RCT_EXPORT_METHOD(getUtiFromMimeType:(NSString*)mimeType resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(utiForMimeType(mimeType));
}

RCT_EXPORT_METHOD(getUti:(NSString*)extension resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(utiForPath(extension));
}

RCT_EXPORT_METHOD(readBlob:(NSDictionary<NSString*,id>*)blob mode:(NSString*)mode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    if (self.verbose) NSLog(@"ReactNativeMoFs.readBlob size=%lu", (unsigned long)data.length);
    if ([mode isEqualToString:@"base64"]) {
        NSString* res = [data base64EncodedStringWithOptions:0];
        resolve(res);
    } else if ([mode isEqualToString:@"utf8"]) {
        NSString* res = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
        if (res == nil) {
            reject(@"", @"invalid utf8 data", nil);
        } else {
            resolve(res);
        }
    } else {
        reject(@"", @"invalid mode", nil);
        return;
    }
}

RCT_EXPORT_METHOD(createBlob:(NSString*)str mode:(NSString*)mode resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data;
    if ([mode isEqualToString:@"base64"]) {
        data = [[NSData alloc] initWithBase64EncodedString:str options:0];
        if (!data) {
            reject(@"", @"invalid base64", nil);
            return;
        }
    } else if ([mode isEqualToString:@"utf8"]) {
        data = [str dataUsingEncoding:NSUTF8StringEncoding];
    } else {
        reject(@"", @"invalid mode", nil);
        return;
    }
    NSString* blobId = [self.blobManager store:data];
    if (self.verbose) NSLog(@"ReactNativeMoFs.createBlob size=%lu blobId=%@", (unsigned long)data.length, blobId);
    resolve(@{
        @"size": @([data length]),
        @"offset": @(0),
        @"blobId": blobId,
    });
}

RCT_EXPORT_METHOD(readFile:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    NSString* path = args[@"path"];
    NSNumber* offset = args[@"offset"];
    NSNumber* size = args[@"size"];
    if (self.verbose) NSLog(@"ReactNativeMoFs.readFile path=%@ offset=%@ size=%@", path, offset, size);
    NSData* data;
    if ([offset intValue] == 0 && size == nil) {
        data = [NSData dataWithContentsOfFile:path options:0 error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
    } else {
        NSDictionary<NSFileAttributeKey, id>* stat = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        NSFileHandle* fp = [NSFileHandle fileHandleForReadingFromURL:[NSURL fileURLWithPath:path] error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        if ([offset longLongValue] < 0) {
            offset = [NSNumber numberWithLongLong:[stat[NSFileSize] longLongValue] + [offset longLongValue] + 1];
        }
        if ([size intValue] == 0) {
            size = [NSNumber numberWithUnsignedLongLong:1024 * 1024 * 1024];
        }
        if (self.verbose) NSLog(@"ReactNativeMoFs.readFile path=%@ offset=%@ size=%@ filesize=%@", path, offset, size, stat[NSFileSize]);
        if (@available(iOS 13.0, *)) {
            [fp seekToOffset:[offset unsignedLongLongValue] error:&error];
        } else {
            [fp seekToFileOffset:[offset unsignedLongLongValue]];
        }
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        if (@available(iOS 13.0, *)) {
            data = [fp readDataUpToLength:[size unsignedLongValue] error:&error];
        } else {
            data = [fp readDataOfLength:[size unsignedLongValue]];
        }
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
    }
    NSString* blobId = [self.blobManager store:data];
    resolve(@{
        @"size": @([data length]),
        @"offset": @(0),
        @"blobId": blobId,
        @"type": mimeTypeForPath(path),
        @"name": [path lastPathComponent],
    });
}

RCT_EXPORT_METHOD(writeFile:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    NSData* data = [self.blobManager resolve:args[@"blob"]];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSString* path = args[@"path"];
    NSNumber* offset = args[@"offset"];
    BOOL truncate = [args[@"truncate"] boolValue];
    if (self.verbose) NSLog(@"ReactNativeMoFs.writeFile path=%@ offset=%@ truncate=%d data=%@", path, offset, truncate, data);
    if ([offset intValue] == 0 && truncate) {
        [data writeToFile:path options:NSDataWritingAtomic error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
    } else {
        if (![[NSFileManager defaultManager] fileExistsAtPath:path]) {
            [[NSFileManager defaultManager] createFileAtPath:path contents:nil attributes:nil];
        }
        NSDictionary<NSFileAttributeKey, id>* stat = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        NSFileHandle* fp = [NSFileHandle fileHandleForWritingToURL:[NSURL fileURLWithPath:path] error:&error];
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        if ([offset longLongValue] < 0) {
            offset = [NSNumber numberWithLongLong:[stat[NSFileSize] longLongValue] + [offset longLongValue] + 1];
        }
        if (self.verbose) NSLog(@"ReactNativeMoFs.writeFile path=%@ offset=%@ filesize=%@", path, offset, stat[NSFileSize]);
        if (@available(iOS 13.0, *)) {
            [fp seekToOffset:[offset unsignedLongLongValue] error:&error];
        } else {
            [fp seekToFileOffset:[offset unsignedLongLongValue]];
        }
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        if (@available(iOS 13.0, *)) {
            [fp writeData:data error:&error];
        } else {
            [fp writeData:data];
        }
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        if (truncate) {
            unsigned long long end = [offset unsignedLongLongValue] + data.length;
            if (@available(iOS 13.0, *)) {
                [fp truncateAtOffset:end error:&error];
            } else {
                [fp truncateFileAtOffset:end];
            }
            if (error) {
                reject(@"", [error localizedDescription], error);
                return;
            }
        }
    }
    resolve(nil);
}

- (BOOL)deleteRecursive:(NSString*)path error:(NSError**)error {
    NSError* err = nil;
    BOOL dir = NO;
    if (![[NSFileManager defaultManager] fileExistsAtPath:path isDirectory:&dir]) {
        return YES;
    }
    if (dir) {
        NSArray* files = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&err];
        if (err) {
            if (error) *error = err;
            return NO;
        }
        for (NSString* file in files) {
            BOOL res = [self deleteRecursive:[path stringByAppendingPathComponent:file] error:error];
            if (!res) return NO;
        }
    }
    [[NSFileManager defaultManager] removeItemAtPath:path error:&err];
    if (err) {
        if (error) *error = err;
        return NO;
    }
    return YES;
}

RCT_EXPORT_METHOD(deleteFile:(NSString*)path recursive:(BOOL)recursive resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    if (recursive) {
        [self deleteRecursive:path error:&error];
    } else {
        [[NSFileManager defaultManager] removeItemAtPath:path error:&error];
    }
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(renameFile:(NSString*)path to:(NSString*)path2 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] moveItemAtPath:path toPath:path2 error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(listDir:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    NSArray<NSString*>* entries = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(entries);
}

RCT_EXPORT_METHOD(createDir:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(stat:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSMutableDictionary<NSFileAttributeKey, id>* stat = [NSMutableDictionary dictionaryWithDictionary:[[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error]];
        if (stat[NSFileModificationDate]) {
            stat[NSFileModificationDate] = @([stat[NSFileModificationDate] timeIntervalSince1970]);
        }
        if (stat[NSFileCreationDate]) {
            stat[NSFileCreationDate] = @([stat[NSFileCreationDate] timeIntervalSince1970]);
        }
        if (error) {
            reject(@"", [error localizedDescription], error);
            return;
        }
        resolve(stat);
    } else {
        resolve(nil);
    }
}

RCT_EXPORT_METHOD(setAttributes:(NSString*)path attributes:(NSDictionary*)attributes resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] setAttributes:attributes ofItemAtPath:path error:&error];
    if (error) {
        reject(@"", [error localizedDescription], error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(getBlobHash:(NSDictionary<NSString*,id>*)blob algorithm:(NSString*)algorithm resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    if ([algorithm isEqualToString:@"sha1"]) {
        uint8_t digest[CC_SHA1_DIGEST_LENGTH];
        CC_SHA1(data.bytes, (CC_LONG)data.length, digest);
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else if ([algorithm isEqualToString:@"md5"]) {
        uint8_t digest[CC_MD5_DIGEST_LENGTH];
        CC_MD5(data.bytes, (CC_LONG)data.length, digest);
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else if ([algorithm isEqualToString:@"sha256"]) {
        uint8_t digest[CC_SHA256_DIGEST_LENGTH];
        CC_SHA256(data.bytes, (CC_LONG)data.length, digest);
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else if ([algorithm isEqualToString:@"sha512"]) {
        uint8_t digest[CC_SHA512_DIGEST_LENGTH];
        CC_SHA512(data.bytes, (CC_LONG)data.length, digest);
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else {
        reject(@"", @"invalid algorithm", nil);
        return;
    }
}

RCT_EXPORT_METHOD(getBlobHmac:(NSDictionary<NSString*,id>*)blob algorithm:(NSString*)algorithm key:(NSString*)key resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSData* keyData = [[NSData alloc] initWithBase64EncodedString:key options:0];
    if ([algorithm isEqualToString:@"sha1"]) {
        uint8_t digest[CC_SHA1_DIGEST_LENGTH];
        CCHmac(
           kCCHmacAlgSHA1,
           keyData.bytes, keyData.length,
           data.bytes, data.length,
           digest
        );
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else if ([algorithm isEqualToString:@"sha256"]) {
        uint8_t digest[CC_SHA256_DIGEST_LENGTH];
        CCHmac(
           kCCHmacAlgSHA256,
           keyData.bytes, keyData.length,
           data.bytes, data.length,
           digest
        );
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else if ([algorithm isEqualToString:@"sha512"]) {
        uint8_t digest[CC_SHA256_DIGEST_LENGTH];
        CCHmac(
           kCCHmacAlgSHA512,
           keyData.bytes, keyData.length,
           data.bytes, data.length,
           digest
        );
        resolve(hexStringForData([NSData dataWithBytes:digest length:sizeof(digest)]));
    } else {
        reject(@"", @"invalid algorithm", nil);
        return;
    }
}

RCT_EXPORT_METHOD(cryptBlob:(NSDictionary<NSString*,id>*)blob algorithm:(NSString*)algorithm encrypt:(BOOL)encrypt key:(NSString*)key iv:(NSString*)iv resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSData* keyData = [[NSData alloc] initWithBase64EncodedString:key options:0];
    NSData* ivData = [[NSData alloc] initWithBase64EncodedString:iv options:0];
    if ([algorithm isEqualToString:@"aes-cbc"]) {
        // okay
    } else {
        reject(@"", @"invalid algorithm", nil);
        return;
    }
    NSMutableData* res = [NSMutableData dataWithLength:data.length + 64];
    size_t dataOutMoved = 0;
    CCCryptorStatus status = CCCrypt(
        encrypt ? kCCEncrypt : kCCDecrypt,
        kCCAlgorithmAES,
        kCCOptionPKCS7Padding,
        keyData.bytes, keyData.length,
        ivData.bytes,
        data.bytes, data.length,
        res.mutableBytes, res.length,
        &dataOutMoved
    );
    if (status != 0) {
        reject(@"", [NSString stringWithFormat:@"encryption error %d", status], nil);
        return;
    }
    res.length = dataOutMoved;
    NSLog(@"XXX %d %zu %lu", status, dataOutMoved, (unsigned long)data.length);
    NSString* blobId = [self.blobManager store:res];
    resolve(@{
        @"size": @([res length]),
        @"offset": @(0),
        @"blobId": blobId,
    });
}

RCT_EXPORT_METHOD(getImageSize:(NSDictionary<NSString*,id>*)blob resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    CIImage* image = [CIImage imageWithData:data];
    if (!image) {
        reject(@"", @"blob not an image", nil);
        return;
    }
    resolve(@{
        @"width": @(image.extent.size.width),
        @"height": @(image.extent.size.height),
    });
}

RCT_EXPORT_METHOD(getExif:(NSDictionary<NSString*,id>*)blob resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    CIImage* image = [CIImage imageWithData:data];
    if (!image) {
        reject(@"", @"blob not an image", nil);
        return;
    }
    resolve(image.properties);
}


RCT_EXPORT_METHOD(updateImage:(NSDictionary<NSString*,id>*)blob args:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    if (self.verbose) NSLog(@"ReactNativeMoFs.updateImage args=%@", args);
    NSData* data = [self.blobManager resolve:blob];
    if (!data) {
        reject(@"", @"blob not found", nil);
        return;
    }
    NSMutableDictionary* options = [NSMutableDictionary new];
    if (@available(iOS 11.0, *)) {
        options[kCIImageApplyOrientationProperty] = @(YES);
    }
    CIImage* image = [CIImage imageWithData:data options:options];
    if (!image) {
        reject(@"", @"blob not an image", nil);
        return;
    }
    
    if (args[@"matrix"]) {
        // input: [ a b tx ]
        //        [ c d ty ]
        //        [ _ _ _ ]
        CGAffineTransform transform = CGAffineTransformMake(
            [args[@"matrix"][0] floatValue],
            [args[@"matrix"][1] floatValue],
            [args[@"matrix"][3] floatValue],
            [args[@"matrix"][4] floatValue],
            [args[@"matrix"][2] floatValue],
            [args[@"matrix"][5] floatValue]
        );
        image = [image imageByApplyingTransform:transform];
    }
    if (args[@"width"]) {
        image = [image imageByCroppingToRect:CGRectMake(0, 0, [args[@"width"] floatValue], [args[@"height"] floatValue])];
    }
    UIImage* uiImage = [UIImage imageWithCGImage:[[CIContext new] createCGImage:image fromRect:image.extent]];
    NSData* output = nil;
    if ([args[@"encoding"] isEqualToString:@"png"]) {
        output = UIImagePNGRepresentation(uiImage);
    } else {
        output = UIImageJPEGRepresentation(uiImage, [args[@"quality"] floatValue]);
    }
    NSString* blobId = [self.blobManager store:output];
    resolve(@{
        @"size": @([output length]),
        @"offset": @(0),
        @"blobId": blobId,
        @"type": [args[@"encoding"] isEqualToString:@"png"] ? @"image/png" : @"image/jpeg",
        @"name": blob[@"name"],
    });
}

RCT_EXPORT_METHOD(showDocumentInteractionController:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.verbose) NSLog(@"ReactNativeMoFs.showDocumentInteractionController args=%@", args);
        UIView* view = RCTSharedApplication().delegate.window.rootViewController.view;
        NSString* path = args[@"path"];
        NSURL* url = [NSURL fileURLWithPath:path];
        UIDocumentInteractionController* controller = [UIDocumentInteractionController interactionControllerWithURL:url];
        if (args[@"uti"]) {
            controller.UTI = args[@"uti"];
        }
        if (args[@"annotation"]) {
            controller.annotation = args[@"annotation"];
        }
        if (args[@"name"]) {
            controller.name = args[@"name"];
        }
        if (!self.refs) self.refs = [NSMutableSet new];
        ReactNativeMoFsInteractionDelegate* delegate = [ReactNativeMoFsInteractionDelegate new];
        delegate.resolve = resolve;
        delegate.reject = reject;
        delegate.refs = self.refs;
        [self.refs addObject:delegate];
        [self.refs addObject:controller];
        controller.delegate = delegate;
        if ([args[@"type"] isEqualToString:@"preview"]) {
            [controller presentPreviewAnimated:YES];
        } else if ([args[@"type"] isEqualToString:@"openin"]) {
            [controller presentOpenInMenuFromRect:CGRectZero inView:view animated:YES];
        } else if ([args[@"type"] isEqualToString:@"options"]) {
            [controller presentOptionsMenuFromRect:CGRectZero inView:view animated:YES];
        } else {
            reject(@"", @"invalid type", nil);
        }
    });
}

RCT_EXPORT_METHOD(showDocumentPickerView:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.verbose) NSLog(@"ReactNativeMoFs.showDocumentPickerView args=%@", args);
        NSMutableArray* utis = [NSMutableArray new];
        if (args[@"utis"]) {
            [utis addObjectsFromArray:args[@"utis"]];
        } else {
            [utis addObject:@"public.item"]; // public.data public.item public.content
        }
        UIDocumentPickerViewController* controller = [[UIDocumentPickerViewController alloc] initWithDocumentTypes:utis inMode:UIDocumentPickerModeImport];
        if (!self.refs) self.refs = [NSMutableSet new];
        ReactNativeMoFsPickerDelegate* delegate = [ReactNativeMoFsPickerDelegate new];
        delegate.resolve = resolve;
        delegate.reject = reject;
        delegate.refs = self.refs;
        [self.refs addObject:delegate];
        [self.refs addObject:controller];
        controller.delegate = delegate;
        controller.modalPresentationStyle = UIModalPresentationFormSheet;
        if (@available(iOS 11.0, *)) {
            controller.allowsMultipleSelection = [args[@"multiple"] boolValue];
        }
        [RCTSharedApplication().delegate.window.rootViewController presentViewController:controller animated:YES completion:nil];
    });
}

RCT_EXPORT_METHOD(showImagePickerController:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    dispatch_async(dispatch_get_main_queue(), ^{
        if (self.verbose) NSLog(@"ReactNativeMoFs.showImagePickerController args=%@", args);
        UIImagePickerController* controller = [UIImagePickerController new];
        if (args[@"sourceType"]) {
            controller.sourceType = [args[@"sourceType"] intValue];
        } else {
            controller.sourceType = UIImagePickerControllerSourceTypePhotoLibrary;
        }
        if (args[@"mediaTypes"]) {
            controller.mediaTypes = args[@"mediaTypes"];
        }
        if (args[@"allowsEditing"]) {
            controller.allowsEditing = [args[@"allowsEditing"] boolValue];
        }
        if (args[@"showsCameraControls"]) {
            controller.showsCameraControls = [args[@"showsCameraControls"] boolValue];
        }
        if (args[@"videoMaximumDuration"]) {
            controller.videoMaximumDuration = [args[@"videoMaximumDuration"] doubleValue];
        }
        if (@available(iOS 11.0, *)) {
            if (args[@"imageExportPreset"]) {
                controller.imageExportPreset = [args[@"imageExportPreset"] intValue];
            }
            if (args[@"videoExportPreset"]) {
                controller.videoExportPreset = args[@"videoExportPreset"];
            }
        }
        if (!self.refs) self.refs = [NSMutableSet new];
        ReactNativeMoFsImagePickerControllerDelegate* delegate = [ReactNativeMoFsImagePickerControllerDelegate new];
        delegate.resolve = resolve;
        delegate.reject = reject;
        delegate.refs = self.refs;
        [self.refs addObject:delegate];
        [self.refs addObject:controller];
        controller.delegate = delegate;
        [RCTSharedApplication().delegate.window.rootViewController presentViewController:controller animated:YES completion:nil];
    });
}

@end
