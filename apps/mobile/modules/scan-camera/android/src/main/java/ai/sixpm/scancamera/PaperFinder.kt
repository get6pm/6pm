package ai.sixpm.scancamera

import kotlin.math.abs
import kotlin.math.acos
import kotlin.math.hypot
import kotlin.math.max
import kotlin.math.min
import kotlin.math.sqrt

/**
 * Finds a receipt in a small grey picture: the paper is the largest bright patch that stands out
 * from what is around it and is shaped like a four-cornered sheet. Android has no rectangle
 * detector of its own (ML Kit's document scanner is a full-screen flow), so this is a plain one:
 * the picture cut at a few brightness levels, the largest bright regions of each cut, their convex
 * hulls and the largest quadrilateral that fits in each, then checks that the region really is
 * that quadrilateral and stands out from what is around it.
 *
 * Corners come back normalised in the grid, as `[x0, y0, …, x3, y3]` in hull order; [upright]
 * turns them into the camera frame's upright, top-left-first order.
 */
internal object PaperFinder {
  /** Paper is at least this much brighter (0 to 255) than the pixels just outside it. */
  private const val MINIMUM_CONTRAST = 35
  /** Cuts tried between Otsu's threshold and the brightest tones. */
  private const val LEVELS = 5
  /** The brightest tones: what all but this share of the picture is darker than. */
  private const val BRIGHTEST = 0.98
  /** Regions looked at in each cut, largest first. */
  private const val CANDIDATES = 3
  /** The region fills at least this share of its quadrilateral: a sheet, not a blob. */
  private const val MINIMUM_SOLIDITY = 0.8
  /** The quadrilateral covers at least this share of the region's hull: four corners, not more. */
  private const val MINIMUM_HULL_SHARE = 0.9
  /** A region filling more than this is the table or the wall, not a receipt on it. */
  private const val MAXIMUM_SHARE = 0.92
  /** A corner's angle stays within this many degrees of square: paper seen at an angle. */
  private const val ANGLE_TOLERANCE = 40.0

  /**
   * The paper's corners in a `width` by `height` grid of brightness (0 to 255, row by row), or null
   * when no bright, four-cornered region of at least `minimumArea` of the grid is in it.
   *
   * One threshold rarely fits: paper on a pale table needs a higher cut than paper on a dark one.
   * So the picture is cut at Otsu's threshold and at four levels between it and its brightest
   * tones, and the largest sheet any cut shows wins.
   */
  fun find(grey: IntArray, width: Int, height: Int, minimumArea: Double): DoubleArray? {
    val total = width * height
    if (total < 64 || grey.size < total) return null
    val smooth = blur(grey, width, height)
    val histogram = IntArray(256)
    for (value in smooth) histogram[value.coerceIn(0, 255)] += 1
    val low = otsu(histogram, total) ?: return null
    val high = percentile(histogram, total, BRIGHTEST)
    if (high <= low) return null
    var best: DoubleArray? = null
    var bestArea = 0.0
    for (level in (0 until LEVELS).map { low + (high - low) * it / LEVELS }.distinct()) {
      val mask = BooleanArray(total) { smooth[it] > level }
      close(mask, width, height)
      for (region in regions(mask, grey, width, height)) {
        val quad = sheet(region, total, width, height, minimumArea) ?: continue
        val quadArea = area(quad)
        if (quadArea > bestArea) {
          bestArea = quadArea
          best = quad
        }
      }
    }
    val quad = best ?: return null
    return DoubleArray(8) { i -> if (i % 2 == 0) quad[i] / width else quad[i] / height }
  }

