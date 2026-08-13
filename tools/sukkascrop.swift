import AppKit
import Vision
import Foundation

// usage: sukkascrop <page.jpg> <outdir> <maxDim>
let a = CommandLine.arguments
let inPath = a[1], outDir = a[2]
let maxDim = CGFloat(Double(a[3])!)
try? FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)

guard let srcImg = NSImage(contentsOfFile: inPath),
      let tiff = srcImg.tiffRepresentation,
      let rep = NSBitmapImageRep(data: tiff),
      let cg = rep.cgImage else { print("LOAD FAIL"); exit(1) }
let W = cg.width, H = cg.height

let ctx = CGContext(data: nil, width: W, height: H, bitsPerComponent: 8,
                    bytesPerRow: W * 4, space: CGColorSpaceCreateDeviceRGB(),
                    bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
ctx.draw(cg, in: CGRect(x: 0, y: 0, width: W, height: H))
let buf = ctx.data!.assumingMemoryBound(to: UInt8.self)

func colored(_ x: Int, _ y: Int) -> Bool {
    let o = (y * W + x) * 4
    return buf[o] < 240 || buf[o+1] < 240 || buf[o+2] < 240
}

// runs of content along an axis given a predicate profile
func runs(_ profile: [Double], thresh: Double, minGap: Int, minRun: Int) -> [(Int, Int)] {
    var out: [(Int, Int)] = []
    var start = -1, gap = 0
    for i in 0..<profile.count {
        if profile[i] > thresh {
            if start < 0 { start = i }
            gap = 0
        } else if start >= 0 {
            gap += 1
            if gap >= minGap {
                let end = i - gap
                if end - start + 1 >= minRun { out.append((start, end)) }
                start = -1; gap = 0
            }
        }
    }
    if start >= 0 {
        let end = profile.count - 1
        if end - start + 1 >= minRun { out.append((start, end)) }
    }
    return out
}

// 1. vertical panels (x-profile over whole page)
var xprof = [Double](repeating: 0, count: W)
for x in 0..<W { var c = 0; for y in stride(from: 0, to: H, by: 4) where colored(x, y) { c += 1 }; xprof[x] = Double(c) / Double(H/4) }
let panels = runs(xprof, thresh: 0.02, minGap: 25, minRun: 300)
print("panels:", panels.map { "\($0.0)-\($0.1)" }.joined(separator: ", "))

let whole = ctx.makeImage()!
var found: [(String, Int, String, CGRect)] = []

func ocrCaption(_ rect: CGRect) -> (String, Int, String)? {
    guard let tileImg = whole.cropping(to: rect) else { return nil }
    let req = VNRecognizeTextRequest()
    req.recognitionLevel = .accurate
    req.usesLanguageCorrection = false
    try? VNImageRequestHandler(cgImage: tileImg, options: [:]).perform([req])
    let text = (req.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    guard let m = text.range(of: #"S\d{4}"#, options: .regularExpression) else { return nil }
    let code = String(text[m])
    var price = 0
    if let pm = text.range(of: #"\$\s?\d+"#, options: .regularExpression) {
        price = Int(text[pm].dropFirst().trimmingCharacters(in: .whitespaces)) ?? 0
    }
    var pcs = ""
    if let cm = text.range(of: #"\d+\s?pcs"#, options: .regularExpression) {
        pcs = String(text[cm]).replacingOccurrences(of: "pcs", with: "").trimmingCharacters(in: .whitespaces) + " pcs"
    }
    return (code, price, pcs)
}

for (px0, px1) in panels {
    // 2. row bands within panel
    var yprof = [Double](repeating: 0, count: H)
    for y in 0..<H { var c = 0; for x in stride(from: px0, to: px1, by: 3) where colored(x, y) { c += 1 }; yprof[y] = Double(c) / Double((px1-px0)/3) }
    let rows = runs(yprof, thresh: 0.03, minGap: 8, minRun: 110)
    for (ry0, ry1) in rows {
        // 3. tiles within row band
        var txprof = [Double](repeating: 0, count: px1 - px0 + 1)
        for x in px0...px1 { var c = 0; for y in stride(from: ry0, to: ry1, by: 2) where colored(x, y) { c += 1 }; txprof[x - px0] = Double(c) / Double((ry1-ry0)/2) }
        let tiles = runs(txprof, thresh: 0.05, minGap: 8, minRun: 130)
        for (tx0, tx1) in tiles {
            let rect = CGRect(x: px0 + tx0, y: ry0, width: tx1 - tx0 + 1, height: ry1 - ry0 + 1)
            // caption strip = bottom 30% of tile
            let capIn = CGRect(x: rect.minX, y: rect.maxY - rect.height * 0.3, width: rect.width, height: rect.height * 0.3)
            let belowH = min(CGFloat(110), CGFloat(H) - rect.maxY)
            let capBelow = CGRect(x: rect.minX, y: rect.maxY, width: rect.width, height: belowH)
            if let (code, price, pcs) = ocrCaption(capIn) {
                found.append((code, price, pcs, rect))
            } else if belowH > 30, let (code, price, pcs) = ocrCaption(capBelow) {
                found.append((code, price, pcs, rect))
            }
        }
    }
}

found.sort { $0.0 < $1.0 }
for (code, price, pcs, rect) in found {
    guard let tile = whole.cropping(to: rect.insetBy(dx: 4, dy: 4)) else { continue }
    let scale = min(1, maxDim / CGFloat(max(tile.width, tile.height)))
    let ow = Int(CGFloat(tile.width) * scale), oh = Int(CGFloat(tile.height) * scale)
    let octx = CGContext(data: nil, width: ow, height: oh, bitsPerComponent: 8,
                         bytesPerRow: ow * 4, space: CGColorSpaceCreateDeviceRGB(),
                         bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
    octx.interpolationQuality = .high
    octx.draw(tile, in: CGRect(x: 0, y: 0, width: ow, height: oh))
    let orep = NSBitmapImageRep(cgImage: octx.makeImage()!)
    let jpg = orep.representation(using: .jpeg, properties: [.compressionFactor: 0.85])!
    try? jpg.write(to: URL(fileURLWithPath: outDir + "/\(code.lowercased()).jpg"))
    print("\(code) $\(price) \(pcs) rect=\(Int(rect.minX)),\(Int(rect.minY)) \(Int(rect.width))x\(Int(rect.height))")
}
print("TOTAL:", found.count)
