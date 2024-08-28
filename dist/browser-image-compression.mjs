/**
 * Browser Image Compression
 * v2.0.2
 * by Donald <donaldcwl@gmail.com>
 * https://github.com/Donaldcwl/browser-image-compression
 */

function _mergeNamespaces(n, m) {
  m.forEach(function (e) {
    e && typeof e !== 'string' && !Array.isArray(e) && Object.keys(e).forEach(function (k) {
      if (k !== 'default' && !(k in n)) {
        var d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: function () { return e[k]; }
        });
      }
    });
  });
  return Object.freeze(n);
}

function copyExifWithoutOrientation(srcBlob, destBlob) {
  return new Promise(function ($return, $error) {
    let exif;
    return getApp1Segment(srcBlob).then(function ($await_1) {
      try {
        exif = $await_1;
        return $return(new Blob([destBlob.slice(0, 2), exif, destBlob.slice(2)], {
          type: 'image/jpeg'
        }));
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
const SOI = 0xffd8;
const SOS = 0xffda;
const APP1 = 0xffe1;
const EXIF = 0x45786966;
const LITTLE_ENDIAN = 0x4949;
const BIG_ENDIAN = 0x4d4d;
const TAG_ID_ORIENTATION = 0x0112;
const TAG_TYPE_SHORT = 3;
const getApp1Segment = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.addEventListener('load', ({
    target: {
      result: buffer
    }
  }) => {
    const view = new DataView(buffer);
    let offset = 0;
    if (view.getUint16(offset) !== SOI) return reject('not a valid JPEG');
    offset += 2;
    while (true) {
      const marker = view.getUint16(offset);
      if (marker === SOS) break;
      const size = view.getUint16(offset + 2);
      if (marker === APP1 && view.getUint32(offset + 4) === EXIF) {
        const tiffOffset = offset + 10;
        let littleEndian;
        switch (view.getUint16(tiffOffset)) {
          case LITTLE_ENDIAN:
            littleEndian = true;
            break;
          case BIG_ENDIAN:
            littleEndian = false;
            break;
          default:
            return reject('TIFF header contains invalid endian');
        }
        if (view.getUint16(tiffOffset + 2, littleEndian) !== 0x2a) {
          return reject('TIFF header contains invalid version');
        }
        const ifd0Offset = view.getUint32(tiffOffset + 4, littleEndian);
        const endOfTagsOffset = tiffOffset + ifd0Offset + 2 + view.getUint16(tiffOffset + ifd0Offset, littleEndian) * 12;
        for (let i = tiffOffset + ifd0Offset + 2; i < endOfTagsOffset; i += 12) {
          const tagId = view.getUint16(i, littleEndian);
          if (tagId == TAG_ID_ORIENTATION) {
            if (view.getUint16(i + 2, littleEndian) !== TAG_TYPE_SHORT) {
              return reject('Orientation data type is invalid');
            }
            if (view.getUint32(i + 4, littleEndian) !== 1) {
              return reject('Orientation data count is invalid');
            }
            view.setUint16(i + 8, 1, littleEndian);
            break;
          }
        }
        return resolve(buffer.slice(offset, offset + 2 + size));
      }
      offset += 2 + size;
    }
    return resolve(new Blob());
  });
  reader.readAsArrayBuffer(blob);
});

var UZIPExports = {};
var UZIP$1 = {
  get exports(){ return UZIPExports; },
  set exports(v){ UZIPExports = v; },
};

(function (module) {
  var UZIP = {};
  module.exports = UZIP;
  UZIP["parse"] = function (buf, onlyNames) {
    var rUs = UZIP.bin.readUshort,
      rUi = UZIP.bin.readUint,
      o = 0,
      out = {};
    var data = new Uint8Array(buf);
    var eocd = data.length - 4;
    while (rUi(data, eocd) != 0x06054b50) eocd--;
    var o = eocd;
    o += 4;
    o += 4;
    var cnu = rUs(data, o);
    o += 2;
    rUs(data, o);
    o += 2;
    var csize = rUi(data, o);
    o += 4;
    var coffs = rUi(data, o);
    o += 4;
    o = coffs;
    for (var i = 0; i < cnu; i++) {
      rUi(data, o);
      o += 4;
      o += 4;
      o += 4;
      o += 4;
      rUi(data, o);
      o += 4;
      var csize = rUi(data, o);
      o += 4;
      var usize = rUi(data, o);
      o += 4;
      var nl = rUs(data, o),
        el = rUs(data, o + 2),
        cl = rUs(data, o + 4);
      o += 6;
      o += 8;
      var roff = rUi(data, o);
      o += 4;
      o += nl + el + cl;
      UZIP._readLocal(data, roff, out, csize, usize, onlyNames);
    }
    return out;
  };
  UZIP._readLocal = function (data, o, out, csize, usize, onlyNames) {
    var rUs = UZIP.bin.readUshort,
      rUi = UZIP.bin.readUint;
    rUi(data, o);
    o += 4;
    rUs(data, o);
    o += 2;
    rUs(data, o);
    o += 2;
    var cmpr = rUs(data, o);
    o += 2;
    rUi(data, o);
    o += 4;
    rUi(data, o);
    o += 4;
    o += 8;
    var nlen = rUs(data, o);
    o += 2;
    var elen = rUs(data, o);
    o += 2;
    var name = UZIP.bin.readUTF8(data, o, nlen);
    o += nlen;
    o += elen;
    if (onlyNames) {
      out[name] = {
        size: usize,
        csize: csize
      };
      return;
    }
    var file = new Uint8Array(data.buffer, o);
    if (cmpr == 0) out[name] = new Uint8Array(file.buffer.slice(o, o + csize));else if (cmpr == 8) {
      var buf = new Uint8Array(usize);
      UZIP.inflateRaw(file, buf);
      out[name] = buf;
    } else throw "unknown compression method: " + cmpr;
  };
  UZIP.inflateRaw = function (file, buf) {
    return UZIP.F.inflate(file, buf);
  };
  UZIP.inflate = function (file, buf) {
    file[0];
      file[1];
    return UZIP.inflateRaw(new Uint8Array(file.buffer, file.byteOffset + 2, file.length - 6), buf);
  };
  UZIP.deflate = function (data, opts) {
    if (opts == null) opts = {
      level: 6
    };
    var off = 0,
      buf = new Uint8Array(50 + Math.floor(data.length * 1.1));
    buf[off] = 120;
    buf[off + 1] = 156;
    off += 2;
    off = UZIP.F.deflateRaw(data, buf, off, opts.level);
    var crc = UZIP.adler(data, 0, data.length);
    buf[off + 0] = crc >>> 24 & 255;
    buf[off + 1] = crc >>> 16 & 255;
    buf[off + 2] = crc >>> 8 & 255;
    buf[off + 3] = crc >>> 0 & 255;
    return new Uint8Array(buf.buffer, 0, off + 4);
  };
  UZIP.deflateRaw = function (data, opts) {
    if (opts == null) opts = {
      level: 6
    };
    var buf = new Uint8Array(50 + Math.floor(data.length * 1.1));
    var off = UZIP.F.deflateRaw(data, buf, off, opts.level);
    return new Uint8Array(buf.buffer, 0, off);
  };
  UZIP.encode = function (obj, noCmpr) {
    if (noCmpr == null) noCmpr = false;
    var tot = 0,
      wUi = UZIP.bin.writeUint,
      wUs = UZIP.bin.writeUshort;
    var zpd = {};
    for (var p in obj) {
      var cpr = !UZIP._noNeed(p) && !noCmpr,
        buf = obj[p],
        crc = UZIP.crc.crc(buf, 0, buf.length);
      zpd[p] = {
        cpr: cpr,
        usize: buf.length,
        crc: crc,
        file: cpr ? UZIP.deflateRaw(buf) : buf
      };
    }
    for (var p in zpd) tot += zpd[p].file.length + 30 + 46 + 2 * UZIP.bin.sizeUTF8(p);
    tot += 22;
    var data = new Uint8Array(tot),
      o = 0;
    var fof = [];
    for (var p in zpd) {
      var file = zpd[p];
      fof.push(o);
      o = UZIP._writeHeader(data, o, p, file, 0);
    }
    var i = 0,
      ioff = o;
    for (var p in zpd) {
      var file = zpd[p];
      fof.push(o);
      o = UZIP._writeHeader(data, o, p, file, 1, fof[i++]);
    }
    var csize = o - ioff;
    wUi(data, o, 0x06054b50);
    o += 4;
    o += 4;
    wUs(data, o, i);
    o += 2;
    wUs(data, o, i);
    o += 2;
    wUi(data, o, csize);
    o += 4;
    wUi(data, o, ioff);
    o += 4;
    o += 2;
    return data.buffer;
  };
  UZIP._noNeed = function (fn) {
    var ext = fn.split(".").pop().toLowerCase();
    return "png,jpg,jpeg,zip".indexOf(ext) != -1;
  };
  UZIP._writeHeader = function (data, o, p, obj, t, roff) {
    var wUi = UZIP.bin.writeUint,
      wUs = UZIP.bin.writeUshort;
    var file = obj.file;
    wUi(data, o, t == 0 ? 0x04034b50 : 0x02014b50);
    o += 4;
    if (t == 1) o += 2;
    wUs(data, o, 20);
    o += 2;
    wUs(data, o, 0);
    o += 2;
    wUs(data, o, obj.cpr ? 8 : 0);
    o += 2;
    wUi(data, o, 0);
    o += 4;
    wUi(data, o, obj.crc);
    o += 4;
    wUi(data, o, file.length);
    o += 4;
    wUi(data, o, obj.usize);
    o += 4;
    wUs(data, o, UZIP.bin.sizeUTF8(p));
    o += 2;
    wUs(data, o, 0);
    o += 2;
    if (t == 1) {
      o += 2;
      o += 2;
      o += 6;
      wUi(data, o, roff);
      o += 4;
    }
    var nlen = UZIP.bin.writeUTF8(data, o, p);
    o += nlen;
    if (t == 0) {
      data.set(file, o);
      o += file.length;
    }
    return o;
  };
  UZIP.crc = {
    table: function () {
      var tab = new Uint32Array(256);
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) {
          if (c & 1) c = 0xedb88320 ^ c >>> 1;else c = c >>> 1;
        }
        tab[n] = c;
      }
      return tab;
    }(),
    update: function (c, buf, off, len) {
      for (var i = 0; i < len; i++) c = UZIP.crc.table[(c ^ buf[off + i]) & 0xff] ^ c >>> 8;
      return c;
    },
    crc: function (b, o, l) {
      return UZIP.crc.update(0xffffffff, b, o, l) ^ 0xffffffff;
    }
  };
  UZIP.adler = function (data, o, len) {
    var a = 1,
      b = 0;
    var off = o,
      end = o + len;
    while (off < end) {
      var eend = Math.min(off + 5552, end);
      while (off < eend) {
        a += data[off++];
        b += a;
      }
      a = a % 65521;
      b = b % 65521;
    }
    return b << 16 | a;
  };
  UZIP.bin = {
    readUshort: function (buff, p) {
      return buff[p] | buff[p + 1] << 8;
    },
    writeUshort: function (buff, p, n) {
      buff[p] = n & 255;
      buff[p + 1] = n >> 8 & 255;
    },
    readUint: function (buff, p) {
      return buff[p + 3] * (256 * 256 * 256) + (buff[p + 2] << 16 | buff[p + 1] << 8 | buff[p]);
    },
    writeUint: function (buff, p, n) {
      buff[p] = n & 255;
      buff[p + 1] = n >> 8 & 255;
      buff[p + 2] = n >> 16 & 255;
      buff[p + 3] = n >> 24 & 255;
    },
    readASCII: function (buff, p, l) {
      var s = "";
      for (var i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
      return s;
    },
    writeASCII: function (data, p, s) {
      for (var i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
    },
    pad: function (n) {
      return n.length < 2 ? "0" + n : n;
    },
    readUTF8: function (buff, p, l) {
      var s = "",
        ns;
      for (var i = 0; i < l; i++) s += "%" + UZIP.bin.pad(buff[p + i].toString(16));
      try {
        ns = decodeURIComponent(s);
      } catch (e) {
        return UZIP.bin.readASCII(buff, p, l);
      }
      return ns;
    },
    writeUTF8: function (buff, p, str) {
      var strl = str.length,
        i = 0;
      for (var ci = 0; ci < strl; ci++) {
        var code = str.charCodeAt(ci);
        if ((code & 0xffffffff - (1 << 7) + 1) == 0) {
          buff[p + i] = code;
          i++;
        } else if ((code & 0xffffffff - (1 << 11) + 1) == 0) {
          buff[p + i] = 192 | code >> 6;
          buff[p + i + 1] = 128 | code >> 0 & 63;
          i += 2;
        } else if ((code & 0xffffffff - (1 << 16) + 1) == 0) {
          buff[p + i] = 224 | code >> 12;
          buff[p + i + 1] = 128 | code >> 6 & 63;
          buff[p + i + 2] = 128 | code >> 0 & 63;
          i += 3;
        } else if ((code & 0xffffffff - (1 << 21) + 1) == 0) {
          buff[p + i] = 240 | code >> 18;
          buff[p + i + 1] = 128 | code >> 12 & 63;
          buff[p + i + 2] = 128 | code >> 6 & 63;
          buff[p + i + 3] = 128 | code >> 0 & 63;
          i += 4;
        } else throw "e";
      }
      return i;
    },
    sizeUTF8: function (str) {
      var strl = str.length,
        i = 0;
      for (var ci = 0; ci < strl; ci++) {
        var code = str.charCodeAt(ci);
        if ((code & 0xffffffff - (1 << 7) + 1) == 0) {
          i++;
        } else if ((code & 0xffffffff - (1 << 11) + 1) == 0) {
          i += 2;
        } else if ((code & 0xffffffff - (1 << 16) + 1) == 0) {
          i += 3;
        } else if ((code & 0xffffffff - (1 << 21) + 1) == 0) {
          i += 4;
        } else throw "e";
      }
      return i;
    }
  };
  UZIP.F = {};
  UZIP.F.deflateRaw = function (data, out, opos, lvl) {
    var opts = [[0, 0, 0, 0, 0], [4, 4, 8, 4, 0], [4, 5, 16, 8, 0], [4, 6, 16, 16, 0], [4, 10, 16, 32, 0], [8, 16, 32, 32, 0], [8, 16, 128, 128, 0], [8, 32, 128, 256, 0], [32, 128, 258, 1024, 1], [32, 258, 258, 4096, 1]];
    var opt = opts[lvl];
    var U = UZIP.F.U,
      goodIndex = UZIP.F._goodIndex;
      UZIP.F._hash;
      var putsE = UZIP.F._putsE;
    var i = 0,
      pos = opos << 3,
      cvrd = 0,
      dlen = data.length;
    if (lvl == 0) {
      while (i < dlen) {
        var len = Math.min(0xffff, dlen - i);
        putsE(out, pos, i + len == dlen ? 1 : 0);
        pos = UZIP.F._copyExact(data, i, len, out, pos + 8);
        i += len;
      }
      return pos >>> 3;
    }
    var lits = U.lits,
      strt = U.strt,
      prev = U.prev,
      li = 0,
      lc = 0,
      bs = 0,
      ebits = 0,
      c = 0,
      nc = 0;
    if (dlen > 2) {
      nc = UZIP.F._hash(data, 0);
      strt[nc] = 0;
    }
    for (i = 0; i < dlen; i++) {
      c = nc;
      if (i + 1 < dlen - 2) {
        nc = UZIP.F._hash(data, i + 1);
        var ii = i + 1 & 0x7fff;
        prev[ii] = strt[nc];
        strt[nc] = ii;
      }
      if (cvrd <= i) {
        if ((li > 14000 || lc > 26697) && dlen - i > 100) {
          if (cvrd < i) {
            lits[li] = i - cvrd;
            li += 2;
            cvrd = i;
          }
          pos = UZIP.F._writeBlock(i == dlen - 1 || cvrd == dlen ? 1 : 0, lits, li, ebits, data, bs, i - bs, out, pos);
          li = lc = ebits = 0;
          bs = i;
        }
        var mch = 0;
        if (i < dlen - 2) mch = UZIP.F._bestMatch(data, i, prev, c, Math.min(opt[2], dlen - i), opt[3]);
        var len = mch >>> 16,
          dst = mch & 0xffff;
        if (mch != 0) {
          var len = mch >>> 16,
            dst = mch & 0xffff;
          var lgi = goodIndex(len, U.of0);
          U.lhst[257 + lgi]++;
          var dgi = goodIndex(dst, U.df0);
          U.dhst[dgi]++;
          ebits += U.exb[lgi] + U.dxb[dgi];
          lits[li] = len << 23 | i - cvrd;
          lits[li + 1] = dst << 16 | lgi << 8 | dgi;
          li += 2;
          cvrd = i + len;
        } else {
          U.lhst[data[i]]++;
        }
        lc++;
      }
    }
    if (bs != i || data.length == 0) {
      if (cvrd < i) {
        lits[li] = i - cvrd;
        li += 2;
        cvrd = i;
      }
      pos = UZIP.F._writeBlock(1, lits, li, ebits, data, bs, i - bs, out, pos);
      li = 0;
      lc = 0;
      li = lc = ebits = 0;
      bs = i;
    }
    while ((pos & 7) != 0) pos++;
    return pos >>> 3;
  };
  UZIP.F._bestMatch = function (data, i, prev, c, nice, chain) {
    var ci = i & 0x7fff,
      pi = prev[ci];
    var dif = ci - pi + (1 << 15) & 0x7fff;
    if (pi == ci || c != UZIP.F._hash(data, i - dif)) return 0;
    var tl = 0,
      td = 0;
    var dlim = Math.min(0x7fff, i);
    while (dif <= dlim && --chain != 0 && pi != ci) {
      if (tl == 0 || data[i + tl] == data[i + tl - dif]) {
        var cl = UZIP.F._howLong(data, i, dif);
        if (cl > tl) {
          tl = cl;
          td = dif;
          if (tl >= nice) break;
          if (dif + 2 < cl) cl = dif + 2;
          var maxd = 0;
          for (var j = 0; j < cl - 2; j++) {
            var ei = i - dif + j + (1 << 15) & 0x7fff;
            var li = prev[ei];
            var curd = ei - li + (1 << 15) & 0x7fff;
            if (curd > maxd) {
              maxd = curd;
              pi = ei;
            }
          }
        }
      }
      ci = pi;
      pi = prev[ci];
      dif += ci - pi + (1 << 15) & 0x7fff;
    }
    return tl << 16 | td;
  };
  UZIP.F._howLong = function (data, i, dif) {
    if (data[i] != data[i - dif] || data[i + 1] != data[i + 1 - dif] || data[i + 2] != data[i + 2 - dif]) return 0;
    var oi = i,
      l = Math.min(data.length, i + 258);
    i += 3;
    while (i < l && data[i] == data[i - dif]) i++;
    return i - oi;
  };
  UZIP.F._hash = function (data, i) {
    return (data[i] << 8 | data[i + 1]) + (data[i + 2] << 4) & 0xffff;
  };
  UZIP.saved = 0;
  UZIP.F._writeBlock = function (BFINAL, lits, li, ebits, data, o0, l0, out, pos) {
    var U = UZIP.F.U,
      putsF = UZIP.F._putsF,
      putsE = UZIP.F._putsE;
    var T, ML, MD, MH, numl, numd, numh, lset, dset;
    U.lhst[256]++;
    T = UZIP.F.getTrees();
    ML = T[0];
    MD = T[1];
    MH = T[2];
    numl = T[3];
    numd = T[4];
    numh = T[5];
    lset = T[6];
    dset = T[7];
    var cstSize = ((pos + 3 & 7) == 0 ? 0 : 8 - (pos + 3 & 7)) + 32 + (l0 << 3);
    var fxdSize = ebits + UZIP.F.contSize(U.fltree, U.lhst) + UZIP.F.contSize(U.fdtree, U.dhst);
    var dynSize = ebits + UZIP.F.contSize(U.ltree, U.lhst) + UZIP.F.contSize(U.dtree, U.dhst);
    dynSize += 14 + 3 * numh + UZIP.F.contSize(U.itree, U.ihst) + (U.ihst[16] * 2 + U.ihst[17] * 3 + U.ihst[18] * 7);
    for (var j = 0; j < 286; j++) U.lhst[j] = 0;
    for (var j = 0; j < 30; j++) U.dhst[j] = 0;
    for (var j = 0; j < 19; j++) U.ihst[j] = 0;
    var BTYPE = cstSize < fxdSize && cstSize < dynSize ? 0 : fxdSize < dynSize ? 1 : 2;
    putsF(out, pos, BFINAL);
    putsF(out, pos + 1, BTYPE);
    pos += 3;
    if (BTYPE == 0) {
      while ((pos & 7) != 0) pos++;
      pos = UZIP.F._copyExact(data, o0, l0, out, pos);
    } else {
      var ltree, dtree;
      if (BTYPE == 1) {
        ltree = U.fltree;
        dtree = U.fdtree;
      }
      if (BTYPE == 2) {
        UZIP.F.makeCodes(U.ltree, ML);
        UZIP.F.revCodes(U.ltree, ML);
        UZIP.F.makeCodes(U.dtree, MD);
        UZIP.F.revCodes(U.dtree, MD);
        UZIP.F.makeCodes(U.itree, MH);
        UZIP.F.revCodes(U.itree, MH);
        ltree = U.ltree;
        dtree = U.dtree;
        putsE(out, pos, numl - 257);
        pos += 5;
        putsE(out, pos, numd - 1);
        pos += 5;
        putsE(out, pos, numh - 4);
        pos += 4;
        for (var i = 0; i < numh; i++) putsE(out, pos + i * 3, U.itree[(U.ordr[i] << 1) + 1]);
        pos += 3 * numh;
        pos = UZIP.F._codeTiny(lset, U.itree, out, pos);
        pos = UZIP.F._codeTiny(dset, U.itree, out, pos);
      }
      var off = o0;
      for (var si = 0; si < li; si += 2) {
        var qb = lits[si],
          len = qb >>> 23,
          end = off + (qb & (1 << 23) - 1);
        while (off < end) pos = UZIP.F._writeLit(data[off++], ltree, out, pos);
        if (len != 0) {
          var qc = lits[si + 1],
            dst = qc >> 16,
            lgi = qc >> 8 & 255,
            dgi = qc & 255;
          pos = UZIP.F._writeLit(257 + lgi, ltree, out, pos);
          putsE(out, pos, len - U.of0[lgi]);
          pos += U.exb[lgi];
          pos = UZIP.F._writeLit(dgi, dtree, out, pos);
          putsF(out, pos, dst - U.df0[dgi]);
          pos += U.dxb[dgi];
          off += len;
        }
      }
      pos = UZIP.F._writeLit(256, ltree, out, pos);
    }
    return pos;
  };
  UZIP.F._copyExact = function (data, off, len, out, pos) {
    var p8 = pos >>> 3;
    out[p8] = len;
    out[p8 + 1] = len >>> 8;
    out[p8 + 2] = 255 - out[p8];
    out[p8 + 3] = 255 - out[p8 + 1];
    p8 += 4;
    out.set(new Uint8Array(data.buffer, off, len), p8);
    return pos + (len + 4 << 3);
  };
  UZIP.F.getTrees = function () {
    var U = UZIP.F.U;
    var ML = UZIP.F._hufTree(U.lhst, U.ltree, 15);
    var MD = UZIP.F._hufTree(U.dhst, U.dtree, 15);
    var lset = [],
      numl = UZIP.F._lenCodes(U.ltree, lset);
    var dset = [],
      numd = UZIP.F._lenCodes(U.dtree, dset);
    for (var i = 0; i < lset.length; i += 2) U.ihst[lset[i]]++;
    for (var i = 0; i < dset.length; i += 2) U.ihst[dset[i]]++;
    var MH = UZIP.F._hufTree(U.ihst, U.itree, 7);
    var numh = 19;
    while (numh > 4 && U.itree[(U.ordr[numh - 1] << 1) + 1] == 0) numh--;
    return [ML, MD, MH, numl, numd, numh, lset, dset];
  };
  UZIP.F.getSecond = function (a) {
    var b = [];
    for (var i = 0; i < a.length; i += 2) b.push(a[i + 1]);
    return b;
  };
  UZIP.F.nonZero = function (a) {
    var b = "";
    for (var i = 0; i < a.length; i += 2) if (a[i + 1] != 0) b += (i >> 1) + ",";
    return b;
  };
  UZIP.F.contSize = function (tree, hst) {
    var s = 0;
    for (var i = 0; i < hst.length; i++) s += hst[i] * tree[(i << 1) + 1];
    return s;
  };
  UZIP.F._codeTiny = function (set, tree, out, pos) {
    for (var i = 0; i < set.length; i += 2) {
      var l = set[i],
        rst = set[i + 1];
      pos = UZIP.F._writeLit(l, tree, out, pos);
      var rsl = l == 16 ? 2 : l == 17 ? 3 : 7;
      if (l > 15) {
        UZIP.F._putsE(out, pos, rst, rsl);
        pos += rsl;
      }
    }
    return pos;
  };
  UZIP.F._lenCodes = function (tree, set) {
    var len = tree.length;
    while (len != 2 && tree[len - 1] == 0) len -= 2;
    for (var i = 0; i < len; i += 2) {
      var l = tree[i + 1],
        nxt = i + 3 < len ? tree[i + 3] : -1,
        nnxt = i + 5 < len ? tree[i + 5] : -1,
        prv = i == 0 ? -1 : tree[i - 1];
      if (l == 0 && nxt == l && nnxt == l) {
        var lz = i + 5;
        while (lz + 2 < len && tree[lz + 2] == l) lz += 2;
        var zc = Math.min(lz + 1 - i >>> 1, 138);
        if (zc < 11) set.push(17, zc - 3);else set.push(18, zc - 11);
        i += zc * 2 - 2;
      } else if (l == prv && nxt == l && nnxt == l) {
        var lz = i + 5;
        while (lz + 2 < len && tree[lz + 2] == l) lz += 2;
        var zc = Math.min(lz + 1 - i >>> 1, 6);
        set.push(16, zc - 3);
        i += zc * 2 - 2;
      } else set.push(l, 0);
    }
    return len >>> 1;
  };
  UZIP.F._hufTree = function (hst, tree, MAXL) {
    var list = [],
      hl = hst.length,
      tl = tree.length,
      i = 0;
    for (i = 0; i < tl; i += 2) {
      tree[i] = 0;
      tree[i + 1] = 0;
    }
    for (i = 0; i < hl; i++) if (hst[i] != 0) list.push({
      lit: i,
      f: hst[i]
    });
    var end = list.length,
      l2 = list.slice(0);
    if (end == 0) return 0;
    if (end == 1) {
      var lit = list[0].lit,
        l2 = lit == 0 ? 1 : 0;
      tree[(lit << 1) + 1] = 1;
      tree[(l2 << 1) + 1] = 1;
      return 1;
    }
    list.sort(function (a, b) {
      return a.f - b.f;
    });
    var a = list[0],
      b = list[1],
      i0 = 0,
      i1 = 1,
      i2 = 2;
    list[0] = {
      lit: -1,
      f: a.f + b.f,
      l: a,
      r: b,
      d: 0
    };
    while (i1 != end - 1) {
      if (i0 != i1 && (i2 == end || list[i0].f < list[i2].f)) {
        a = list[i0++];
      } else {
        a = list[i2++];
      }
      if (i0 != i1 && (i2 == end || list[i0].f < list[i2].f)) {
        b = list[i0++];
      } else {
        b = list[i2++];
      }
      list[i1++] = {
        lit: -1,
        f: a.f + b.f,
        l: a,
        r: b
      };
    }
    var maxl = UZIP.F.setDepth(list[i1 - 1], 0);
    if (maxl > MAXL) {
      UZIP.F.restrictDepth(l2, MAXL, maxl);
      maxl = MAXL;
    }
    for (i = 0; i < end; i++) tree[(l2[i].lit << 1) + 1] = l2[i].d;
    return maxl;
  };
  UZIP.F.setDepth = function (t, d) {
    if (t.lit != -1) {
      t.d = d;
      return d;
    }
    return Math.max(UZIP.F.setDepth(t.l, d + 1), UZIP.F.setDepth(t.r, d + 1));
  };
  UZIP.F.restrictDepth = function (dps, MD, maxl) {
    var i = 0,
      bCost = 1 << maxl - MD,
      dbt = 0;
    dps.sort(function (a, b) {
      return b.d == a.d ? a.f - b.f : b.d - a.d;
    });
    for (i = 0; i < dps.length; i++) if (dps[i].d > MD) {
      var od = dps[i].d;
      dps[i].d = MD;
      dbt += bCost - (1 << maxl - od);
    } else break;
    dbt = dbt >>> maxl - MD;
    while (dbt > 0) {
      var od = dps[i].d;
      if (od < MD) {
        dps[i].d++;
        dbt -= 1 << MD - od - 1;
      } else i++;
    }
    for (; i >= 0; i--) if (dps[i].d == MD && dbt < 0) {
      dps[i].d--;
      dbt++;
    }
    if (dbt != 0) console.log("debt left");
  };
  UZIP.F._goodIndex = function (v, arr) {
    var i = 0;
    if (arr[i | 16] <= v) i |= 16;
    if (arr[i | 8] <= v) i |= 8;
    if (arr[i | 4] <= v) i |= 4;
    if (arr[i | 2] <= v) i |= 2;
    if (arr[i | 1] <= v) i |= 1;
    return i;
  };
  UZIP.F._writeLit = function (ch, ltree, out, pos) {
    UZIP.F._putsF(out, pos, ltree[ch << 1]);
    return pos + ltree[(ch << 1) + 1];
  };
  UZIP.F.inflate = function (data, buf) {
    var u8 = Uint8Array;
    if (data[0] == 3 && data[1] == 0) return buf ? buf : new u8(0);
    var F = UZIP.F,
      bitsF = F._bitsF,
      bitsE = F._bitsE,
      decodeTiny = F._decodeTiny,
      makeCodes = F.makeCodes,
      codes2map = F.codes2map,
      get17 = F._get17;
    var U = F.U;
    var noBuf = buf == null;
    if (noBuf) buf = new u8(data.length >>> 2 << 3);
    var BFINAL = 0,
      BTYPE = 0,
      HLIT = 0,
      HDIST = 0,
      HCLEN = 0,
      ML = 0,
      MD = 0;
    var off = 0,
      pos = 0;
    var lmap, dmap;
    while (BFINAL == 0) {
      BFINAL = bitsF(data, pos, 1);
      BTYPE = bitsF(data, pos + 1, 2);
      pos += 3;
      if (BTYPE == 0) {
        if ((pos & 7) != 0) pos += 8 - (pos & 7);
        var p8 = (pos >>> 3) + 4,
          len = data[p8 - 4] | data[p8 - 3] << 8;
        if (noBuf) buf = UZIP.F._check(buf, off + len);
        buf.set(new u8(data.buffer, data.byteOffset + p8, len), off);
        pos = p8 + len << 3;
        off += len;
        continue;
      }
      if (noBuf) buf = UZIP.F._check(buf, off + (1 << 17));
      if (BTYPE == 1) {
        lmap = U.flmap;
        dmap = U.fdmap;
        ML = (1 << 9) - 1;
        MD = (1 << 5) - 1;
      }
      if (BTYPE == 2) {
        HLIT = bitsE(data, pos, 5) + 257;
        HDIST = bitsE(data, pos + 5, 5) + 1;
        HCLEN = bitsE(data, pos + 10, 4) + 4;
        pos += 14;
        for (var i = 0; i < 38; i += 2) {
          U.itree[i] = 0;
          U.itree[i + 1] = 0;
        }
        var tl = 1;
        for (var i = 0; i < HCLEN; i++) {
          var l = bitsE(data, pos + i * 3, 3);
          U.itree[(U.ordr[i] << 1) + 1] = l;
          if (l > tl) tl = l;
        }
        pos += 3 * HCLEN;
        makeCodes(U.itree, tl);
        codes2map(U.itree, tl, U.imap);
        lmap = U.lmap;
        dmap = U.dmap;
        pos = decodeTiny(U.imap, (1 << tl) - 1, HLIT + HDIST, data, pos, U.ttree);
        var mx0 = F._copyOut(U.ttree, 0, HLIT, U.ltree);
        ML = (1 << mx0) - 1;
        var mx1 = F._copyOut(U.ttree, HLIT, HDIST, U.dtree);
        MD = (1 << mx1) - 1;
        makeCodes(U.ltree, mx0);
        codes2map(U.ltree, mx0, lmap);
        makeCodes(U.dtree, mx1);
        codes2map(U.dtree, mx1, dmap);
      }
      while (true) {
        var code = lmap[get17(data, pos) & ML];
        pos += code & 15;
        var lit = code >>> 4;
        if (lit >>> 8 == 0) {
          buf[off++] = lit;
        } else if (lit == 256) {
          break;
        } else {
          var end = off + lit - 254;
          if (lit > 264) {
            var ebs = U.ldef[lit - 257];
            end = off + (ebs >>> 3) + bitsE(data, pos, ebs & 7);
            pos += ebs & 7;
          }
          var dcode = dmap[get17(data, pos) & MD];
          pos += dcode & 15;
          var dlit = dcode >>> 4;
          var dbs = U.ddef[dlit],
            dst = (dbs >>> 4) + bitsF(data, pos, dbs & 15);
          pos += dbs & 15;
          if (noBuf) buf = UZIP.F._check(buf, off + (1 << 17));
          while (off < end) {
            buf[off] = buf[off++ - dst];
            buf[off] = buf[off++ - dst];
            buf[off] = buf[off++ - dst];
            buf[off] = buf[off++ - dst];
          }
          off = end;
        }
      }
    }
    return buf.length == off ? buf : buf.slice(0, off);
  };
  UZIP.F._check = function (buf, len) {
    var bl = buf.length;
    if (len <= bl) return buf;
    var nbuf = new Uint8Array(Math.max(bl << 1, len));
    nbuf.set(buf, 0);
    return nbuf;
  };
  UZIP.F._decodeTiny = function (lmap, LL, len, data, pos, tree) {
    var bitsE = UZIP.F._bitsE,
      get17 = UZIP.F._get17;
    var i = 0;
    while (i < len) {
      var code = lmap[get17(data, pos) & LL];
      pos += code & 15;
      var lit = code >>> 4;
      if (lit <= 15) {
        tree[i] = lit;
        i++;
      } else {
        var ll = 0,
          n = 0;
        if (lit == 16) {
          n = 3 + bitsE(data, pos, 2);
          pos += 2;
          ll = tree[i - 1];
        } else if (lit == 17) {
          n = 3 + bitsE(data, pos, 3);
          pos += 3;
        } else if (lit == 18) {
          n = 11 + bitsE(data, pos, 7);
          pos += 7;
        }
        var ni = i + n;
        while (i < ni) {
          tree[i] = ll;
          i++;
        }
      }
    }
    return pos;
  };
  UZIP.F._copyOut = function (src, off, len, tree) {
    var mx = 0,
      i = 0,
      tl = tree.length >>> 1;
    while (i < len) {
      var v = src[i + off];
      tree[i << 1] = 0;
      tree[(i << 1) + 1] = v;
      if (v > mx) mx = v;
      i++;
    }
    while (i < tl) {
      tree[i << 1] = 0;
      tree[(i << 1) + 1] = 0;
      i++;
    }
    return mx;
  };
  UZIP.F.makeCodes = function (tree, MAX_BITS) {
    var U = UZIP.F.U;
    var max_code = tree.length;
    var code, bits, n, i, len;
    var bl_count = U.bl_count;
    for (var i = 0; i <= MAX_BITS; i++) bl_count[i] = 0;
    for (i = 1; i < max_code; i += 2) bl_count[tree[i]]++;
    var next_code = U.next_code;
    code = 0;
    bl_count[0] = 0;
    for (bits = 1; bits <= MAX_BITS; bits++) {
      code = code + bl_count[bits - 1] << 1;
      next_code[bits] = code;
    }
    for (n = 0; n < max_code; n += 2) {
      len = tree[n + 1];
      if (len != 0) {
        tree[n] = next_code[len];
        next_code[len]++;
      }
    }
  };
  UZIP.F.codes2map = function (tree, MAX_BITS, map) {
    var max_code = tree.length;
    var U = UZIP.F.U,
      r15 = U.rev15;
    for (var i = 0; i < max_code; i += 2) if (tree[i + 1] != 0) {
      var lit = i >> 1;
      var cl = tree[i + 1],
        val = lit << 4 | cl;
      var rest = MAX_BITS - cl,
        i0 = tree[i] << rest,
        i1 = i0 + (1 << rest);
      while (i0 != i1) {
        var p0 = r15[i0] >>> 15 - MAX_BITS;
        map[p0] = val;
        i0++;
      }
    }
  };
  UZIP.F.revCodes = function (tree, MAX_BITS) {
    var r15 = UZIP.F.U.rev15,
      imb = 15 - MAX_BITS;
    for (var i = 0; i < tree.length; i += 2) {
      var i0 = tree[i] << MAX_BITS - tree[i + 1];
      tree[i] = r15[i0] >>> imb;
    }
  };
  UZIP.F._putsE = function (dt, pos, val) {
    val = val << (pos & 7);
    var o = pos >>> 3;
    dt[o] |= val;
    dt[o + 1] |= val >>> 8;
  };
  UZIP.F._putsF = function (dt, pos, val) {
    val = val << (pos & 7);
    var o = pos >>> 3;
    dt[o] |= val;
    dt[o + 1] |= val >>> 8;
    dt[o + 2] |= val >>> 16;
  };
  UZIP.F._bitsE = function (dt, pos, length) {
    return (dt[pos >>> 3] | dt[(pos >>> 3) + 1] << 8) >>> (pos & 7) & (1 << length) - 1;
  };
  UZIP.F._bitsF = function (dt, pos, length) {
    return (dt[pos >>> 3] | dt[(pos >>> 3) + 1] << 8 | dt[(pos >>> 3) + 2] << 16) >>> (pos & 7) & (1 << length) - 1;
  };
  UZIP.F._get17 = function (dt, pos) {
    return (dt[pos >>> 3] | dt[(pos >>> 3) + 1] << 8 | dt[(pos >>> 3) + 2] << 16) >>> (pos & 7);
  };
  UZIP.F._get25 = function (dt, pos) {
    return (dt[pos >>> 3] | dt[(pos >>> 3) + 1] << 8 | dt[(pos >>> 3) + 2] << 16 | dt[(pos >>> 3) + 3] << 24) >>> (pos & 7);
  };
  UZIP.F.U = function () {
    var u16 = Uint16Array,
      u32 = Uint32Array;
    return {
      next_code: new u16(16),
      bl_count: new u16(16),
      ordr: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
      of0: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 999, 999, 999],
      exb: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0],
      ldef: new u16(32),
      df0: [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 65535, 65535],
      dxb: [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0],
      ddef: new u32(32),
      flmap: new u16(512),
      fltree: [],
      fdmap: new u16(32),
      fdtree: [],
      lmap: new u16(32768),
      ltree: [],
      ttree: [],
      dmap: new u16(32768),
      dtree: [],
      imap: new u16(512),
      itree: [],
      rev15: new u16(1 << 15),
      lhst: new u32(286),
      dhst: new u32(30),
      ihst: new u32(19),
      lits: new u32(15000),
      strt: new u16(1 << 16),
      prev: new u16(1 << 15)
    };
  }();
  (function () {
    var U = UZIP.F.U;
    var len = 1 << 15;
    for (var i = 0; i < len; i++) {
      var x = i;
      x = (x & 0xaaaaaaaa) >>> 1 | (x & 0x55555555) << 1;
      x = (x & 0xcccccccc) >>> 2 | (x & 0x33333333) << 2;
      x = (x & 0xf0f0f0f0) >>> 4 | (x & 0x0f0f0f0f) << 4;
      x = (x & 0xff00ff00) >>> 8 | (x & 0x00ff00ff) << 8;
      U.rev15[i] = (x >>> 16 | x << 16) >>> 17;
    }
    function pushV(tgt, n, sv) {
      while (n-- != 0) tgt.push(0, sv);
    }
    for (var i = 0; i < 32; i++) {
      U.ldef[i] = U.of0[i] << 3 | U.exb[i];
      U.ddef[i] = U.df0[i] << 4 | U.dxb[i];
    }
    pushV(U.fltree, 144, 8);
    pushV(U.fltree, 255 - 143, 9);
    pushV(U.fltree, 279 - 255, 7);
    pushV(U.fltree, 287 - 279, 8);
    UZIP.F.makeCodes(U.fltree, 9);
    UZIP.F.codes2map(U.fltree, 9, U.flmap);
    UZIP.F.revCodes(U.fltree, 9);
    pushV(U.fdtree, 32, 5);
    UZIP.F.makeCodes(U.fdtree, 5);
    UZIP.F.codes2map(U.fdtree, 5, U.fdmap);
    UZIP.F.revCodes(U.fdtree, 5);
    pushV(U.itree, 19, 0);
    pushV(U.ltree, 286, 0);
    pushV(U.dtree, 30, 0);
    pushV(U.ttree, 320, 0);
  })();
})(UZIP$1);
var UZIP_1 = UZIPExports;

var UZIP = /*#__PURE__*/_mergeNamespaces({
  __proto__: null,
  default: UZIP_1
}, [UZIPExports]);

const UPNG = function () {
  var _bin = {
    nextZero(data, p) {
      while (data[p] != 0) p++;
      return p;
    },
    readUshort(buff, p) {
      return buff[p] << 8 | buff[p + 1];
    },
    writeUshort(buff, p, n) {
      buff[p] = n >> 8 & 255;
      buff[p + 1] = n & 255;
    },
    readUint(buff, p) {
      return buff[p] * (256 * 256 * 256) + (buff[p + 1] << 16 | buff[p + 2] << 8 | buff[p + 3]);
    },
    writeUint(buff, p, n) {
      buff[p] = n >> 24 & 255;
      buff[p + 1] = n >> 16 & 255;
      buff[p + 2] = n >> 8 & 255;
      buff[p + 3] = n & 255;
    },
    readASCII(buff, p, l) {
      let s = '';
      for (let i = 0; i < l; i++) s += String.fromCharCode(buff[p + i]);
      return s;
    },
    writeASCII(data, p, s) {
      for (let i = 0; i < s.length; i++) data[p + i] = s.charCodeAt(i);
    },
    readBytes(buff, p, l) {
      const arr = [];
      for (let i = 0; i < l; i++) arr.push(buff[p + i]);
      return arr;
    },
    pad(n) {
      return n.length < 2 ? `0${n}` : n;
    },
    readUTF8(buff, p, l) {
      let s = '';
      let ns;
      for (let i = 0; i < l; i++) s += `%${_bin.pad(buff[p + i].toString(16))}`;
      try {
        ns = decodeURIComponent(s);
      } catch (e) {
        return _bin.readASCII(buff, p, l);
      }
      return ns;
    }
  };
  function toRGBA8(out) {
    const w = out.width;
    const h = out.height;
    if (out.tabs.acTL == null) return [decodeImage(out.data, w, h, out).buffer];
    const frms = [];
    if (out.frames[0].data == null) out.frames[0].data = out.data;
    const len = w * h * 4;
    const img = new Uint8Array(len);
    const empty = new Uint8Array(len);
    const prev = new Uint8Array(len);
    for (let i = 0; i < out.frames.length; i++) {
      const frm = out.frames[i];
      const fx = frm.rect.x;
      const fy = frm.rect.y;
      const fw = frm.rect.width;
      const fh = frm.rect.height;
      const fdata = decodeImage(frm.data, fw, fh, out);
      if (i != 0) for (var j = 0; j < len; j++) prev[j] = img[j];
      if (frm.blend == 0) _copyTile(fdata, fw, fh, img, w, h, fx, fy, 0);else if (frm.blend == 1) _copyTile(fdata, fw, fh, img, w, h, fx, fy, 1);
      frms.push(img.buffer.slice(0));
      if (frm.dispose == 0) ; else if (frm.dispose == 1) _copyTile(empty, fw, fh, img, w, h, fx, fy, 0);else if (frm.dispose == 2) for (var j = 0; j < len; j++) img[j] = prev[j];
    }
    return frms;
  }
  function decodeImage(data, w, h, out) {
    const area = w * h;
    const bpp = _getBPP(out);
    const bpl = Math.ceil(w * bpp / 8);
    const bf = new Uint8Array(area * 4);
    const bf32 = new Uint32Array(bf.buffer);
    const {
      ctype
    } = out;
    const {
      depth
    } = out;
    const rs = _bin.readUshort;
    if (ctype == 6) {
      const qarea = area << 2;
      if (depth == 8) for (var i = 0; i < qarea; i += 4) {
        bf[i] = data[i];
        bf[i + 1] = data[i + 1];
        bf[i + 2] = data[i + 2];
        bf[i + 3] = data[i + 3];
      }
      if (depth == 16) for (var i = 0; i < qarea; i++) {
        bf[i] = data[i << 1];
      }
    } else if (ctype == 2) {
      const ts = out.tabs.tRNS;
      if (ts == null) {
        if (depth == 8) for (var i = 0; i < area; i++) {
          var ti = i * 3;
          bf32[i] = 255 << 24 | data[ti + 2] << 16 | data[ti + 1] << 8 | data[ti];
        }
        if (depth == 16) for (var i = 0; i < area; i++) {
          var ti = i * 6;
          bf32[i] = 255 << 24 | data[ti + 4] << 16 | data[ti + 2] << 8 | data[ti];
        }
      } else {
        var tr = ts[0];
        const tg = ts[1];
        const tb = ts[2];
        if (depth == 8) {
          for (var i = 0; i < area; i++) {
            var qi = i << 2;
            var ti = i * 3;
            bf32[i] = 255 << 24 | data[ti + 2] << 16 | data[ti + 1] << 8 | data[ti];
            if (data[ti] == tr && data[ti + 1] == tg && data[ti + 2] == tb) bf[qi + 3] = 0;
          }
        }
        if (depth == 16) {
          for (var i = 0; i < area; i++) {
            var qi = i << 2;
            var ti = i * 6;
            bf32[i] = 255 << 24 | data[ti + 4] << 16 | data[ti + 2] << 8 | data[ti];
            if (rs(data, ti) == tr && rs(data, ti + 2) == tg && rs(data, ti + 4) == tb) bf[qi + 3] = 0;
          }
        }
      }
    } else if (ctype == 3) {
      const p = out.tabs.PLTE;
      const ap = out.tabs.tRNS;
      const tl = ap ? ap.length : 0;
      if (depth == 1) {
        for (var y = 0; y < h; y++) {
          var s0 = y * bpl;
          var t0 = y * w;
          for (var i = 0; i < w; i++) {
            var qi = t0 + i << 2;
            var j = data[s0 + (i >> 3)] >> 7 - ((i & 7) << 0) & 1;
            var cj = 3 * j;
            bf[qi] = p[cj];
            bf[qi + 1] = p[cj + 1];
            bf[qi + 2] = p[cj + 2];
            bf[qi + 3] = j < tl ? ap[j] : 255;
          }
        }
      }
      if (depth == 2) {
        for (var y = 0; y < h; y++) {
          var s0 = y * bpl;
          var t0 = y * w;
          for (var i = 0; i < w; i++) {
            var qi = t0 + i << 2;
            var j = data[s0 + (i >> 2)] >> 6 - ((i & 3) << 1) & 3;
            var cj = 3 * j;
            bf[qi] = p[cj];
            bf[qi + 1] = p[cj + 1];
            bf[qi + 2] = p[cj + 2];
            bf[qi + 3] = j < tl ? ap[j] : 255;
          }
        }
      }
      if (depth == 4) {
        for (var y = 0; y < h; y++) {
          var s0 = y * bpl;
          var t0 = y * w;
          for (var i = 0; i < w; i++) {
            var qi = t0 + i << 2;
            var j = data[s0 + (i >> 1)] >> 4 - ((i & 1) << 2) & 15;
            var cj = 3 * j;
            bf[qi] = p[cj];
            bf[qi + 1] = p[cj + 1];
            bf[qi + 2] = p[cj + 2];
            bf[qi + 3] = j < tl ? ap[j] : 255;
          }
        }
      }
      if (depth == 8) {
        for (var i = 0; i < area; i++) {
          var qi = i << 2;
          var j = data[i];
          var cj = 3 * j;
          bf[qi] = p[cj];
          bf[qi + 1] = p[cj + 1];
          bf[qi + 2] = p[cj + 2];
          bf[qi + 3] = j < tl ? ap[j] : 255;
        }
      }
    } else if (ctype == 4) {
      if (depth == 8) {
        for (var i = 0; i < area; i++) {
          var qi = i << 2;
          var di = i << 1;
          var gr = data[di];
          bf[qi] = gr;
          bf[qi + 1] = gr;
          bf[qi + 2] = gr;
          bf[qi + 3] = data[di + 1];
        }
      }
      if (depth == 16) {
        for (var i = 0; i < area; i++) {
          var qi = i << 2;
          var di = i << 2;
          var gr = data[di];
          bf[qi] = gr;
          bf[qi + 1] = gr;
          bf[qi + 2] = gr;
          bf[qi + 3] = data[di + 2];
        }
      }
    } else if (ctype == 0) {
      var tr = out.tabs.tRNS ? out.tabs.tRNS : -1;
      for (var y = 0; y < h; y++) {
        const off = y * bpl;
        const to = y * w;
        if (depth == 1) {
          for (var x = 0; x < w; x++) {
            var gr = 255 * (data[off + (x >>> 3)] >>> 7 - (x & 7) & 1);
            var al = gr == tr * 255 ? 0 : 255;
            bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
          }
        } else if (depth == 2) {
          for (var x = 0; x < w; x++) {
            var gr = 85 * (data[off + (x >>> 2)] >>> 6 - ((x & 3) << 1) & 3);
            var al = gr == tr * 85 ? 0 : 255;
            bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
          }
        } else if (depth == 4) {
          for (var x = 0; x < w; x++) {
            var gr = 17 * (data[off + (x >>> 1)] >>> 4 - ((x & 1) << 2) & 15);
            var al = gr == tr * 17 ? 0 : 255;
            bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
          }
        } else if (depth == 8) {
          for (var x = 0; x < w; x++) {
            var gr = data[off + x];
            var al = gr == tr ? 0 : 255;
            bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
          }
        } else if (depth == 16) {
          for (var x = 0; x < w; x++) {
            var gr = data[off + (x << 1)];
            var al = rs(data, off + (x << 1)) == tr ? 0 : 255;
            bf32[to + x] = al << 24 | gr << 16 | gr << 8 | gr;
          }
        }
      }
    }
    return bf;
  }
  function decode(buff) {
    const data = new Uint8Array(buff);
    let offset = 8;
    const bin = _bin;
    const rUs = bin.readUshort;
    const rUi = bin.readUint;
    const out = {
      tabs: {},
      frames: []
    };
    const dd = new Uint8Array(data.length);
    let doff = 0;
    let fd;
    let foff = 0;
    const mgck = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (var i = 0; i < 8; i++) if (data[i] != mgck[i]) throw 'The input is not a PNG file!';
    while (offset < data.length) {
      const len = bin.readUint(data, offset);
      offset += 4;
      const type = bin.readASCII(data, offset, 4);
      offset += 4;
      if (type == 'IHDR') {
        _IHDR(data, offset, out);
      } else if (type == 'iCCP') {
        var off = offset;
        while (data[off] != 0) off++;
        bin.readASCII(data, offset, off - offset);
        data[off + 1];
        const fil = data.slice(off + 2, offset + len);
        let res = null;
        try {
          res = _inflate(fil);
        } catch (e) {
          res = inflateRaw(fil);
        }
        out.tabs[type] = res;
      } else if (type == 'CgBI') {
        out.tabs[type] = data.slice(offset, offset + 4);
      } else if (type == 'IDAT') {
        for (var i = 0; i < len; i++) dd[doff + i] = data[offset + i];
        doff += len;
      } else if (type == 'acTL') {
        out.tabs[type] = {
          num_frames: rUi(data, offset),
          num_plays: rUi(data, offset + 4)
        };
        fd = new Uint8Array(data.length);
      } else if (type == 'fcTL') {
        if (foff != 0) {
          var fr = out.frames[out.frames.length - 1];
          fr.data = _decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
          foff = 0;
        }
        const rct = {
          x: rUi(data, offset + 12),
          y: rUi(data, offset + 16),
          width: rUi(data, offset + 4),
          height: rUi(data, offset + 8)
        };
        let del = rUs(data, offset + 22);
        del = rUs(data, offset + 20) / (del == 0 ? 100 : del);
        const frm = {
          rect: rct,
          delay: Math.round(del * 1000),
          dispose: data[offset + 24],
          blend: data[offset + 25]
        };
        out.frames.push(frm);
      } else if (type == 'fdAT') {
        for (var i = 0; i < len - 4; i++) fd[foff + i] = data[offset + i + 4];
        foff += len - 4;
      } else if (type == 'pHYs') {
        out.tabs[type] = [bin.readUint(data, offset), bin.readUint(data, offset + 4), data[offset + 8]];
      } else if (type == 'cHRM') {
        out.tabs[type] = [];
        for (var i = 0; i < 8; i++) out.tabs[type].push(bin.readUint(data, offset + i * 4));
      } else if (type == 'tEXt' || type == 'zTXt') {
        if (out.tabs[type] == null) out.tabs[type] = {};
        var nz = bin.nextZero(data, offset);
        var keyw = bin.readASCII(data, offset, nz - offset);
        var text;
        var tl = offset + len - nz - 1;
        if (type == 'tEXt') text = bin.readASCII(data, nz + 1, tl);else {
          var bfr = _inflate(data.slice(nz + 2, nz + 2 + tl));
          text = bin.readUTF8(bfr, 0, bfr.length);
        }
        out.tabs[type][keyw] = text;
      } else if (type == 'iTXt') {
        if (out.tabs[type] == null) out.tabs[type] = {};
        var nz = 0;
        var off = offset;
        nz = bin.nextZero(data, off);
        var keyw = bin.readASCII(data, off, nz - off);
        off = nz + 1;
        const cflag = data[off];
        data[off + 1];
        off += 2;
        nz = bin.nextZero(data, off);
        bin.readASCII(data, off, nz - off);
        off = nz + 1;
        nz = bin.nextZero(data, off);
        bin.readUTF8(data, off, nz - off);
        off = nz + 1;
        var text;
        var tl = len - (off - offset);
        if (cflag == 0) text = bin.readUTF8(data, off, tl);else {
          var bfr = _inflate(data.slice(off, off + tl));
          text = bin.readUTF8(bfr, 0, bfr.length);
        }
        out.tabs[type][keyw] = text;
      } else if (type == 'PLTE') {
        out.tabs[type] = bin.readBytes(data, offset, len);
      } else if (type == 'hIST') {
        const pl = out.tabs.PLTE.length / 3;
        out.tabs[type] = [];
        for (var i = 0; i < pl; i++) out.tabs[type].push(rUs(data, offset + i * 2));
      } else if (type == 'tRNS') {
        if (out.ctype == 3) out.tabs[type] = bin.readBytes(data, offset, len);else if (out.ctype == 0) out.tabs[type] = rUs(data, offset);else if (out.ctype == 2) out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];
      } else if (type == 'gAMA') out.tabs[type] = bin.readUint(data, offset) / 100000;else if (type == 'sRGB') out.tabs[type] = data[offset];else if (type == 'bKGD') {
        if (out.ctype == 0 || out.ctype == 4) out.tabs[type] = [rUs(data, offset)];else if (out.ctype == 2 || out.ctype == 6) out.tabs[type] = [rUs(data, offset), rUs(data, offset + 2), rUs(data, offset + 4)];else if (out.ctype == 3) out.tabs[type] = data[offset];
      } else if (type == 'IEND') {
        break;
      }
      offset += len;
      bin.readUint(data, offset);
      offset += 4;
    }
    if (foff != 0) {
      var fr = out.frames[out.frames.length - 1];
      fr.data = _decompress(out, fd.slice(0, foff), fr.rect.width, fr.rect.height);
    }
    out.data = _decompress(out, dd, out.width, out.height);
    delete out.compress;
    delete out.interlace;
    delete out.filter;
    return out;
  }
  function _decompress(out, dd, w, h) {
    const bpp = _getBPP(out);
    const bpl = Math.ceil(w * bpp / 8);
    const buff = new Uint8Array((bpl + 1 + out.interlace) * h);
    if (out.tabs.CgBI) dd = inflateRaw(dd, buff);else dd = _inflate(dd, buff);
    if (out.interlace == 0) dd = _filterZero(dd, out, 0, w, h);else if (out.interlace == 1) dd = _readInterlace(dd, out);
    return dd;
  }
  function _inflate(data, buff) {
    const out = inflateRaw(new Uint8Array(data.buffer, 2, data.length - 6), buff);
    return out;
  }
  var inflateRaw = function () {
    const H = {};
    H.H = {};
    H.H.N = function (N, W) {
      const R = Uint8Array;
      let i = 0;
      let m = 0;
      let J = 0;
      let h = 0;
      let Q = 0;
      let X = 0;
      let u = 0;
      let w = 0;
      let d = 0;
      let v;
      let C;
      if (N[0] == 3 && N[1] == 0) return W || new R(0);
      const V = H.H;
      const n = V.b;
      const A = V.e;
      const l = V.R;
      const M = V.n;
      const I = V.A;
      const e = V.Z;
      const b = V.m;
      const Z = W == null;
      if (Z) W = new R(N.length >>> 2 << 5);
      while (i == 0) {
        i = n(N, d, 1);
        m = n(N, d + 1, 2);
        d += 3;
        if (m == 0) {
          if ((d & 7) != 0) d += 8 - (d & 7);
          const D = (d >>> 3) + 4;
          const q = N[D - 4] | N[D - 3] << 8;
          if (Z) W = H.H.W(W, w + q);
          W.set(new R(N.buffer, N.byteOffset + D, q), w);
          d = D + q << 3;
          w += q;
          continue;
        }
        if (Z) W = H.H.W(W, w + (1 << 17));
        if (m == 1) {
          v = b.J;
          C = b.h;
          X = (1 << 9) - 1;
          u = (1 << 5) - 1;
        }
        if (m == 2) {
          J = A(N, d, 5) + 257;
          h = A(N, d + 5, 5) + 1;
          Q = A(N, d + 10, 4) + 4;
          d += 14;
          let j = 1;
          for (var c = 0; c < 38; c += 2) {
            b.Q[c] = 0;
            b.Q[c + 1] = 0;
          }
          for (var c = 0; c < Q; c++) {
            const K = A(N, d + c * 3, 3);
            b.Q[(b.X[c] << 1) + 1] = K;
            if (K > j) j = K;
          }
          d += 3 * Q;
          M(b.Q, j);
          I(b.Q, j, b.u);
          v = b.w;
          C = b.d;
          d = l(b.u, (1 << j) - 1, J + h, N, d, b.v);
          const r = V.V(b.v, 0, J, b.C);
          X = (1 << r) - 1;
          const S = V.V(b.v, J, h, b.D);
          u = (1 << S) - 1;
          M(b.C, r);
          I(b.C, r, v);
          M(b.D, S);
          I(b.D, S, C);
        }
        while (!0) {
          const T = v[e(N, d) & X];
          d += T & 15;
          const p = T >>> 4;
          if (p >>> 8 == 0) {
            W[w++] = p;
          } else if (p == 256) {
            break;
          } else {
            let z = w + p - 254;
            if (p > 264) {
              const _ = b.q[p - 257];
              z = w + (_ >>> 3) + A(N, d, _ & 7);
              d += _ & 7;
            }
            const $ = C[e(N, d) & u];
            d += $ & 15;
            const s = $ >>> 4;
            const Y = b.c[s];
            const a = (Y >>> 4) + n(N, d, Y & 15);
            d += Y & 15;
            while (w < z) {
              W[w] = W[w++ - a];
              W[w] = W[w++ - a];
              W[w] = W[w++ - a];
              W[w] = W[w++ - a];
            }
            w = z;
          }
        }
      }
      return W.length == w ? W : W.slice(0, w);
    };
    H.H.W = function (N, W) {
      const R = N.length;
      if (W <= R) return N;
      const V = new Uint8Array(R << 1);
      V.set(N, 0);
      return V;
    };
    H.H.R = function (N, W, R, V, n, A) {
      const l = H.H.e;
      const M = H.H.Z;
      let I = 0;
      while (I < R) {
        const e = N[M(V, n) & W];
        n += e & 15;
        const b = e >>> 4;
        if (b <= 15) {
          A[I] = b;
          I++;
        } else {
          let Z = 0;
          let m = 0;
          if (b == 16) {
            m = 3 + l(V, n, 2);
            n += 2;
            Z = A[I - 1];
          } else if (b == 17) {
            m = 3 + l(V, n, 3);
            n += 3;
          } else if (b == 18) {
            m = 11 + l(V, n, 7);
            n += 7;
          }
          const J = I + m;
          while (I < J) {
            A[I] = Z;
            I++;
          }
        }
      }
      return n;
    };
    H.H.V = function (N, W, R, V) {
      let n = 0;
      let A = 0;
      const l = V.length >>> 1;
      while (A < R) {
        const M = N[A + W];
        V[A << 1] = 0;
        V[(A << 1) + 1] = M;
        if (M > n) n = M;
        A++;
      }
      while (A < l) {
        V[A << 1] = 0;
        V[(A << 1) + 1] = 0;
        A++;
      }
      return n;
    };
    H.H.n = function (N, W) {
      const R = H.H.m;
      const V = N.length;
      let n;
      let A;
      let l;
      var M;
      let I;
      const e = R.j;
      for (var M = 0; M <= W; M++) e[M] = 0;
      for (M = 1; M < V; M += 2) e[N[M]]++;
      const b = R.K;
      n = 0;
      e[0] = 0;
      for (A = 1; A <= W; A++) {
        n = n + e[A - 1] << 1;
        b[A] = n;
      }
      for (l = 0; l < V; l += 2) {
        I = N[l + 1];
        if (I != 0) {
          N[l] = b[I];
          b[I]++;
        }
      }
    };
    H.H.A = function (N, W, R) {
      const V = N.length;
      const n = H.H.m;
      const A = n.r;
      for (let l = 0; l < V; l += 2) {
        if (N[l + 1] != 0) {
          const M = l >> 1;
          const I = N[l + 1];
          const e = M << 4 | I;
          const b = W - I;
          let Z = N[l] << b;
          const m = Z + (1 << b);
          while (Z != m) {
            const J = A[Z] >>> 15 - W;
            R[J] = e;
            Z++;
          }
        }
      }
    };
    H.H.l = function (N, W) {
      const R = H.H.m.r;
      const V = 15 - W;
      for (let n = 0; n < N.length; n += 2) {
        const A = N[n] << W - N[n + 1];
        N[n] = R[A] >>> V;
      }
    };
    H.H.M = function (N, W, R) {
      R <<= W & 7;
      const V = W >>> 3;
      N[V] |= R;
      N[V + 1] |= R >>> 8;
    };
    H.H.I = function (N, W, R) {
      R <<= W & 7;
      const V = W >>> 3;
      N[V] |= R;
      N[V + 1] |= R >>> 8;
      N[V + 2] |= R >>> 16;
    };
    H.H.e = function (N, W, R) {
      return (N[W >>> 3] | N[(W >>> 3) + 1] << 8) >>> (W & 7) & (1 << R) - 1;
    };
    H.H.b = function (N, W, R) {
      return (N[W >>> 3] | N[(W >>> 3) + 1] << 8 | N[(W >>> 3) + 2] << 16) >>> (W & 7) & (1 << R) - 1;
    };
    H.H.Z = function (N, W) {
      return (N[W >>> 3] | N[(W >>> 3) + 1] << 8 | N[(W >>> 3) + 2] << 16) >>> (W & 7);
    };
    H.H.i = function (N, W) {
      return (N[W >>> 3] | N[(W >>> 3) + 1] << 8 | N[(W >>> 3) + 2] << 16 | N[(W >>> 3) + 3] << 24) >>> (W & 7);
    };
    H.H.m = function () {
      const N = Uint16Array;
      const W = Uint32Array;
      return {
        K: new N(16),
        j: new N(16),
        X: [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15],
        S: [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258, 999, 999, 999],
        T: [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0, 0, 0, 0],
        q: new N(32),
        p: [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577, 65535, 65535],
        z: [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13, 0, 0],
        c: new W(32),
        J: new N(512),
        _: [],
        h: new N(32),
        $: [],
        w: new N(32768),
        C: [],
        v: [],
        d: new N(32768),
        D: [],
        u: new N(512),
        Q: [],
        r: new N(1 << 15),
        s: new W(286),
        Y: new W(30),
        a: new W(19),
        t: new W(15e3),
        k: new N(1 << 16),
        g: new N(1 << 15)
      };
    }();
    (function () {
      const N = H.H.m;
      const W = 1 << 15;
      for (var R = 0; R < W; R++) {
        let V = R;
        V = (V & 2863311530) >>> 1 | (V & 1431655765) << 1;
        V = (V & 3435973836) >>> 2 | (V & 858993459) << 2;
        V = (V & 4042322160) >>> 4 | (V & 252645135) << 4;
        V = (V & 4278255360) >>> 8 | (V & 16711935) << 8;
        N.r[R] = (V >>> 16 | V << 16) >>> 17;
      }
      function n(A, l, M) {
        while (l-- != 0) A.push(0, M);
      }
      for (var R = 0; R < 32; R++) {
        N.q[R] = N.S[R] << 3 | N.T[R];
        N.c[R] = N.p[R] << 4 | N.z[R];
      }
      n(N._, 144, 8);
      n(N._, 255 - 143, 9);
      n(N._, 279 - 255, 7);
      n(N._, 287 - 279, 8);
      H.H.n(N._, 9);
      H.H.A(N._, 9, N.J);
      H.H.l(N._, 9);
      n(N.$, 32, 5);
      H.H.n(N.$, 5);
      H.H.A(N.$, 5, N.h);
      H.H.l(N.$, 5);
      n(N.Q, 19, 0);
      n(N.C, 286, 0);
      n(N.D, 30, 0);
      n(N.v, 320, 0);
    })();
    return H.H.N;
  }();
  function _readInterlace(data, out) {
    const w = out.width;
    const h = out.height;
    const bpp = _getBPP(out);
    const cbpp = bpp >> 3;
    const bpl = Math.ceil(w * bpp / 8);
    const img = new Uint8Array(h * bpl);
    let di = 0;
    const starting_row = [0, 0, 4, 0, 2, 0, 1];
    const starting_col = [0, 4, 0, 2, 0, 1, 0];
    const row_increment = [8, 8, 8, 4, 4, 2, 2];
    const col_increment = [8, 8, 4, 4, 2, 2, 1];
    let pass = 0;
    while (pass < 7) {
      const ri = row_increment[pass];
      const ci = col_increment[pass];
      let sw = 0;
      let sh = 0;
      let cr = starting_row[pass];
      while (cr < h) {
        cr += ri;
        sh++;
      }
      let cc = starting_col[pass];
      while (cc < w) {
        cc += ci;
        sw++;
      }
      const bpll = Math.ceil(sw * bpp / 8);
      _filterZero(data, out, di, sw, sh);
      let y = 0;
      let row = starting_row[pass];
      while (row < h) {
        let col = starting_col[pass];
        let cdi = di + y * bpll << 3;
        while (col < w) {
          if (bpp == 1) {
            var val = data[cdi >> 3];
            val = val >> 7 - (cdi & 7) & 1;
            img[row * bpl + (col >> 3)] |= val << 7 - ((col & 7) << 0);
          }
          if (bpp == 2) {
            var val = data[cdi >> 3];
            val = val >> 6 - (cdi & 7) & 3;
            img[row * bpl + (col >> 2)] |= val << 6 - ((col & 3) << 1);
          }
          if (bpp == 4) {
            var val = data[cdi >> 3];
            val = val >> 4 - (cdi & 7) & 15;
            img[row * bpl + (col >> 1)] |= val << 4 - ((col & 1) << 2);
          }
          if (bpp >= 8) {
            const ii = row * bpl + col * cbpp;
            for (let j = 0; j < cbpp; j++) img[ii + j] = data[(cdi >> 3) + j];
          }
          cdi += bpp;
          col += ci;
        }
        y++;
        row += ri;
      }
      if (sw * sh != 0) di += sh * (1 + bpll);
      pass += 1;
    }
    return img;
  }
  function _getBPP(out) {
    const noc = [1, null, 3, 1, 2, null, 4][out.ctype];
    return noc * out.depth;
  }
  function _filterZero(data, out, off, w, h) {
    let bpp = _getBPP(out);
    const bpl = Math.ceil(w * bpp / 8);
    bpp = Math.ceil(bpp / 8);
    let i;
    let di;
    let type = data[off];
    let x = 0;
    if (type > 1) data[off] = [0, 0, 1][type - 2];
    if (type == 3) for (x = bpp; x < bpl; x++) data[x + 1] = data[x + 1] + (data[x + 1 - bpp] >>> 1) & 255;
    for (let y = 0; y < h; y++) {
      i = off + y * bpl;
      di = i + y + 1;
      type = data[di - 1];
      x = 0;
      if (type == 0) for (; x < bpl; x++) data[i + x] = data[di + x];else if (type == 1) {
        for (; x < bpp; x++) data[i + x] = data[di + x];
        for (; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpp];
      } else if (type == 2) {
        for (; x < bpl; x++) data[i + x] = data[di + x] + data[i + x - bpl];
      } else if (type == 3) {
        for (; x < bpp; x++) data[i + x] = data[di + x] + (data[i + x - bpl] >>> 1);
        for (; x < bpl; x++) data[i + x] = data[di + x] + (data[i + x - bpl] + data[i + x - bpp] >>> 1);
      } else {
        for (; x < bpp; x++) data[i + x] = data[di + x] + _paeth(0, data[i + x - bpl], 0);
        for (; x < bpl; x++) data[i + x] = data[di + x] + _paeth(data[i + x - bpp], data[i + x - bpl], data[i + x - bpp - bpl]);
      }
    }
    return data;
  }
  function _paeth(a, b, c) {
    const p = a + b - c;
    const pa = p - a;
    const pb = p - b;
    const pc = p - c;
    if (pa * pa <= pb * pb && pa * pa <= pc * pc) return a;
    if (pb * pb <= pc * pc) return b;
    return c;
  }
  function _IHDR(data, offset, out) {
    out.width = _bin.readUint(data, offset);
    offset += 4;
    out.height = _bin.readUint(data, offset);
    offset += 4;
    out.depth = data[offset];
    offset++;
    out.ctype = data[offset];
    offset++;
    out.compress = data[offset];
    offset++;
    out.filter = data[offset];
    offset++;
    out.interlace = data[offset];
    offset++;
  }
  function _copyTile(sb, sw, sh, tb, tw, th, xoff, yoff, mode) {
    const w = Math.min(sw, tw);
    const h = Math.min(sh, th);
    let si = 0;
    let ti = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (xoff >= 0 && yoff >= 0) {
          si = y * sw + x << 2;
          ti = (yoff + y) * tw + xoff + x << 2;
        } else {
          si = (-yoff + y) * sw - xoff + x << 2;
          ti = y * tw + x << 2;
        }
        if (mode == 0) {
          tb[ti] = sb[si];
          tb[ti + 1] = sb[si + 1];
          tb[ti + 2] = sb[si + 2];
          tb[ti + 3] = sb[si + 3];
        } else if (mode == 1) {
          var fa = sb[si + 3] * (1 / 255);
          var fr = sb[si] * fa;
          var fg = sb[si + 1] * fa;
          var fb = sb[si + 2] * fa;
          var ba = tb[ti + 3] * (1 / 255);
          var br = tb[ti] * ba;
          var bg = tb[ti + 1] * ba;
          var bb = tb[ti + 2] * ba;
          const ifa = 1 - fa;
          const oa = fa + ba * ifa;
          const ioa = oa == 0 ? 0 : 1 / oa;
          tb[ti + 3] = 255 * oa;
          tb[ti + 0] = (fr + br * ifa) * ioa;
          tb[ti + 1] = (fg + bg * ifa) * ioa;
          tb[ti + 2] = (fb + bb * ifa) * ioa;
        } else if (mode == 2) {
          var fa = sb[si + 3];
          var fr = sb[si];
          var fg = sb[si + 1];
          var fb = sb[si + 2];
          var ba = tb[ti + 3];
          var br = tb[ti];
          var bg = tb[ti + 1];
          var bb = tb[ti + 2];
          if (fa == ba && fr == br && fg == bg && fb == bb) {
            tb[ti] = 0;
            tb[ti + 1] = 0;
            tb[ti + 2] = 0;
            tb[ti + 3] = 0;
          } else {
            tb[ti] = fr;
            tb[ti + 1] = fg;
            tb[ti + 2] = fb;
            tb[ti + 3] = fa;
          }
        } else if (mode == 3) {
          var fa = sb[si + 3];
          var fr = sb[si];
          var fg = sb[si + 1];
          var fb = sb[si + 2];
          var ba = tb[ti + 3];
          var br = tb[ti];
          var bg = tb[ti + 1];
          var bb = tb[ti + 2];
          if (fa == ba && fr == br && fg == bg && fb == bb) continue;
          if (fa < 220 && ba > 20) return false;
        }
      }
    }
    return true;
  }
  return {
    decode,
    toRGBA8,
    _paeth,
    _copyTile,
    _bin
  };
}();
(function () {
  const {
    _copyTile
  } = UPNG;
  const {
    _bin
  } = UPNG;
  const paeth = UPNG._paeth;
  var crcLib = {
    table: function () {
      const tab = new Uint32Array(256);
      for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) {
          if (c & 1) c = 0xedb88320 ^ c >>> 1;else c >>>= 1;
        }
        tab[n] = c;
      }
      return tab;
    }(),
    update(c, buf, off, len) {
      for (let i = 0; i < len; i++) c = crcLib.table[(c ^ buf[off + i]) & 0xff] ^ c >>> 8;
      return c;
    },
    crc(b, o, l) {
      return crcLib.update(0xffffffff, b, o, l) ^ 0xffffffff;
    }
  };
  function addErr(er, tg, ti, f) {
    tg[ti] += er[0] * f >> 4;
    tg[ti + 1] += er[1] * f >> 4;
    tg[ti + 2] += er[2] * f >> 4;
    tg[ti + 3] += er[3] * f >> 4;
  }
  function N(x) {
    return Math.max(0, Math.min(255, x));
  }
  function D(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    const da = a[3] - b[3];
    return dr * dr + dg * dg + db * db + da * da;
  }
  function dither(sb, w, h, plte, tb, oind, MTD) {
    if (MTD == null) MTD = 1;
    const pc = plte.length;
    const nplt = [];
    for (var i = 0; i < pc; i++) {
      const c = plte[i];
      nplt.push([c >>> 0 & 255, c >>> 8 & 255, c >>> 16 & 255, c >>> 24 & 255]);
    }
    for (var i = 0; i < pc; i++) {
      let ne = 0xffffffff;
      var ni = 0;
      for (var j = 0; j < pc; j++) {
        var ce = D(nplt[i], nplt[j]);
        if (j != i && ce < ne) {
          ne = ce;
          ni = j;
        }
      }
    }
    const tb32 = new Uint32Array(tb.buffer);
    const err = new Int16Array(w * h * 4);
    const S = 4;
    const M = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (var i = 0; i < M.length; i++) M[i] = 255 * (-0.5 + (M[i] + 0.5) / (S * S));
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        var i = (y * w + x) * 4;
        var cc;
        if (MTD != 2) cc = [N(sb[i] + err[i]), N(sb[i + 1] + err[i + 1]), N(sb[i + 2] + err[i + 2]), N(sb[i + 3] + err[i + 3])];else {
          var ce = M[(y & S - 1) * S + (x & S - 1)];
          cc = [N(sb[i] + ce), N(sb[i + 1] + ce), N(sb[i + 2] + ce), N(sb[i + 3] + ce)];
        }
        var ni = 0;
        let nd = 0xffffff;
        for (var j = 0; j < pc; j++) {
          const cd = D(cc, nplt[j]);
          if (cd < nd) {
            nd = cd;
            ni = j;
          }
        }
        const nc = nplt[ni];
        const er = [cc[0] - nc[0], cc[1] - nc[1], cc[2] - nc[2], cc[3] - nc[3]];
        if (MTD == 1) {
          if (x != w - 1) addErr(er, err, i + 4, 7);
          if (y != h - 1) {
            if (x != 0) addErr(er, err, i + 4 * w - 4, 3);
            addErr(er, err, i + 4 * w, 5);
            if (x != w - 1) addErr(er, err, i + 4 * w + 4, 1);
          }
        }
        oind[i >> 2] = ni;
        tb32[i >> 2] = plte[ni];
      }
    }
  }
  function encode(bufs, w, h, ps, dels, tabs, forbidPlte) {
    if (ps == null) ps = 0;
    if (forbidPlte == null) forbidPlte = false;
    const nimg = compress(bufs, w, h, ps, [false, false, false, 0, forbidPlte, false]);
    compressPNG(nimg, -1);
    return _main(nimg, w, h, dels, tabs);
  }
  function encodeLL(bufs, w, h, cc, ac, depth, dels, tabs) {
    const nimg = {
      ctype: 0 + (cc == 1 ? 0 : 2) + (ac == 0 ? 0 : 4),
      depth,
      frames: []
    };
    const bipp = (cc + ac) * depth;
    const bipl = bipp * w;
    for (let i = 0; i < bufs.length; i++) {
      nimg.frames.push({
        rect: {
          x: 0,
          y: 0,
          width: w,
          height: h
        },
        img: new Uint8Array(bufs[i]),
        blend: 0,
        dispose: 1,
        bpp: Math.ceil(bipp / 8),
        bpl: Math.ceil(bipl / 8)
      });
    }
    compressPNG(nimg, 0, true);
    const out = _main(nimg, w, h, dels, tabs);
    return out;
  }
  function _main(nimg, w, h, dels, tabs) {
    if (tabs == null) tabs = {};
    const {
      crc
    } = crcLib;
    const wUi = _bin.writeUint;
    const wUs = _bin.writeUshort;
    const wAs = _bin.writeASCII;
    let offset = 8;
    const anim = nimg.frames.length > 1;
    let pltAlpha = false;
    let cicc;
    let leng = 8 + (16 + 5 + 4) + (anim ? 20 : 0);
    if (tabs.sRGB != null) leng += 8 + 1 + 4;
    if (tabs.pHYs != null) leng += 8 + 9 + 4;
    if (tabs.iCCP != null) {
      cicc = pako.deflate(tabs.iCCP);
      leng += 8 + 11 + 2 + cicc.length + 4;
    }
    if (nimg.ctype == 3) {
      var dl = nimg.plte.length;
      for (var i = 0; i < dl; i++) if (nimg.plte[i] >>> 24 != 255) pltAlpha = true;
      leng += 8 + dl * 3 + 4 + (pltAlpha ? 8 + dl * 1 + 4 : 0);
    }
    for (var j = 0; j < nimg.frames.length; j++) {
      var fr = nimg.frames[j];
      if (anim) leng += 38;
      leng += fr.cimg.length + 12;
      if (j != 0) leng += 4;
    }
    leng += 12;
    const data = new Uint8Array(leng);
    const wr = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    for (var i = 0; i < 8; i++) data[i] = wr[i];
    wUi(data, offset, 13);
    offset += 4;
    wAs(data, offset, 'IHDR');
    offset += 4;
    wUi(data, offset, w);
    offset += 4;
    wUi(data, offset, h);
    offset += 4;
    data[offset] = nimg.depth;
    offset++;
    data[offset] = nimg.ctype;
    offset++;
    data[offset] = 0;
    offset++;
    data[offset] = 0;
    offset++;
    data[offset] = 0;
    offset++;
    wUi(data, offset, crc(data, offset - 17, 17));
    offset += 4;
    if (tabs.sRGB != null) {
      wUi(data, offset, 1);
      offset += 4;
      wAs(data, offset, 'sRGB');
      offset += 4;
      data[offset] = tabs.sRGB;
      offset++;
      wUi(data, offset, crc(data, offset - 5, 5));
      offset += 4;
    }
    if (tabs.iCCP != null) {
      const sl = 11 + 2 + cicc.length;
      wUi(data, offset, sl);
      offset += 4;
      wAs(data, offset, 'iCCP');
      offset += 4;
      wAs(data, offset, 'ICC profile');
      offset += 11;
      offset += 2;
      data.set(cicc, offset);
      offset += cicc.length;
      wUi(data, offset, crc(data, offset - (sl + 4), sl + 4));
      offset += 4;
    }
    if (tabs.pHYs != null) {
      wUi(data, offset, 9);
      offset += 4;
      wAs(data, offset, 'pHYs');
      offset += 4;
      wUi(data, offset, tabs.pHYs[0]);
      offset += 4;
      wUi(data, offset, tabs.pHYs[1]);
      offset += 4;
      data[offset] = tabs.pHYs[2];
      offset++;
      wUi(data, offset, crc(data, offset - 13, 13));
      offset += 4;
    }
    if (anim) {
      wUi(data, offset, 8);
      offset += 4;
      wAs(data, offset, 'acTL');
      offset += 4;
      wUi(data, offset, nimg.frames.length);
      offset += 4;
      wUi(data, offset, tabs.loop != null ? tabs.loop : 0);
      offset += 4;
      wUi(data, offset, crc(data, offset - 12, 12));
      offset += 4;
    }
    if (nimg.ctype == 3) {
      var dl = nimg.plte.length;
      wUi(data, offset, dl * 3);
      offset += 4;
      wAs(data, offset, 'PLTE');
      offset += 4;
      for (var i = 0; i < dl; i++) {
        const ti = i * 3;
        const c = nimg.plte[i];
        const r = c & 255;
        const g = c >>> 8 & 255;
        const b = c >>> 16 & 255;
        data[offset + ti + 0] = r;
        data[offset + ti + 1] = g;
        data[offset + ti + 2] = b;
      }
      offset += dl * 3;
      wUi(data, offset, crc(data, offset - dl * 3 - 4, dl * 3 + 4));
      offset += 4;
      if (pltAlpha) {
        wUi(data, offset, dl);
        offset += 4;
        wAs(data, offset, 'tRNS');
        offset += 4;
        for (var i = 0; i < dl; i++) data[offset + i] = nimg.plte[i] >>> 24 & 255;
        offset += dl;
        wUi(data, offset, crc(data, offset - dl - 4, dl + 4));
        offset += 4;
      }
    }
    let fi = 0;
    for (var j = 0; j < nimg.frames.length; j++) {
      var fr = nimg.frames[j];
      if (anim) {
        wUi(data, offset, 26);
        offset += 4;
        wAs(data, offset, 'fcTL');
        offset += 4;
        wUi(data, offset, fi++);
        offset += 4;
        wUi(data, offset, fr.rect.width);
        offset += 4;
        wUi(data, offset, fr.rect.height);
        offset += 4;
        wUi(data, offset, fr.rect.x);
        offset += 4;
        wUi(data, offset, fr.rect.y);
        offset += 4;
        wUs(data, offset, dels[j]);
        offset += 2;
        wUs(data, offset, 1000);
        offset += 2;
        data[offset] = fr.dispose;
        offset++;
        data[offset] = fr.blend;
        offset++;
        wUi(data, offset, crc(data, offset - 30, 30));
        offset += 4;
      }
      const imgd = fr.cimg;
      var dl = imgd.length;
      wUi(data, offset, dl + (j == 0 ? 0 : 4));
      offset += 4;
      const ioff = offset;
      wAs(data, offset, j == 0 ? 'IDAT' : 'fdAT');
      offset += 4;
      if (j != 0) {
        wUi(data, offset, fi++);
        offset += 4;
      }
      data.set(imgd, offset);
      offset += dl;
      wUi(data, offset, crc(data, ioff, offset - ioff));
      offset += 4;
    }
    wUi(data, offset, 0);
    offset += 4;
    wAs(data, offset, 'IEND');
    offset += 4;
    wUi(data, offset, crc(data, offset - 4, 4));
    offset += 4;
    return data.buffer;
  }
  function compressPNG(out, filter, levelZero) {
    for (let i = 0; i < out.frames.length; i++) {
      const frm = out.frames[i];
      frm.rect.width;
      const nh = frm.rect.height;
      const fdata = new Uint8Array(nh * frm.bpl + nh);
      frm.cimg = _filterZero(frm.img, nh, frm.bpp, frm.bpl, fdata, filter, levelZero);
    }
  }
  function compress(bufs, w, h, ps, prms) {
    const onlyBlend = prms[0];
    const evenCrd = prms[1];
    const forbidPrev = prms[2];
    const minBits = prms[3];
    const forbidPlte = prms[4];
    const dith = prms[5];
    let ctype = 6;
    let depth = 8;
    let alphaAnd = 255;
    for (var j = 0; j < bufs.length; j++) {
      const img = new Uint8Array(bufs[j]);
      var ilen = img.length;
      for (var i = 0; i < ilen; i += 4) alphaAnd &= img[i + 3];
    }
    const gotAlpha = alphaAnd != 255;
    const frms = framize(bufs, w, h, onlyBlend, evenCrd, forbidPrev);
    const cmap = {};
    const plte = [];
    const inds = [];
    if (ps != 0) {
      const nbufs = [];
      for (var i = 0; i < frms.length; i++) nbufs.push(frms[i].img.buffer);
      const abuf = concatRGBA(nbufs);
      const qres = quantize(abuf, ps);
      for (var i = 0; i < qres.plte.length; i++) plte.push(qres.plte[i].est.rgba);
      let cof = 0;
      for (var i = 0; i < frms.length; i++) {
        var frm = frms[i];
        const bln = frm.img.length;
        var ind = new Uint8Array(qres.inds.buffer, cof >> 2, bln >> 2);
        inds.push(ind);
        const bb = new Uint8Array(qres.abuf, cof, bln);
        if (dith) dither(frm.img, frm.rect.width, frm.rect.height, plte, bb, ind);
        frm.img.set(bb);
        cof += bln;
      }
    } else {
      for (var j = 0; j < frms.length; j++) {
        var frm = frms[j];
        const img32 = new Uint32Array(frm.img.buffer);
        var nw = frm.rect.width;
        var ilen = img32.length;
        var ind = new Uint8Array(ilen);
        inds.push(ind);
        for (var i = 0; i < ilen; i++) {
          const c = img32[i];
          if (i != 0 && c == img32[i - 1]) ind[i] = ind[i - 1];else if (i > nw && c == img32[i - nw]) ind[i] = ind[i - nw];else {
            let cmc = cmap[c];
            if (cmc == null) {
              cmap[c] = cmc = plte.length;
              plte.push(c);
              if (plte.length >= 300) break;
            }
            ind[i] = cmc;
          }
        }
      }
    }
    const cc = plte.length;
    if (cc <= 256 && forbidPlte == false) {
      if (cc <= 2) depth = 1;else if (cc <= 4) depth = 2;else if (cc <= 16) depth = 4;else depth = 8;
      depth = Math.max(depth, minBits);
    }
    for (var j = 0; j < frms.length; j++) {
      var frm = frms[j];
      frm.rect.x;
      frm.rect.y;
      var nw = frm.rect.width;
      const nh = frm.rect.height;
      let cimg = frm.img;
      new Uint32Array(cimg.buffer);
      let bpl = 4 * nw;
      let bpp = 4;
      if (cc <= 256 && forbidPlte == false) {
        bpl = Math.ceil(depth * nw / 8);
        var nimg = new Uint8Array(bpl * nh);
        const inj = inds[j];
        for (let y = 0; y < nh; y++) {
          var i = y * bpl;
          const ii = y * nw;
          if (depth == 8) for (var x = 0; x < nw; x++) nimg[i + x] = inj[ii + x];else if (depth == 4) for (var x = 0; x < nw; x++) nimg[i + (x >> 1)] |= inj[ii + x] << 4 - (x & 1) * 4;else if (depth == 2) for (var x = 0; x < nw; x++) nimg[i + (x >> 2)] |= inj[ii + x] << 6 - (x & 3) * 2;else if (depth == 1) for (var x = 0; x < nw; x++) nimg[i + (x >> 3)] |= inj[ii + x] << 7 - (x & 7) * 1;
        }
        cimg = nimg;
        ctype = 3;
        bpp = 1;
      } else if (gotAlpha == false && frms.length == 1) {
        var nimg = new Uint8Array(nw * nh * 3);
        const area = nw * nh;
        for (var i = 0; i < area; i++) {
          const ti = i * 3;
          const qi = i * 4;
          nimg[ti] = cimg[qi];
          nimg[ti + 1] = cimg[qi + 1];
          nimg[ti + 2] = cimg[qi + 2];
        }
        cimg = nimg;
        ctype = 2;
        bpp = 3;
        bpl = 3 * nw;
      }
      frm.img = cimg;
      frm.bpl = bpl;
      frm.bpp = bpp;
    }
    return {
      ctype,
      depth,
      plte,
      frames: frms
    };
  }
  function framize(bufs, w, h, alwaysBlend, evenCrd, forbidPrev) {
    const frms = [];
    for (var j = 0; j < bufs.length; j++) {
      const cimg = new Uint8Array(bufs[j]);
      const cimg32 = new Uint32Array(cimg.buffer);
      var nimg;
      let nx = 0;
      let ny = 0;
      let nw = w;
      let nh = h;
      let blend = alwaysBlend ? 1 : 0;
      if (j != 0) {
        const tlim = forbidPrev || alwaysBlend || j == 1 || frms[j - 2].dispose != 0 ? 1 : 2;
        let tstp = 0;
        let tarea = 1e9;
        for (let it = 0; it < tlim; it++) {
          var pimg = new Uint8Array(bufs[j - 1 - it]);
          const p32 = new Uint32Array(bufs[j - 1 - it]);
          let mix = w;
          let miy = h;
          let max = -1;
          let may = -1;
          for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
              var i = y * w + x;
              if (cimg32[i] != p32[i]) {
                if (x < mix) mix = x;
                if (x > max) max = x;
                if (y < miy) miy = y;
                if (y > may) may = y;
              }
            }
          }
          if (max == -1) mix = miy = max = may = 0;
          if (evenCrd) {
            if ((mix & 1) == 1) mix--;
            if ((miy & 1) == 1) miy--;
          }
          const sarea = (max - mix + 1) * (may - miy + 1);
          if (sarea < tarea) {
            tarea = sarea;
            tstp = it;
            nx = mix;
            ny = miy;
            nw = max - mix + 1;
            nh = may - miy + 1;
          }
        }
        var pimg = new Uint8Array(bufs[j - 1 - tstp]);
        if (tstp == 1) frms[j - 1].dispose = 2;
        nimg = new Uint8Array(nw * nh * 4);
        _copyTile(pimg, w, h, nimg, nw, nh, -nx, -ny, 0);
        blend = _copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 3) ? 1 : 0;
        if (blend == 1) {
          _prepareDiff(cimg, w, h, nimg, {
            x: nx,
            y: ny,
            width: nw,
            height: nh
          });
        } else _copyTile(cimg, w, h, nimg, nw, nh, -nx, -ny, 0);
      } else nimg = cimg.slice(0);
      frms.push({
        rect: {
          x: nx,
          y: ny,
          width: nw,
          height: nh
        },
        img: nimg,
        blend,
        dispose: 0
      });
    }
    if (alwaysBlend) {
      for (var j = 0; j < frms.length; j++) {
        var frm = frms[j];
        if (frm.blend == 1) continue;
        const r0 = frm.rect;
        const r1 = frms[j - 1].rect;
        const miX = Math.min(r0.x, r1.x);
        const miY = Math.min(r0.y, r1.y);
        const maX = Math.max(r0.x + r0.width, r1.x + r1.width);
        const maY = Math.max(r0.y + r0.height, r1.y + r1.height);
        const r = {
          x: miX,
          y: miY,
          width: maX - miX,
          height: maY - miY
        };
        frms[j - 1].dispose = 1;
        if (j - 1 != 0) _updateFrame(bufs, w, h, frms, j - 1, r, evenCrd);
        _updateFrame(bufs, w, h, frms, j, r, evenCrd);
      }
    }
    let area = 0;
    if (bufs.length != 1) {
      for (var i = 0; i < frms.length; i++) {
        var frm = frms[i];
        area += frm.rect.width * frm.rect.height;
      }
    }
    return frms;
  }
  function _updateFrame(bufs, w, h, frms, i, r, evenCrd) {
    const U8 = Uint8Array;
    const U32 = Uint32Array;
    const pimg = new U8(bufs[i - 1]);
    const pimg32 = new U32(bufs[i - 1]);
    const nimg = i + 1 < bufs.length ? new U8(bufs[i + 1]) : null;
    const cimg = new U8(bufs[i]);
    const cimg32 = new U32(cimg.buffer);
    let mix = w;
    let miy = h;
    let max = -1;
    let may = -1;
    for (let y = 0; y < r.height; y++) {
      for (let x = 0; x < r.width; x++) {
        const cx = r.x + x;
        const cy = r.y + y;
        const j = cy * w + cx;
        const cc = cimg32[j];
        if (cc == 0 || frms[i - 1].dispose == 0 && pimg32[j] == cc && (nimg == null || nimg[j * 4 + 3] != 0)) ; else {
          if (cx < mix) mix = cx;
          if (cx > max) max = cx;
          if (cy < miy) miy = cy;
          if (cy > may) may = cy;
        }
      }
    }
    if (max == -1) mix = miy = max = may = 0;
    if (evenCrd) {
      if ((mix & 1) == 1) mix--;
      if ((miy & 1) == 1) miy--;
    }
    r = {
      x: mix,
      y: miy,
      width: max - mix + 1,
      height: may - miy + 1
    };
    const fr = frms[i];
    fr.rect = r;
    fr.blend = 1;
    fr.img = new Uint8Array(r.width * r.height * 4);
    if (frms[i - 1].dispose == 0) {
      _copyTile(pimg, w, h, fr.img, r.width, r.height, -r.x, -r.y, 0);
      _prepareDiff(cimg, w, h, fr.img, r);
    } else _copyTile(cimg, w, h, fr.img, r.width, r.height, -r.x, -r.y, 0);
  }
  function _prepareDiff(cimg, w, h, nimg, rec) {
    _copyTile(cimg, w, h, nimg, rec.width, rec.height, -rec.x, -rec.y, 2);
  }
  function _filterZero(img, h, bpp, bpl, data, filter, levelZero) {
    const fls = [];
    let ftry = [0, 1, 2, 3, 4];
    if (filter != -1) ftry = [filter];else if (h * bpl > 500000 || bpp == 1) ftry = [0];
    let opts;
    if (levelZero) opts = {
      level: 0
    };
    const CMPR = UZIP;
    for (var i = 0; i < ftry.length; i++) {
      for (let y = 0; y < h; y++) _filterLine(data, img, y, bpl, bpp, ftry[i]);
      fls.push(CMPR.deflate(data, opts));
    }
    let ti;
    let tsize = 1e9;
    for (var i = 0; i < fls.length; i++) if (fls[i].length < tsize) {
      ti = i;
      tsize = fls[i].length;
    }
    return fls[ti];
  }
  function _filterLine(data, img, y, bpl, bpp, type) {
    const i = y * bpl;
    let di = i + y;
    data[di] = type;
    di++;
    if (type == 0) {
      if (bpl < 500) for (var x = 0; x < bpl; x++) data[di + x] = img[i + x];else data.set(new Uint8Array(img.buffer, i, bpl), di);
    } else if (type == 1) {
      for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
      for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - img[i + x - bpp] + 256 & 255;
    } else if (y == 0) {
      for (var x = 0; x < bpp; x++) data[di + x] = img[i + x];
      if (type == 2) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x];
      if (type == 3) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - (img[i + x - bpp] >> 1) + 256 & 255;
      if (type == 4) for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] - paeth(img[i + x - bpp], 0, 0) + 256 & 255;
    } else {
      if (type == 2) {
        for (var x = 0; x < bpl; x++) data[di + x] = img[i + x] + 256 - img[i + x - bpl] & 255;
      }
      if (type == 3) {
        for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] >> 1) & 255;
        for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - (img[i + x - bpl] + img[i + x - bpp] >> 1) & 255;
      }
      if (type == 4) {
        for (var x = 0; x < bpp; x++) data[di + x] = img[i + x] + 256 - paeth(0, img[i + x - bpl], 0) & 255;
        for (var x = bpp; x < bpl; x++) data[di + x] = img[i + x] + 256 - paeth(img[i + x - bpp], img[i + x - bpl], img[i + x - bpp - bpl]) & 255;
      }
    }
  }
  function quantize(abuf, ps) {
    const sb = new Uint8Array(abuf);
    const tb = sb.slice(0);
    const tb32 = new Uint32Array(tb.buffer);
    const KD = getKDtree(tb, ps);
    const root = KD[0];
    const leafs = KD[1];
    const len = sb.length;
    const inds = new Uint8Array(len >> 2);
    let nd;
    if (sb.length < 20e6) {
      for (var i = 0; i < len; i += 4) {
        var r = sb[i] * (1 / 255);
        var g = sb[i + 1] * (1 / 255);
        var b = sb[i + 2] * (1 / 255);
        var a = sb[i + 3] * (1 / 255);
        nd = getNearest(root, r, g, b, a);
        inds[i >> 2] = nd.ind;
        tb32[i >> 2] = nd.est.rgba;
      }
    } else {
      for (var i = 0; i < len; i += 4) {
        var r = sb[i] * (1 / 255);
        var g = sb[i + 1] * (1 / 255);
        var b = sb[i + 2] * (1 / 255);
        var a = sb[i + 3] * (1 / 255);
        nd = root;
        while (nd.left) nd = planeDst(nd.est, r, g, b, a) <= 0 ? nd.left : nd.right;
        inds[i >> 2] = nd.ind;
        tb32[i >> 2] = nd.est.rgba;
      }
    }
    return {
      abuf: tb.buffer,
      inds,
      plte: leafs
    };
  }
  function getKDtree(nimg, ps, err) {
    if (err == null) err = 0.0001;
    const nimg32 = new Uint32Array(nimg.buffer);
    const root = {
      i0: 0,
      i1: nimg.length,
      bst: null,
      est: null,
      tdst: 0,
      left: null,
      right: null
    };
    root.bst = stats(nimg, root.i0, root.i1);
    root.est = estats(root.bst);
    const leafs = [root];
    while (leafs.length < ps) {
      let maxL = 0;
      let mi = 0;
      for (var i = 0; i < leafs.length; i++) if (leafs[i].est.L > maxL) {
        maxL = leafs[i].est.L;
        mi = i;
      }
      if (maxL < err) break;
      const node = leafs[mi];
      const s0 = splitPixels(nimg, nimg32, node.i0, node.i1, node.est.e, node.est.eMq255);
      const s0wrong = node.i0 >= s0 || node.i1 <= s0;
      if (s0wrong) {
        node.est.L = 0;
        continue;
      }
      const ln = {
        i0: node.i0,
        i1: s0,
        bst: null,
        est: null,
        tdst: 0,
        left: null,
        right: null
      };
      ln.bst = stats(nimg, ln.i0, ln.i1);
      ln.est = estats(ln.bst);
      const rn = {
        i0: s0,
        i1: node.i1,
        bst: null,
        est: null,
        tdst: 0,
        left: null,
        right: null
      };
      rn.bst = {
        R: [],
        m: [],
        N: node.bst.N - ln.bst.N
      };
      for (var i = 0; i < 16; i++) rn.bst.R[i] = node.bst.R[i] - ln.bst.R[i];
      for (var i = 0; i < 4; i++) rn.bst.m[i] = node.bst.m[i] - ln.bst.m[i];
      rn.est = estats(rn.bst);
      node.left = ln;
      node.right = rn;
      leafs[mi] = ln;
      leafs.push(rn);
    }
    leafs.sort((a, b) => b.bst.N - a.bst.N);
    for (var i = 0; i < leafs.length; i++) leafs[i].ind = i;
    return [root, leafs];
  }
  function getNearest(nd, r, g, b, a) {
    if (nd.left == null) {
      nd.tdst = dist(nd.est.q, r, g, b, a);
      return nd;
    }
    const pd = planeDst(nd.est, r, g, b, a);
    let node0 = nd.left;
    let node1 = nd.right;
    if (pd > 0) {
      node0 = nd.right;
      node1 = nd.left;
    }
    const ln = getNearest(node0, r, g, b, a);
    if (ln.tdst <= pd * pd) return ln;
    const rn = getNearest(node1, r, g, b, a);
    return rn.tdst < ln.tdst ? rn : ln;
  }
  function planeDst(est, r, g, b, a) {
    const {
      e
    } = est;
    return e[0] * r + e[1] * g + e[2] * b + e[3] * a - est.eMq;
  }
  function dist(q, r, g, b, a) {
    const d0 = r - q[0];
    const d1 = g - q[1];
    const d2 = b - q[2];
    const d3 = a - q[3];
    return d0 * d0 + d1 * d1 + d2 * d2 + d3 * d3;
  }
  function splitPixels(nimg, nimg32, i0, i1, e, eMq) {
    i1 -= 4;
    while (i0 < i1) {
      while (vecDot(nimg, i0, e) <= eMq) i0 += 4;
      while (vecDot(nimg, i1, e) > eMq) i1 -= 4;
      if (i0 >= i1) break;
      const t = nimg32[i0 >> 2];
      nimg32[i0 >> 2] = nimg32[i1 >> 2];
      nimg32[i1 >> 2] = t;
      i0 += 4;
      i1 -= 4;
    }
    while (vecDot(nimg, i0, e) > eMq) i0 -= 4;
    return i0 + 4;
  }
  function vecDot(nimg, i, e) {
    return nimg[i] * e[0] + nimg[i + 1] * e[1] + nimg[i + 2] * e[2] + nimg[i + 3] * e[3];
  }
  function stats(nimg, i0, i1) {
    const R = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const m = [0, 0, 0, 0];
    const N = i1 - i0 >> 2;
    for (let i = i0; i < i1; i += 4) {
      const r = nimg[i] * (1 / 255);
      const g = nimg[i + 1] * (1 / 255);
      const b = nimg[i + 2] * (1 / 255);
      const a = nimg[i + 3] * (1 / 255);
      m[0] += r;
      m[1] += g;
      m[2] += b;
      m[3] += a;
      R[0] += r * r;
      R[1] += r * g;
      R[2] += r * b;
      R[3] += r * a;
      R[5] += g * g;
      R[6] += g * b;
      R[7] += g * a;
      R[10] += b * b;
      R[11] += b * a;
      R[15] += a * a;
    }
    R[4] = R[1];
    R[8] = R[2];
    R[9] = R[6];
    R[12] = R[3];
    R[13] = R[7];
    R[14] = R[11];
    return {
      R,
      m,
      N
    };
  }
  function estats(stats) {
    const {
      R
    } = stats;
    const {
      m
    } = stats;
    const {
      N
    } = stats;
    const m0 = m[0];
    const m1 = m[1];
    const m2 = m[2];
    const m3 = m[3];
    const iN = N == 0 ? 0 : 1 / N;
    const Rj = [R[0] - m0 * m0 * iN, R[1] - m0 * m1 * iN, R[2] - m0 * m2 * iN, R[3] - m0 * m3 * iN, R[4] - m1 * m0 * iN, R[5] - m1 * m1 * iN, R[6] - m1 * m2 * iN, R[7] - m1 * m3 * iN, R[8] - m2 * m0 * iN, R[9] - m2 * m1 * iN, R[10] - m2 * m2 * iN, R[11] - m2 * m3 * iN, R[12] - m3 * m0 * iN, R[13] - m3 * m1 * iN, R[14] - m3 * m2 * iN, R[15] - m3 * m3 * iN];
    const A = Rj;
    const M = M4;
    let b = [Math.random(), Math.random(), Math.random(), Math.random()];
    let mi = 0;
    let tmi = 0;
    if (N != 0) {
      for (let i = 0; i < 16; i++) {
        b = M.multVec(A, b);
        tmi = Math.sqrt(M.dot(b, b));
        b = M.sml(1 / tmi, b);
        if (i != 0 && Math.abs(tmi - mi) < 1e-9) break;
        mi = tmi;
      }
    }
    const q = [m0 * iN, m1 * iN, m2 * iN, m3 * iN];
    const eMq255 = M.dot(M.sml(255, q), b);
    return {
      Cov: Rj,
      q,
      e: b,
      L: mi,
      eMq255,
      eMq: M.dot(b, q),
      rgba: (Math.round(255 * q[3]) << 24 | Math.round(255 * q[2]) << 16 | Math.round(255 * q[1]) << 8 | Math.round(255 * q[0]) << 0) >>> 0
    };
  }
  var M4 = {
    multVec(m, v) {
      return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2] + m[3] * v[3], m[4] * v[0] + m[5] * v[1] + m[6] * v[2] + m[7] * v[3], m[8] * v[0] + m[9] * v[1] + m[10] * v[2] + m[11] * v[3], m[12] * v[0] + m[13] * v[1] + m[14] * v[2] + m[15] * v[3]];
    },
    dot(x, y) {
      return x[0] * y[0] + x[1] * y[1] + x[2] * y[2] + x[3] * y[3];
    },
    sml(a, y) {
      return [a * y[0], a * y[1], a * y[2], a * y[3]];
    }
  };
  function concatRGBA(bufs) {
    let tlen = 0;
    for (var i = 0; i < bufs.length; i++) tlen += bufs[i].byteLength;
    const nimg = new Uint8Array(tlen);
    let noff = 0;
    for (var i = 0; i < bufs.length; i++) {
      const img = new Uint8Array(bufs[i]);
      const il = img.length;
      for (let j = 0; j < il; j += 4) {
        let r = img[j];
        let g = img[j + 1];
        let b = img[j + 2];
        const a = img[j + 3];
        if (a == 0) r = g = b = 0;
        nimg[noff + j] = r;
        nimg[noff + j + 1] = g;
        nimg[noff + j + 2] = b;
        nimg[noff + j + 3] = a;
      }
      noff += il;
    }
    return nimg.buffer;
  }
  UPNG.encode = encode;
  UPNG.encodeLL = encodeLL;
  UPNG.encode.compress = compress;
  UPNG.encode.dither = dither;
  UPNG.quantize = quantize;
  UPNG.quantize.getKDtree = getKDtree;
  UPNG.quantize.getNearest = getNearest;
})();