  /** The region's quadrilateral when the region is a sheet of paper, else null. */
  private fun sheet(
    region: Region,
    total: Int,
    width: Int,
    height: Int,
    minimumArea: Double,
  ): DoubleArray? {
    val share = region.count.toDouble() / total
    if (share < minimumArea || share > MAXIMUM_SHARE) return null
    // Paper stands out from what is right around it, unlike a pool of light on a wall.
    if (region.inside - region.around < MINIMUM_CONTRAST) return null
    // A sheet running out of the picture is cut by its edge: not a whole receipt yet.
    if (region.onEdge > (width + height) / 6) return null
    val hull = hull(region.points)
    if (hull.size < 8) return null
    val quad = largestQuad(hull) ?: return null
    val quadArea = area(quad)
    if (quadArea / total < minimumArea) return null
    if (region.count / quadArea < MINIMUM_SOLIDITY) return null
    if (quadArea / area(hull) < MINIMUM_HULL_SHARE) return null
    if (!squareEnough(quad)) return null
    return quad
  }

  /**
   * Grid corners turned into the upright frame: rotated by `rotation` degrees clockwise (the
   * camera's `rotationDegrees`), mirrored for the front camera, then ordered top left, top right,
   * bottom right, bottom left.
   */
  fun upright(corners: DoubleArray, rotation: Int, mirrored: Boolean): DoubleArray {
    val points = Array(4) { i ->
      val x = corners[i * 2]
      val y = corners[i * 2 + 1]
      var p =
        when (((rotation % 360) + 360) % 360) {
          90 -> doubleArrayOf(1 - y, x)
          180 -> doubleArrayOf(1 - x, 1 - y)
          270 -> doubleArrayOf(y, 1 - x)
          else -> doubleArrayOf(x, y)
        }
      if (mirrored) p = doubleArrayOf(1 - p[0], p[1])
      p
    }
    return ordered(points)
  }

  /** Four points as top left, top right, bottom right, bottom left (clockwise on screen). */
  fun ordered(points: Array<DoubleArray>): DoubleArray {
    val cx = points.sumOf { it[0] } / 4
    val cy = points.sumOf { it[1] } / 4
    val around = points.sortedBy { kotlin.math.atan2(it[1] - cy, it[0] - cx) }
    val start = around.indices.minBy { around[it][0] + around[it][1] }
    return DoubleArray(8) { i -> around[(start + i / 2) % 4][i % 2] }
  }

  // Steps

  /** A 3×3 box blur, so a receipt's print does not break its paper apart. */
  private fun blur(grey: IntArray, width: Int, height: Int): IntArray {
    val out = IntArray(width * height)
    for (y in 0 until height) {
      for (x in 0 until width) {
        var sum = 0
        var n = 0
        for (dy in -1..1) {
          val yy = y + dy
          if (yy < 0 || yy >= height) continue
          for (dx in -1..1) {
            val xx = x + dx
            if (xx < 0 || xx >= width) continue
            sum += grey[yy * width + xx]
            n += 1
          }
        }
        out[y * width + x] = sum / n
      }
    }
    return out
  }

  /** Otsu's threshold, or null when the picture is one flat tone. */
  private fun otsu(histogram: IntArray, count: Int): Int? {
    val total = count.toDouble()
    var sumAll = 0.0
    for (i in 0..255) sumAll += i * histogram[i].toDouble()
    var weightLow = 0.0
    var sumLow = 0.0
    var best = -1.0
    var threshold = -1
    for (t in 0..254) {
      weightLow += histogram[t]
      if (weightLow == 0.0) continue
      val weightHigh = total - weightLow
      if (weightHigh == 0.0) break
      sumLow += t * histogram[t].toDouble()
      val meanLow = sumLow / weightLow
      val meanHigh = (sumAll - sumLow) / weightHigh
      val between = weightLow * weightHigh * (meanLow - meanHigh) * (meanLow - meanHigh)
      if (between > best) {
        best = between
        threshold = t
      }
    }
    return if (threshold < 0) null else threshold
  }

  /** The tone `share` of the picture is darker than. */
  private fun percentile(histogram: IntArray, count: Int, share: Double): Int {
    var seen = 0
    for (i in 0..255) {
      seen += histogram[i]
      if (seen >= count * share) return i
    }
    return 255
  }

