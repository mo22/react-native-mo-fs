#import <UIKit/UIKit.h>
#import <CoreLocation/CoreLocation.h>
#import <React/RCTUIManager.h>
#import <React/RCTNetworking.h>
#import <CommonCrypto/CommonDigest.h>
#import <CoreServices/CoreServices.h>

#if __has_include(<RCTBlob/RCTBlobManager.h>)
#import <RCTBlob/RCTBlobManager.h>
#elif __has_include(<RCTBlobManager.h>)
#import <RCTBlobManager.h>
#else
#import "RCTBlobManager.h"
#endif



NSString* mimeTypeForPath(NSString* path) {
    NSString* uti = CFBridgingRelease(UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, (__bridge CFStringRef _Nonnull)([path pathExtension]), nil));
    NSString* mime = CFBridgingRelease(UTTypeCopyPreferredTagWithClass((__bridge CFStringRef _Nonnull)(uti), kUTTagClassMIMEType));
    if (!mime) return @"application/octet-stream";
    return mime;
}



@interface ReactNativeMoFs : NSObject <RCTBridgeModule>
@end

@implementation ReactNativeMoFs

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
    return YES;
}

- (dispatch_queue_t)methodQueue {
    return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(getMimeType:(NSString*)extension resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(mimeTypeForPath(extension));
}

RCT_EXPORT_METHOD(getPaths:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    resolve(@{
        @"bundle": [[NSBundle mainBundle] bundlePath],
        @"document": [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject],
        @"caches": [NSSearchPathForDirectoriesInDomains(NSCachesDirectory, NSUserDomainMask, YES) lastObject],
    });
}

RCT_EXPORT_METHOD(readFile:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSError* error = nil;
    NSData* data = [NSData dataWithContentsOfFile:path options:0 error:&error];
    if (!data) {
        reject(@"", @"", error);
        return;
    }
    NSString* blobId = [blobManager store:data];
    resolve(@{
        @"size": @([data length]),
        @"offset": @(0),
        @"blobId": blobId,
        @"type": mimeTypeForPath(path),
        @"name": [path lastPathComponent],
    });
}

RCT_EXPORT_METHOD(writeFile:(NSString*)path blob:(NSDictionary<NSString*,id>*)blob resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"ENOBLOB", nil);
        return;
    }
    NSError* error = nil;
    [data writeToFile:path options:NSDataWritingAtomic error:&error];
    if (error) {
        reject(@"", @"", error);
        return;
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

RCT_EXPORT_METHOD(deleteFile:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    // recursive?
    NSError* error = nil;
    [self deleteRecursive:path error:&error];
//    [[NSFileManager defaultManager] removeItemAtPath:path error:&error];
    if (error) {
        reject(@"", @"", error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(renameFile:(NSString*)path to:(NSString*)path2 resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] moveItemAtPath:path toPath:path2 error:&error];
    if (error) {
        reject(@"", @"", error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(listDir:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    NSArray<NSString*>* entries = [[NSFileManager defaultManager] contentsOfDirectoryAtPath:path error:&error];
    if (error) {
        reject(@"", @"", error);
        return;
    }
    resolve(entries);
}

RCT_EXPORT_METHOD(createDir:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    [[NSFileManager defaultManager] createDirectoryAtPath:path withIntermediateDirectories:YES attributes:nil error:&error];
    if (error) {
        reject(@"", @"", error);
        return;
    }
    resolve(nil);
}

RCT_EXPORT_METHOD(stat:(NSString*)path resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    NSError* error = nil;
    if ([[NSFileManager defaultManager] fileExistsAtPath:path]) {
        NSDictionary<NSFileAttributeKey, id>* stat = [[NSFileManager defaultManager] attributesOfItemAtPath:path error:&error];
        if (error) {
            NSLog(@"stat error %@", error);
            reject(@"", @"", error);
            return;
        }
        resolve(stat);
    } else {
        resolve(nil);
    }
}

RCT_EXPORT_METHOD(getBlobInfo:(NSDictionary<NSString*,id>*)blob args:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"ENOBLOB", nil);
        return;
    }
    NSMutableDictionary* res = [NSMutableDictionary new];
    res[@"size"] = @([data length]);
    if (args[@"sha1"]) {
        uint8_t digest[CC_SHA1_DIGEST_LENGTH];
        CC_SHA1(data.bytes, (CC_LONG)data.length, digest);
        NSMutableString *output = [NSMutableString stringWithCapacity:CC_SHA1_DIGEST_LENGTH * 2];
        for (int i = 0; i < CC_SHA1_DIGEST_LENGTH; i++) [output appendFormat:@"%02x", digest[i]];
        res[@"sha1"] = output;
    }
    if (args[@"md5"]) {
        uint8_t digest[CC_MD5_DIGEST_LENGTH];
        CC_MD5(data.bytes, (CC_LONG)data.length, digest);
        NSMutableString *output = [NSMutableString stringWithCapacity:CC_MD5_DIGEST_LENGTH * 2];
        for (int i = 0; i < CC_MD5_DIGEST_LENGTH; i++) [output appendFormat:@"%02x", digest[i]];
        res[@"md5"] = output;
    }
    if (args[@"sha256"]) {
        uint8_t digest[CC_SHA256_DIGEST_LENGTH];
        CC_SHA256(data.bytes, (CC_LONG)data.length, digest);
        NSMutableString *output = [NSMutableString stringWithCapacity:CC_SHA256_DIGEST_LENGTH * 2];
        for (int i = 0; i < CC_SHA256_DIGEST_LENGTH; i++) [output appendFormat:@"%02x", digest[i]];
        res[@"sha256"] = output;
    }
    resolve(res);
}

RCT_EXPORT_METHOD(updateImage:(NSDictionary<NSString*,id>*)blob args:(NSDictionary*)args resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject) {
//    NSLog(@"updateImage %@", args);

    RCTBlobManager* blobManager = [self.bridge moduleForClass:[RCTBlobManager class]];
    NSData* data = [blobManager resolve:blob];
    if (!data) {
        reject(@"", @"ENOBLOB", nil);
        return;
    }
    CIImage* image = [CIImage imageWithData:data];
    if (!image) {
        reject(@"", @"ENOIMAGE", nil);
        return;
    }
//    NSLog(@"image %@", image);

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
//        NSLog(@"transform=%@", NSStringFromCGAffineTransform(transform));
        image = [image imageByApplyingTransform:transform];
    }

    if (args[@"width"]) {
        image = [image imageByCroppingToRect:CGRectMake(0, 0, [args[@"width"] floatValue], [args[@"height"] floatValue])];
    }

    UIImage* uiImage = [UIImage imageWithCGImage:[[CIContext new] createCGImage:image fromRect:image.extent]];
//    NSLog(@"uiImage %@", uiImage);

    NSData* output = nil;
    if ([args[@"encoding"] isEqualToString:@"png"]) {
//        NSLog(@"create png");
//        output = [[CIContext new] PNGRepresentationOfImage:image format:kCIFormatARGB8 colorSpace:CGColorSpaceCreateDeviceRGB() options:@{}];
        output = UIImagePNGRepresentation(uiImage);
    } else {
//        NSLog(@"create jpeg %f", [args[@"quality"] floatValue]);
//        output = [[CIContext new] JPEGRepresentationOfImage:image colorSpace:CGColorSpaceCreateDeviceRGB() options:@{
//            (__bridge NSString *)kCGImageDestinationLossyCompressionQuality: args[@"quality"]
//        }];
        output = UIImageJPEGRepresentation(uiImage, [args[@"quality"] floatValue]);
    }
//    NSLog(@"output %lu", (unsigned long)output.length);
    NSString* blobId = [blobManager store:output];
    resolve(@{
        @"size": @([output length]),
        @"offset": @(0),
        @"blobId": blobId,
        @"type": [args[@"encoding"] isEqualToString:@"png"] ? @"image/png" : @"image/jpeg",
        @"name": blob[@"name"],
    });
}

@end