const CanvasToBMP = {
  toArrayBuffer(canvas, callback) {
    const w = canvas.width;
    const h = canvas.height;
    const w4 = w << 2;
    const idata = canvas.getContext('2d').getImageData(0, 0, w, h);
    const data32 = new Uint32Array(idata.data.buffer);
    const stride = (32 * w + 31) / 32 << 2;
    const pixelArraySize = stride * h;
    const fileLength = 122 + pixelArraySize;
    const file = new ArrayBuffer(fileLength);
    const view = new DataView(file);
    const blockSize = 1 << 20;
    let block = blockSize;
    let y = 0;
    let x;
    let v;
    let a;
    let pos = 0;
    let p;
    let s = 0;
    set16(0x4d42);
    set32(fileLength);
    seek(4);
    set32(0x7a);
    set32(0x6c);
    set32(w);
    set32(-h >>> 0);
    set16(1);
    set16(32);
    set32(3);
    set32(pixelArraySize);
    set32(2835);
    set32(2835);
    seek(8);
    set32(0xff0000);
    set32(0xff00);
    set32(0xff);
    set32(0xff000000);
    set32(0x57696e20);
    (function convert() {
      while (y < h && block > 0) {
        p = 0x7a + y * stride;
        x = 0;
        while (x < w4) {
          block--;
          v = data32[s++];
          a = v >>> 24;
          view.setUint32(p + x, v << 8 | a);
          x += 4;
        }
        y++;
      }
      if (s < data32.length) {
        block = blockSize;
        setTimeout(convert, CanvasToBMP._dly);
      } else callback(file);
    })();
    function set16(data) {
      view.setUint16(pos, data, true);
      pos += 2;
    }
    function set32(data) {
      view.setUint32(pos, data, true);
      pos += 4;
    }
    function seek(delta) {
      pos += delta;
    }
  },
  toBlob(canvas, callback) {
    this.toArrayBuffer(canvas, file => {
      callback(new Blob([file], {
        type: 'image/bmp'
      }));
    });
  },
  _dly: 9
};