  /** Fills the specks print leaves in the paper: one dilation, then one erosion. */
  private fun close(mask: BooleanArray, width: Int, height: Int) {
    val grown = BooleanArray(mask.size)
    for (y in 0 until height) {
      for (x in 0 until width) {
        grown[y * width + x] = neighbours(mask, width, height, x, y, any = true)
      }
    }
    for (y in 0 until height) {
      for (x in 0 until width) {
        mask[y * width + x] = neighbours(grown, width, height, x, y, any = false)
      }
    }
  }

  private fun neighbours(
    mask: BooleanArray,
    width: Int,
    height: Int,
    x: Int,
    y: Int,
    any: Boolean,
  ): Boolean {
    for (dy in -1..1) {
      for (dx in -1..1) {
        val xx = (x + dx).coerceIn(0, width - 1)
        val yy = (y + dy).coerceIn(0, height - 1)
        if (mask[yy * width + xx] == any) return any
      }
    }
    return !any
  }

  private class Region(
    val count: Int,
    /** Its mean brightness, and that of the pixels just outside it. */
    val inside: Double,
    val around: Double,
    val onEdge: Int,
    val points: List<DoubleArray>,
  )

  /**
   * The few largest bright regions (4-connected): each one's size, brightness inside and just
   * outside, how much of it lies on the picture's edge, and the outer corners of its leftmost and
   * rightmost pixel in each row (enough for its hull).
   */
  private fun regions(mask: BooleanArray, grey: IntArray, width: Int, height: Int): List<Region> {
    val label = IntArray(mask.size)
    val stack = IntArray(mask.size)
    class Found(val label: Int, val count: Int, val inside: Double, val around: Double)
    val found = ArrayList<Found>()
    var next = 0
    for (start in mask.indices) {
      if (!mask[start] || label[start] != 0) continue
      next += 1
      var top = 0
      var count = 0
      var inside = 0L
      var around = 0L
      var arounds = 0
      stack[top++] = start
      label[start] = next
      while (top > 0) {
        val at = stack[--top]
        count += 1
        inside += grey[at]
        val x = at % width
        val y = at / width
        for (side in 0 until 4) {
          val to =
            when (side) {
              0 -> if (x > 0) at - 1 else -1
              1 -> if (x < width - 1) at + 1 else -1
              2 -> if (y > 0) at - width else -1
              else -> if (y < height - 1) at + width else -1
            }
          if (to < 0) continue
          if (mask[to]) {
            if (label[to] == 0) {
              label[to] = next
              stack[top++] = to
            }
          } else {
            around += grey[to]
            arounds += 1
          }
        }
      }
      found.add(
        Found(
          next,
          count,
          inside.toDouble() / count,
          if (arounds == 0) 255.0 else around.toDouble() / arounds,
        )
      )
    }
    return found
      .sortedByDescending { it.count }
      .take(CANDIDATES)
      .map { region ->
        val points = ArrayList<DoubleArray>(height * 4)
        var onEdge = 0
        for (y in 0 until height) {
          var left = -1
          var right = -1
          for (x in 0 until width) {
            if (label[y * width + x] != region.label) continue
            if (left < 0) left = x
            right = x
            if (x == 0 || y == 0 || x == width - 1 || y == height - 1) onEdge += 1
          }
          if (left < 0) continue
          points.add(doubleArrayOf(left.toDouble(), y.toDouble()))
          points.add(doubleArrayOf(left.toDouble(), y + 1.0))
          points.add(doubleArrayOf(right + 1.0, y.toDouble()))
          points.add(doubleArrayOf(right + 1.0, y + 1.0))
        }
        Region(region.count, region.inside, region.around, onEdge, points)
      }
  }

