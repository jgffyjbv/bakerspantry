import AppKit
import Vision
import Foundation

// usage: detext <in> <out> <maxDim>
let a = CommandLine.arguments
let inPath = a[1], outPath = a[2]
let maxDim = CGFloat(Double(a[3])!)
let thresh = a.count > 4 ? Double(a[4])! : 0.955

guard let srcImg = NSImage(contentsOfFile: inPath),
      let tiff = srcImg.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else { print("LOAD FAIL \(inPath)"); exit(1) }

let W = cg.width, H = cg.height
let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8,
                    bytesPerRow: W * 4, space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(cg, in: CGRect(x: 0, y: 0, width: W, height: H))
let buf = ctx.data!.assumingMemoryBound(to: UInt8.self)

// buffer row 0 = top scanline; helpers in top-left pixel coords
func isWhite(_ x: Int, _ y: Int) -> Bool {
    if x < 0 || y < 0 || x >= W || y >= H { return true }
    let o = (y * W + x) * 4
    return buf[o] >= 238 && buf[o+1] >= 238 && buf[o+2] >= 238
}
func isWhiteLoose(_ x: Int, _ y: Int) -> Bool {
    if x < 0 || y < 0 || x >= W || y >= H { return true }
    let o = (y * W + x) * 4
    return buf[o] >= 226 && buf[o+1] >= 226 && buf[o+2] >= 226
}
func fillWhite(_ x0: Int, _ y0: Int, _ x1: Int, _ y1: Int) {
    for y in max(0,y0)...min(H-1,y1) {
        for x in max(0,x0)...min(W-1,x1) {
            let o = (y * W + x) * 4
            buf[o] = 255; buf[o+1] = 255; buf[o+2] = 255; buf[o+3] = 255
        }
    }
}

// --- OCR ---
let req = VNRecognizeTextRequest()
req.recognitionLevel = .accurate
req.usesLanguageCorrection = false
try VNImageRequestHandler(cgImage: cg, options: [:]).perform([req])
var removed = 0, skipped = 0
// cake center: bbox of saturated (colored, non-neutral) pixels
var sMinX = W, sMaxX = -1
for y in 0..<H {
    for x in 0..<W {
        let o = (y * W + x) * 4
        let r = Int(buf[o]), g = Int(buf[o+1]), b = Int(buf[o+2])
        let mx = max(r,g,b), mn = min(r,g,b)
        if mx - mn > 32 && !(r >= 238 && g >= 238 && b >= 238) {
            if x < sMinX { sMinX = x }
            if x > sMaxX { sMaxX = x }
        }
    }
}
let mirAxis = (sMinX + sMaxX) / 2
print("  cake span \(sMinX)-\(sMaxX), axis \(mirAxis)")
for obs in (req.results ?? []) {
    let bb = obs.boundingBox
    let padX = Int(bb.width * CGFloat(W) * 0.10) + 14
    let padY = Int(bb.height * CGFloat(H) * 0.35) + 14
    let x0 = max(0, Int(bb.minX * CGFloat(W)) - padX)
    let x1 = min(W-1, Int(bb.maxX * CGFloat(W)) + padX)
    let y0 = max(0, Int((1 - bb.maxY) * CGFloat(H)) - padY)
    let y1 = min(H-1, Int((1 - bb.minY) * CGFloat(H)) + padY)
    let txt = obs.topCandidates(1).first?.string ?? "?"
    var holes: [(Int, Int)] = []
    for y in y0...y1 {
        for x in x0...x1 {
            let sx = 2 * mirAxis - x
            if sx >= 0 && sx < W && (sx < x0 || sx > x1) {
                let o = (y * W + x) * 4, so = (y * W + sx) * 4
                buf[o] = buf[so]; buf[o+1] = buf[so+1]; buf[o+2] = buf[so+2]; buf[o+3] = buf[so+3]
            } else {
                holes.append((x, y))
            }
        }
    }
    // fill holes by horizontal lerp between valid neighbors on the same row
    var byRow: [Int: [Int]] = [:]
    for (hx, hy) in holes { byRow[hy, default: []].append(hx) }
    for (hy, xsRaw) in byRow {
        let xs = xsRaw.sorted()
        var i = 0
        while i < xs.count {
            var j = i
            while j + 1 < xs.count && xs[j+1] == xs[j] + 1 { j += 1 }
            let lx = max(0, xs[i] - 1), rx = min(W - 1, xs[j] + 1)
            let lo = (hy * W + lx) * 4, ro = (hy * W + rx) * 4
            let span = max(1, xs[j] - xs[i] + 2)
            for x in xs[i]...xs[j] {
                let t = Double(x - xs[i] + 1) / Double(span)
                let o = (hy * W + x) * 4
                for c in 0..<3 {
                    let lv = Double(buf[lo + c]), rv = Double(buf[ro + c])
                    buf[o + c] = UInt8(lv + (rv - lv) * t)
                }
                buf[o + 3] = 255
            }
            i = j + 1
        }
    }
    removed += 1
    print("  mirrored: \"\(txt)\"")
}

// --- autocrop to content bbox ---
var minX = W, minY = H, maxX = -1, maxY = -1
for y in 0..<H {
    for x in 0..<W where !isWhite(x, y) {
        if x < minX { minX = x }
        if x > maxX { maxX = x }
        if y < minY { minY = y }
        if y > maxY { maxY = y }
    }
}
if maxX < 0 { print("EMPTY \(inPath)"); exit(1) }
let bw = maxX - minX + 1, bh = maxY - minY + 1
// pad 7%, then expand to square when reasonably possible
var side = Int(CGFloat(max(bw, bh)) * 1.14)
side = min(side, min(W, H))
var cx = minX + bw / 2, cy = minY + bh / 2
var cw = max(side, bw), ch = max(side, bh)
cw = min(cw, W); ch = min(ch, H)
var ox = cx - cw / 2, oy = cy - ch / 2
ox = max(0, min(ox, W - cw)); oy = max(0, min(oy, H - ch))

let whole = ctx.makeImage()!
let cropped = whole.cropping(to: CGRect(x: ox, y: oy, width: cw, height: ch))!

// --- resize ---
let scale = min(1, maxDim / CGFloat(max(cw, ch)))
let ow = Int(CGFloat(cw) * scale), oh = Int(CGFloat(ch) * scale)
let outCtx = CGContext(data: nil, width: ow, height: oh, bitsPerComponent: 8,
                       bytesPerRow: ow * 4, space: CGColorSpaceCreateDeviceRGB(),
                       bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
outCtx.interpolationQuality = .high
outCtx.draw(cropped, in: CGRect(x: 0, y: 0, width: ow, height: oh))
let outRep = NSBitmapImageRep(cgImage: outCtx.makeImage()!)
let jpeg = outRep.representation(using: .jpeg, properties: [.compressionFactor: 0.85])!
try jpeg.write(to: URL(fileURLWithPath: outPath))
print("\(inPath): removed \(removed), skipped \(skipped), crop \(cw)x\(ch) -> \(ow)x\(oh)")