var BROWSER_NAME = {
  CHROME: 'CHROME',
  FIREFOX: 'FIREFOX',
  DESKTOP_SAFARI: 'DESKTOP_SAFARI',
  IE: 'IE',
  IOS: 'IOS',
  ETC: 'ETC'
};

var MAX_CANVAS_SIZE = {
  [BROWSER_NAME.CHROME]: 16384,
  [BROWSER_NAME.FIREFOX]: 11180,
  [BROWSER_NAME.DESKTOP_SAFARI]: 16384,
  [BROWSER_NAME.IE]: 8192,
  [BROWSER_NAME.IOS]: 4096,
  [BROWSER_NAME.ETC]: 8192
};

const isBrowser = typeof window !== 'undefined';
const inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
const moduleMapper = isBrowser && window.cordova && window.cordova.require && window.cordova.require('cordova/modulemapper');
const CustomFile = (isBrowser || inWebWorker) && (moduleMapper && moduleMapper.getOriginalSymbol(window, 'File') || typeof File !== 'undefined' && File);
const CustomFileReader = (isBrowser || inWebWorker) && (moduleMapper && moduleMapper.getOriginalSymbol(window, 'FileReader') || typeof FileReader !== 'undefined' && FileReader);
function getFilefromDataUrl(dataUrl, filename, lastModified = Date.now()) {
  return new Promise(resolve => {
    const arr = dataUrl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = globalThis.atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    const file = new Blob([u8arr], {
      type: mime
    });
    file.name = filename;
    file.lastModified = lastModified;
    resolve(file);
  });
}
function getDataUrlFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new CustomFileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = e => reject(e);
    reader.readAsDataURL(file);
  });
}
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = e => reject(e);
    img.src = src;
  });
}
function isIOS() {
  if (isIOS.cachedResult !== undefined) {
    return isIOS.cachedResult;
  }
  isIOS.cachedResult = ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'].includes(navigator.platform) || navigator.userAgent.includes('Mac') && navigator.maxTouchPoints && navigator.maxTouchPoints > 1 && !window.MSStream;
  return isIOS.cachedResult;
}
function getBrowserName() {
  if (getBrowserName.cachedResult !== undefined) {
    return getBrowserName.cachedResult;
  }
  if (isIOS()) {
    getBrowserName.cachedResult = BROWSER_NAME.IOS;
    return getBrowserName.cachedResult;
  }
  let browserName = BROWSER_NAME.ETC;
  const {
    userAgent
  } = navigator;
  if (/Chrom(e|ium)/i.test(userAgent)) {
    browserName = BROWSER_NAME.CHROME;
  } else if (/iP(ad|od|hone)/i.test(userAgent) && /WebKit/i.test(userAgent)) {
    browserName = BROWSER_NAME.IOS;
  } else if (/Safari/i.test(userAgent)) {
    browserName = BROWSER_NAME.DESKTOP_SAFARI;
  } else if (/Firefox/i.test(userAgent)) {
    browserName = BROWSER_NAME.FIREFOX;
  } else if (/MSIE/i.test(userAgent) || !!document.documentMode === true) {
    browserName = BROWSER_NAME.IE;
  }
  getBrowserName.cachedResult = browserName;
  return getBrowserName.cachedResult;
}
function approximateBelowMaximumCanvasSizeOfBrowser(initWidth, initHeight) {
  const browserName = getBrowserName();
  const maximumCanvasSize = MAX_CANVAS_SIZE[browserName];
  let width = initWidth;
  let height = initHeight;
  let size = width * height;
  const ratio = width > height ? height / width : width / height;
  while (size > maximumCanvasSize * maximumCanvasSize) {
    const halfSizeWidth = (maximumCanvasSize + width) / 2;
    const halfSizeHeight = (maximumCanvasSize + height) / 2;
    if (halfSizeWidth < halfSizeHeight) {
      height = halfSizeHeight;
      width = halfSizeHeight * ratio;
    } else {
      height = halfSizeWidth * ratio;
      width = halfSizeWidth;
    }
    size = width * height;
  }
  return {
    width,
    height
  };
}
function getNewCanvasAndCtx(width, height) {
  let canvas;
  let ctx;
  try {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
    if (ctx === null) {
      throw new Error('getContext of OffscreenCanvas returns null');
    }
  } catch (e) {
    canvas = document.createElement('canvas');
    ctx = canvas.getContext('2d');
  }
  canvas.width = width;
  canvas.height = height;
  return [canvas, ctx];
}
function drawImageInCanvas(img, fileType = undefined) {
  const {
    width,
    height
  } = approximateBelowMaximumCanvasSizeOfBrowser(img.width, img.height);
  const [canvas, ctx] = getNewCanvasAndCtx(width, height);
  if (fileType && /jpe?g/.test(fileType)) {
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function drawFileInCanvas(file, options = {}) {
  return new Promise(function ($return, $error) {
    let img, canvas;
    var $Try_2_Post = function () {
      try {
        canvas = drawImageInCanvas(img, options.fileType || file.type);
        return $return([img, canvas]);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    };
    var $Try_2_Catch = function (e) {
      try {
        if ("development" === 'development') {
          console.error(e);
        }
        var $Try_3_Post = function () {
          try {
            return $Try_2_Post();
          } catch ($boundEx) {
            return $error($boundEx);
          }
        };
        var $Try_3_Catch = function (e2) {
          try {
            if ("development" === 'development') {
              console.error(e2);
            }
            throw e2;
          } catch ($boundEx) {
            return $error($boundEx);
          }
        };
        try {
          let dataUrl;
          return getDataUrlFromFile(file).then(function ($await_7) {
            try {
              dataUrl = $await_7;
              return loadImage(dataUrl).then(function ($await_8) {
                try {
                  img = $await_8;
                  return $Try_3_Post();
                } catch ($boundEx) {
                  return $Try_3_Catch($boundEx);
                }
              }, $Try_3_Catch);
            } catch ($boundEx) {
              return $Try_3_Catch($boundEx);
            }
          }, $Try_3_Catch);
        } catch (e2) {
          $Try_3_Catch(e2);
        }
      } catch ($boundEx) {
        return $error($boundEx);
      }
    };
    try {
      if (isIOS() || [BROWSER_NAME.DESKTOP_SAFARI, BROWSER_NAME.MOBILE_SAFARI].includes(getBrowserName())) {
        throw new Error('Skip createImageBitmap on IOS and Safari');
      }
      return createImageBitmap(file).then(function ($await_9) {
        try {
          img = $await_9;
          return $Try_2_Post();
        } catch ($boundEx) {
          return $Try_2_Catch($boundEx);
        }
      }, $Try_2_Catch);
    } catch (e) {
      $Try_2_Catch(e);
    }
  });
}
function canvasToFile(canvas, fileType, fileName, fileLastModified, quality = 1) {
  return new Promise(function ($return, $error) {
    let file;
    if (fileType === 'image/png') {
      let ctx;
      ctx = canvas.getContext('2d');
      let data;
      ({
        data
      } = ctx.getImageData(0, 0, canvas.width, canvas.height));
      {
        console.log('png no. of colors', 4096 * quality);
      }
      let png;
      png = UPNG.encode([data.buffer], canvas.width, canvas.height, 4096 * quality);
      file = new Blob([png], {
        type: fileType
      });
      file.name = fileName;
      file.lastModified = fileLastModified;
      return $If_4.call(this);
    } else {
      if (fileType === 'image/bmp') {
        return new Promise(resolve => CanvasToBMP.toBlob(canvas, resolve)).then(function ($await_10) {
          try {
            file = $await_10;
            file.name = fileName;
            file.lastModified = fileLastModified;
            return $If_5.call(this);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      } else {
        if (typeof OffscreenCanvas === 'function' && canvas instanceof OffscreenCanvas) {
          return canvas.convertToBlob({
            type: fileType,
            quality
          }).then(function ($await_11) {
            try {
              file = $await_11;
              file.name = fileName;
              file.lastModified = fileLastModified;
              return $If_6.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        } else {
          let dataUrl;
          dataUrl = canvas.toDataURL(fileType, quality);
          return getFilefromDataUrl(dataUrl, fileName, fileLastModified).then(function ($await_12) {
            try {
              file = $await_12;
              return $If_6.call(this);
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }.bind(this), $error);
        }
        function $If_6() {
          return $If_5.call(this);
        }
      }
      function $If_5() {
        return $If_4.call(this);
      }
    }
    function $If_4() {
      return $return(file);
    }
  });
}
function cleanupCanvasMemory(canvas) {
  canvas.width = 0;
  canvas.height = 0;
}
function isAutoOrientationInBrowser() {
  return new Promise(function ($return, $error) {
    let testImageURL, testImageFile, testImageCanvas, testImageFile2, img;
    if (isAutoOrientationInBrowser.cachedResult !== undefined) return $return(isAutoOrientationInBrowser.cachedResult);
    testImageURL = 'data:image/jpeg;base64,/9j/4QAiRXhpZgAATU0AKgAAAAgAAQESAAMAAAABAAYAAAA' + 'AAAD/2wCEAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBA' + 'QEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQE' + 'BAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAf/AABEIAAEAAgMBEQACEQEDEQH/x' + 'ABKAAEAAAAAAAAAAAAAAAAAAAALEAEAAAAAAAAAAAAAAAAAAAAAAQEAAAAAAAAAAAAAAAA' + 'AAAAAEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8H//2Q==';
    return getFilefromDataUrl(testImageURL, 'test.jpg', Date.now()).then(function ($await_13) {
      try {
        testImageFile = $await_13;
        return drawFileInCanvas(testImageFile).then(function ($await_14) {
          try {
            testImageCanvas = $await_14[1];
            return canvasToFile(testImageCanvas, testImageFile.type, testImageFile.name, testImageFile.lastModified).then(function ($await_15) {
              try {
                testImageFile2 = $await_15;
                cleanupCanvasMemory(testImageCanvas);
                return drawFileInCanvas(testImageFile2).then(function ($await_16) {
                  try {
                    img = $await_16[0];
                    isAutoOrientationInBrowser.cachedResult = img.width === 1 && img.height === 2;
                    return $return(isAutoOrientationInBrowser.cachedResult);
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }, $error);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }, $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }, $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }, $error);
  });
}
function getExifOrientation(file) {
  return new Promise((resolve, reject) => {
    const reader = new CustomFileReader();
    reader.onload = e => {
      const view = new DataView(e.target.result);
      if (view.getUint16(0, false) != 0xFFD8) {
        return resolve(-2);
      }
      const length = view.byteLength;
      let offset = 2;
      while (offset < length) {
        if (view.getUint16(offset + 2, false) <= 8) return resolve(-1);
        const marker = view.getUint16(offset, false);
        offset += 2;
        if (marker == 0xFFE1) {
          if (view.getUint32(offset += 2, false) != 0x45786966) {
            return resolve(-1);
          }
          const little = view.getUint16(offset += 6, false) == 0x4949;
          offset += view.getUint32(offset + 4, little);
          const tags = view.getUint16(offset, little);
          offset += 2;
          for (let i = 0; i < tags; i++) {
            if (view.getUint16(offset + i * 12, little) == 0x0112) {
              return resolve(view.getUint16(offset + i * 12 + 8, little));
            }
          }
        } else if ((marker & 0xFF00) != 0xFF00) {
          break;
        } else {
          offset += view.getUint16(offset, false);
        }
      }
      return resolve(-1);
    };
    reader.onerror = e => reject(e);
    reader.readAsArrayBuffer(file);
  });
}
function handleMaxWidthOrHeight(canvas, options) {
  const {
    width
  } = canvas;
  const {
    height
  } = canvas;
  const {
    maxWidthOrHeight
  } = options;
  const needToHandle = isFinite(maxWidthOrHeight) && (width > maxWidthOrHeight || height > maxWidthOrHeight);
  let newCanvas = canvas;
  let ctx;
  if (needToHandle) {
    [newCanvas, ctx] = getNewCanvasAndCtx(width, height);
    if (width > height) {
      newCanvas.width = maxWidthOrHeight;
      newCanvas.height = height / width * maxWidthOrHeight;
    } else {
      newCanvas.width = width / height * maxWidthOrHeight;
      newCanvas.height = maxWidthOrHeight;
    }
    ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);
    cleanupCanvasMemory(canvas);
  }
  return newCanvas;
}
function followExifOrientation(canvas, exifOrientation) {
  const {
    width
  } = canvas;
  const {
    height
  } = canvas;
  const [newCanvas, ctx] = getNewCanvasAndCtx(width, height);
  if (exifOrientation > 4 && exifOrientation < 9) {
    newCanvas.width = height;
    newCanvas.height = width;
  } else {
    newCanvas.width = width;
    newCanvas.height = height;
  }
  switch (exifOrientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, width, 0);
      break;
    case 3:
      ctx.transform(-1, 0, 0, -1, width, height);
      break;
    case 4:
      ctx.transform(1, 0, 0, -1, 0, height);
      break;
    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, height, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, height, width);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, width);
      break;
  }
  ctx.drawImage(canvas, 0, 0, width, height);
  cleanupCanvasMemory(canvas);
  return newCanvas;
}

function compress(file, options, previousProgress = 0) {
  return new Promise(function ($return, $error) {
    let progress, remainingTrials, maxSizeByte, origCanvas, maxWidthOrHeightFixedCanvas, exifOrientation, orientationFixedCanvas, quality, outputFileType, tempFile, origExceedMaxSize, sizeBecomeLarger, sourceSize, renderedSize, currentSize, compressedFile, newCanvas, ctx, canvas, shouldReduceResolution;
    function incProgress(inc = 5) {
      if (options.signal && options.signal.aborted) {
        throw options.signal.reason;
      }
      progress += inc;
      options.onProgress(Math.min(progress, 100));
    }
    function setProgress(p) {
      if (options.signal && options.signal.aborted) {
        throw options.signal.reason;
      }
      progress = Math.min(Math.max(p, progress), 100);
      options.onProgress(progress);
    }
    progress = previousProgress;
    remainingTrials = options.maxIteration || 10;
    maxSizeByte = options.maxSizeMB * 1024 * 1024;
    incProgress();
    return drawFileInCanvas(file, options).then(function ($await_5) {
      try {
        [, origCanvas] = $await_5;
        incProgress();
        maxWidthOrHeightFixedCanvas = handleMaxWidthOrHeight(origCanvas, options);
        incProgress();
        return new Promise(function ($return, $error) {
          var $logicalOr_1;
          if (!($logicalOr_1 = options.exifOrientation)) {
            return getExifOrientation(file).then(function ($await_6) {
              try {
                $logicalOr_1 = $await_6;
                return $If_2.call(this);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          }
          function $If_2() {
            return $return($logicalOr_1);
          }
          return $If_2.call(this);
        }).then(function ($await_7) {
          try {
            exifOrientation = $await_7;
            incProgress();
            return isAutoOrientationInBrowser().then(function ($await_8) {
              try {
                orientationFixedCanvas = $await_8 ? maxWidthOrHeightFixedCanvas : followExifOrientation(maxWidthOrHeightFixedCanvas, exifOrientation);
                incProgress();
                quality = options.initialQuality || 1.0;
                outputFileType = options.fileType || file.type;
                return canvasToFile(orientationFixedCanvas, outputFileType, file.name, file.lastModified, quality).then(function ($await_9) {
                  try {
                    {
                      tempFile = $await_9;
                      incProgress();
                      origExceedMaxSize = tempFile.size > maxSizeByte;
                      sizeBecomeLarger = tempFile.size > file.size;
                      if ("development" === 'development') {
                        console.log('outputFileType', outputFileType);
                        console.log('original file size', file.size);
                        console.log('current file size', tempFile.size);
                      }
                      if (!origExceedMaxSize && !sizeBecomeLarger) {
                        if ("development" === 'development') {
                          console.log('no need to compress');
                        }
                        setProgress(100);
                        return $return(tempFile);
                      }
                      sourceSize = file.size;
                      renderedSize = tempFile.size;
                      currentSize = renderedSize;
                      canvas = orientationFixedCanvas;
                      shouldReduceResolution = !options.alwaysKeepResolution && origExceedMaxSize;
                      var $Loop_3_trampoline;
                      function $Loop_3() {
                        if (remainingTrials-- && (currentSize > maxSizeByte || currentSize > sourceSize)) {
                          let newWidth, newHeight;
                          newWidth = shouldReduceResolution ? canvas.width * 0.95 : canvas.width;
                          newHeight = shouldReduceResolution ? canvas.height * 0.95 : canvas.height;
                          if ("development" === 'development') {
                            console.log('current width', newWidth);
                            console.log('current height', newHeight);
                            console.log('current quality', quality);
                          }
                          [newCanvas, ctx] = getNewCanvasAndCtx(newWidth, newHeight);
                          ctx.drawImage(canvas, 0, 0, newWidth, newHeight);
                          if (outputFileType === 'image/png') {
                            quality *= 0.85;
                          } else {
                            quality *= 0.95;
                          }
                          return canvasToFile(newCanvas, outputFileType, file.name, file.lastModified, quality).then(function ($await_10) {
                            try {
                              compressedFile = $await_10;
                              cleanupCanvasMemory(canvas);
                              canvas = newCanvas;
                              currentSize = compressedFile.size;
                              setProgress(Math.min(99, Math.floor((renderedSize - currentSize) / (renderedSize - maxSizeByte) * 100)));
                              return $Loop_3;
                            } catch ($boundEx) {
                              return $error($boundEx);
                            }
                          }, $error);
                        } else return [1];
                      }
                      return ($Loop_3_trampoline = function (q) {
                        while (q) {
                          if (q.then) return void q.then($Loop_3_trampoline, $error);
                          try {
                            if (q.pop) {
                              if (q.length) return q.pop() ? $Loop_3_exit.call(this) : q;else q = $Loop_3;
                            } else q = q.call(this);
                          } catch (_exception) {
                            return $error(_exception);
                          }
                        }
                      }.bind(this))($Loop_3);
                      function $Loop_3_exit() {
                        cleanupCanvasMemory(canvas);
                        cleanupCanvasMemory(newCanvas);
                        cleanupCanvasMemory(maxWidthOrHeightFixedCanvas);
                        cleanupCanvasMemory(orientationFixedCanvas);
                        cleanupCanvasMemory(origCanvas);
                        setProgress(100);
                        return $return(compressedFile);
                      }
                    }
                  } catch ($boundEx) {
                    return $error($boundEx);
                  }
                }.bind(this), $error);
              } catch ($boundEx) {
                return $error($boundEx);
              }
            }.bind(this), $error);
          } catch ($boundEx) {
            return $error($boundEx);
          }
        }.bind(this), $error);
      } catch ($boundEx) {
        return $error($boundEx);
      }
    }.bind(this), $error);
  });
}

function createWorkerScriptURL(script) {
  const blobArgs = [];
  if (typeof script === 'function') {
    blobArgs.push(`(${script})()`);
  } else {
    blobArgs.push(script);
  }
  return URL.createObjectURL(new Blob(blobArgs));
}
const workerScript = `
let scriptImported = false
self.addEventListener('message', async (e) => {
  const { file, id, imageCompressionLibUrl, options } = e.data
  options.onProgress = (progress) => self.postMessage({ progress, id })
  try {
    if (!scriptImported) {
      // console.log('[worker] importScripts', imageCompressionLibUrl)
      self.importScripts(imageCompressionLibUrl)
      scriptImported = true
    }
    // console.log('[worker] self', self)
    const compressedFile = await imageCompression(file, options)
    self.postMessage({ file: compressedFile, id })
  } catch (e) {
    // console.error('[worker] error', e)
    self.postMessage({ error: e.message + '\\n' + e.stack, id })
  }
})
`;
let workerScriptURL;
function compressOnWebWorker(file, options) {
  return new Promise((resolve, reject) => {
    if (!workerScriptURL) {
      workerScriptURL = createWorkerScriptURL(workerScript);
    }
    const worker = new Worker(workerScriptURL);
    function handler(e) {
      if (options.signal && options.signal.aborted) {
        worker.terminate();
        return;
      }
      if (e.data.progress !== undefined) {
        options.onProgress(e.data.progress);
        return;
      }
      if (e.data.error) {
        reject(new Error(e.data.error));
        worker.terminate();
        return;
      }
      resolve(e.data.file);
      worker.terminate();
    }
    worker.addEventListener('message', handler);
    worker.addEventListener('error', reject);
    if (options.signal) {
      options.signal.addEventListener('abort', () => {
        reject(options.signal.reason);
        worker.terminate();
      });
    }
    worker.postMessage({
      file,
      imageCompressionLibUrl: options.libURL,
      options: {
        ...options,
        onProgress: undefined,
        signal: undefined
      }
    });
  });
}

function imageCompression(file, options) {
  return new Promise(function ($return, $error) {
    let opts, compressedFile, progress, onProgress, useWebWorker, inWebWorker;
    opts = {
      ...options
    };
    progress = 0;
    ({
      onProgress
    } = opts);
    opts.maxSizeMB = opts.maxSizeMB || Number.POSITIVE_INFINITY;
    useWebWorker = typeof opts.useWebWorker === 'boolean' ? opts.useWebWorker : true;
    delete opts.useWebWorker;
    opts.onProgress = aProgress => {
      progress = aProgress;
      if (typeof onProgress === 'function') {
        onProgress(progress);
      }
    };
    if (!(file instanceof Blob || file instanceof CustomFile)) {
      return $error(new Error('The file given is not an instance of Blob or File'));
    } else if (!/^image/.test(file.type)) {
      return $error(new Error('The file given is not an image'));
    }
    inWebWorker = typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope;
    {
      if (useWebWorker && typeof Worker === 'function' || inWebWorker) {
        console.log('run compression in web worker');
      } else {
        console.log('run compression in main thread');
      }
    }
    if (useWebWorker && typeof Worker === 'function' && !inWebWorker) {
      var $Try_1_Post = function () {
        try {
          return $If_4.call(this);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this);
      var $Try_1_Catch = function (e) {
        try {
          if ("development" === 'development') {
            console.warn('Run compression in web worker failed:', e, ', fall back to main thread');
          }
          return compress(file, opts).then(function ($await_5) {
            try {
              compressedFile = $await_5;
              return $Try_1_Post();
            } catch ($boundEx) {
              return $error($boundEx);
            }
          }, $error);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      };
      try {
        opts.libURL = opts.libURL || `https://cdn.jsdelivr.net/npm/browser-image-compression@${"2.0.2"}/dist/browser-image-compression.js`;
        return compressOnWebWorker(file, opts).then(function ($await_6) {
          try {
            compressedFile = $await_6;
            return $Try_1_Post();
          } catch ($boundEx) {
            return $Try_1_Catch($boundEx);
          }
        }, $Try_1_Catch);
      } catch (e) {
        $Try_1_Catch(e);
      }
    } else {
      return compress(file, opts).then(function ($await_7) {
        try {
          compressedFile = $await_7;
          return $If_4.call(this);
        } catch ($boundEx) {
          return $error($boundEx);
        }
      }.bind(this), $error);
    }
    function $If_4() {
      try {
        compressedFile.name = file.name;
        compressedFile.lastModified = file.lastModified;
      } catch (e) {
        {
          console.error(e);
        }
      }
      try {
        if (opts.preserveExif && file.type === 'image/jpeg' && (!opts.fileType || opts.fileType && opts.fileType === file.type)) {
          if ("development" === 'development') {
            console.log('copyExifWithoutOrientation');
          }
          compressedFile = copyExifWithoutOrientation(file, compressedFile);
        }
      } catch (e) {
        {
          console.error(e);
        }
      }
      return $return(compressedFile);
    }
  });
}
imageCompression.getDataUrlFromFile = getDataUrlFromFile;
imageCompression.getFilefromDataUrl = getFilefromDataUrl;
imageCompression.loadImage = loadImage;
imageCompression.drawImageInCanvas = drawImageInCanvas;
imageCompression.drawFileInCanvas = drawFileInCanvas;
imageCompression.canvasToFile = canvasToFile;
imageCompression.getExifOrientation = getExifOrientation;
imageCompression.handleMaxWidthOrHeight = handleMaxWidthOrHeight;
imageCompression.followExifOrientation = followExifOrientation;
imageCompression.cleanupCanvasMemory = cleanupCanvasMemory;
imageCompression.isAutoOrientationInBrowser = isAutoOrientationInBrowser;
imageCompression.approximateBelowMaximumCanvasSizeOfBrowser = approximateBelowMaximumCanvasSizeOfBrowser;
imageCompression.copyExifWithoutOrientation = copyExifWithoutOrientation;
imageCompression.getBrowserName = getBrowserName;
imageCompression.version = "2.0.2";

export { imageCompression as default };
//# sourceMappingURL=browser-image-compression.mjs.map