  /** The convex hull (Andrew's monotone chain), counter-clockwise, as `[x0, y0, x1, y1, …]`. */
  private fun hull(points: List<DoubleArray>): DoubleArray {
    val sorted = points.sortedWith(compareBy({ it[0] }, { it[1] }))
    if (sorted.size < 3) return DoubleArray(0)
    val chain = ArrayList<DoubleArray>(sorted.size * 2)
    fun cross(o: DoubleArray, a: DoubleArray, b: DoubleArray) =
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    for (p in sorted) {
      while (chain.size >= 2 && cross(chain[chain.size - 2], chain[chain.size - 1], p) <= 0) {
        chain.removeAt(chain.size - 1)
      }
      chain.add(p)
    }
    val lower = chain.size + 1
    for (i in sorted.size - 2 downTo 0) {
      val p = sorted[i]
      while (chain.size >= lower && cross(chain[chain.size - 2], chain[chain.size - 1], p) <= 0) {
        chain.removeAt(chain.size - 1)
      }
      chain.add(p)
    }
    chain.removeAt(chain.size - 1)
    return DoubleArray(chain.size * 2) { i -> chain[i / 2][i % 2] }
  }

  /** The largest quadrilateral with its corners on the hull's vertices. */
  private fun largestQuad(hull: DoubleArray): DoubleArray? {
    val n = hull.size / 2
    if (n < 4) return null
    fun x(i: Int) = hull[(i % n) * 2]
    fun y(i: Int) = hull[(i % n) * 2 + 1]
    fun triangle(a: Int, b: Int, c: Int) =
      abs((x(b) - x(a)) * (y(c) - y(a)) - (y(b) - y(a)) * (x(c) - x(a))) / 2
    var best = 0.0
    var corners: IntArray? = null
    for (i in 0 until n) {
      for (k in i + 2 until i + n - 1) {
        var left = 0.0
        var j = -1
        for (m in i + 1 until k) {
          val a = triangle(i, m, k)
          if (a > left) {
            left = a
            j = m
          }
        }
        var right = 0.0
        var l = -1
        for (m in k + 1 until i + n) {
          val a = triangle(k, m, i)
          if (a > right) {
            right = a
            l = m
          }
        }
        if (j >= 0 && l >= 0 && left + right > best) {
          best = left + right
          corners = intArrayOf(i, j, k, l)
        }
      }
    }
    val found = corners ?: return null
    return DoubleArray(8) { idx -> if (idx % 2 == 0) x(found[idx / 2]) else y(found[idx / 2]) }
  }

  /** A polygon's area (shoelace formula). */
  private fun area(polygon: DoubleArray): Double {
    val n = polygon.size / 2
    var sum = 0.0
    for (i in 0 until n) {
      val j = (i + 1) % n
      sum += polygon[i * 2] * polygon[j * 2 + 1] - polygon[j * 2] * polygon[i * 2 + 1]
    }
    return abs(sum) / 2
  }

  /** Every corner is near a right angle and no side is a sliver. */
  private fun squareEnough(quad: DoubleArray): Boolean {
    var shortest = Double.MAX_VALUE
    var longest = 0.0
    for (i in 0 until 4) {
      val prev = (i + 3) % 4
      val next = (i + 1) % 4
      val ax = quad[prev * 2] - quad[i * 2]
      val ay = quad[prev * 2 + 1] - quad[i * 2 + 1]
      val bx = quad[next * 2] - quad[i * 2]
      val by = quad[next * 2 + 1] - quad[i * 2 + 1]
      val la = hypot(ax, ay)
      val lb = hypot(bx, by)
      if (la == 0.0 || lb == 0.0) return false
      val cos = ((ax * bx + ay * by) / (la * lb)).coerceIn(-1.0, 1.0)
      val angle = Math.toDegrees(acos(cos))
      if (abs(angle - 90) > ANGLE_TOLERANCE) return false
      shortest = min(shortest, lb)
      longest = max(longest, lb)
    }
    // A receipt is long and narrow, but not a line: Vision's lowest aspect ratio for one is 0.15.
    return shortest / longest >= 0.12 && sqrt(area(quad)) > 4
  }
}
