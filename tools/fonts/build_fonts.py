"""Builds the app's font files from the open-source sources (Google Fonts, SIL OFL / Apache 2.0).

    python3 tools/fonts/build_fonts.py --src <folder with the downloaded sources>

Sources (fetched once, outside the repo): google/fonts ofl/bricolagegrotesque (variable),
ofl/bevietnampro, ofl/ibmplexmono, ofl/patrickhand, and google/material-design-icons
variablefont/MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf + .codepoints. The looks'
faces, display and interface (`--only looks` builds just these): ofl/baloo2, ofl/bodonimoda,
ofl/newsreader, ofl/darkergrotesque, ofl/alegreya, ofl/literata, ofl/epilogue, ofl/archivo,
ofl/plusjakartasans, ofl/nunito and ofl/tiltneon (variable), and the static cuts of
ofl/barlowcondensed, ofl/delagothicone, ofl/spectral, ofl/alegreyasans, ofl/baijamjuree and
ofl/barlow named in LOOK_STATIC_FACES.

Bricolage Grotesque, Material Symbols and most look faces ship as variable fonts: React Native applies
`fontVariationSettings` on iOS and Android, so the app sets the same axes the browser does
(optical size = font size, the exact weight, the icon FILL axis). Static cuts stay static.
Every face is subset to Latin + Vietnamese (icons: to the glyphs the prototype names) and
renamed so each file registers under its own family name.
"""

import argparse
import json
import re
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "apps/mobile/assets/fonts"
ICON_MAP = ROOT / "apps/mobile/src/ui/icons/symbols.generated.ts"
PROTOTYPE = ROOT / "design/prototype/6pm App.dc.html"
EXTRA_PROTOTYPES = [
    "6pm App v2.dc.html",
    "6pm Onboarding v2.dc.html",
    "6pm Surfaces and States.dc.html",
]
# Icons the app always ships, whatever the prototypes name (the Edit pot keypad's cost line).
EXTRA_ICONS = ["calendar_month"]

# Latin, Latin-1, Latin Extended-A/B (đ, ơ, ư), combining marks, Vietnamese (Latin Extended
# Additional), general punctuation (’ – — …), currency (₫), arrows and math (≈ −).
TEXT_UNICODES = (
    list(range(0x20, 0x7F))
    + list(range(0xA0, 0x250))
    + list(range(0x300, 0x370))
    + list(range(0x1E00, 0x1F00))
    + list(range(0x2000, 0x2070))
    + list(range(0x20A0, 0x20C0))
    + list(range(0x2190, 0x21FF))
    + list(range(0x2200, 0x2300))
    + [0x25CF, 0x2713, 0x2726]
)



def rename(font: TTFont, family: str, postscript: str) -> None:
    """Gives the face one unambiguous family, so `fontFamily: family` finds exactly this file."""
    name = font["name"]
    for record in list(name.names):
        if record.nameID in (16, 17, 21, 22, 25):
            name.removeNames(nameID=record.nameID)
    for name_id, value in ((1, family), (2, "Regular"), (3, postscript), (4, family), (6, postscript)):
        name.setName(value, name_id, 3, 1, 0x409)
        name.setName(value, name_id, 1, 0, 0)


def subset_font(font: TTFont, unicodes=None, glyphs=None) -> None:
    options = subset.Options()
    options.layout_features = ["*"]
    options.name_IDs = ["*"]
    options.notdef_outline = True
    options.hinting = False
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=unicodes or [], glyphs=glyphs or [])
    subsetter.subset(font)


def save(font: TTFont, file_name: str) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    font.save(OUT / file_name)
    print(f"  {file_name} {(OUT / file_name).stat().st_size // 1024} KB")


def build_bricolage(src: Path) -> None:
    # Width stays normal (the design never narrows it); the default instance is the display cut
    # (500 at opsz 32), so text that sets no axes still looks right.
    font = TTFont(src / "BricolageGrotesque[opsz,wdth,wght].ttf")
    subset_font(font, unicodes=TEXT_UNICODES)
    font = instancer.instantiateVariableFont(
        font, {"wdth": 100, "wght": (300, 500, 800), "opsz": (12, 32, 96)}, updateFontNames=False
    )
    rename(font, "BricolageGrotesque", "BricolageGrotesque-Variable")
    save(font, "BricolageGrotesque-Variable.ttf")


def build_static(src: Path) -> None:
    for file_name, family in (
        ("BeVietnamPro-Regular.ttf", "BeVietnamPro-Regular"),
        ("BeVietnamPro-Medium.ttf", "BeVietnamPro-Medium"),
        ("BeVietnamPro-SemiBold.ttf", "BeVietnamPro-SemiBold"),
        ("BeVietnamPro-Bold.ttf", "BeVietnamPro-Bold"),
        ("IBMPlexMono-Regular.ttf", "IBMPlexMono-Regular"),
        ("IBMPlexMono-Medium.ttf", "IBMPlexMono-Medium"),
        ("IBMPlexMono-SemiBold.ttf", "IBMPlexMono-SemiBold"),
        ("PatrickHand-Regular.ttf", "PatrickHand-Regular"),
    ):
        font = TTFont(src / file_name)
        subset_font(font, unicodes=TEXT_UNICODES)
        rename(font, family, family)
        save(font, f"{family}.ttf")


# Each look's display face (`font`) and interface face (`ui`), as `6pm App v2.dc.html` names them.
# Variable files keep the axes the app sets: weight, and optical size where the face has it (the
# browser's `font-optical-sizing: auto`); every other axis is pinned to the face's normal drawing.
# The default instance is the weight the face is set at most (500 for display, 400 for text).
LOOK_VARIABLE_FACES = (
    # (source, family, axes)
    ("Baloo2[wght].ttf", "Baloo2", {"wght": (500, 500, 700)}),
    ("BodoniModa[opsz,wght].ttf", "BodoniModa", {"wght": (400, 500, 700), "opsz": (6, 28, 96)}),
    ("Newsreader[opsz,wght].ttf", "Newsreader", {"wght": (400, 500, 700), "opsz": (6, 28, 72)}),
    ("DarkerGrotesque[wght].ttf", "DarkerGrotesque", {"wght": (400, 500, 800)}),
    ("Alegreya[wght].ttf", "Alegreya", {"wght": (400, 500, 800)}),
    ("Literata[opsz,wght].ttf", "Literata", {"wght": (400, 400, 800), "opsz": (7, 12, 72)}),
    ("Epilogue[wght].ttf", "Epilogue", {"wght": (400, 400, 800)}),
    ("Archivo[wdth,wght].ttf", "Archivo", {"wght": (400, 400, 800), "wdth": 100}),
    ("PlusJakartaSans[wght].ttf", "PlusJakartaSans", {"wght": (400, 400, 800)}),
    ("Nunito[wght].ttf", "Nunito", {"wght": (400, 400, 800)}),
    ("TiltNeon[XROT,YROT].ttf", "TiltNeon", {"XROT": 0, "YROT": 0}),
)

# Faces Google ships only as static cuts, one file per weight the app sets.
LOOK_STATIC_FACES = (
    "BarlowCondensed-Medium",
    "BarlowCondensed-SemiBold",
    "DelaGothicOne-Regular",
    "Spectral-Regular",
    "Spectral-Medium",
    "Spectral-SemiBold",
    "AlegreyaSans-Regular",
    "AlegreyaSans-Medium",
    "AlegreyaSans-Bold",
    "AlegreyaSans-ExtraBold",
    "BaiJamjuree-Regular",
    "BaiJamjuree-Medium",
    "BaiJamjuree-SemiBold",
    "BaiJamjuree-Bold",
    "Barlow-Regular",
    "Barlow-Medium",
    "Barlow-SemiBold",
    "Barlow-Bold",
)


def build_look_faces(src: Path) -> None:
    for family in LOOK_STATIC_FACES:
        font = TTFont(src / f"{family}.ttf")
        subset_font(font, unicodes=TEXT_UNICODES)
        rename(font, family, family)
        save(font, f"{family}.ttf")
    for file_name, family, axes in LOOK_VARIABLE_FACES:
        font = TTFont(src / file_name)
        subset_font(font, unicodes=TEXT_UNICODES)
        font = instancer.instantiateVariableFont(font, axes, updateFontNames=False)
        if "fvar" in font:
            rename(font, family, f"{family}-Variable")
            save(font, f"{family}-Variable.ttf")
        else:
            rename(font, family, family)
            save(font, f"{family}.ttf")


def used_icon_names(codepoints: dict) -> list:
    """Every Material Symbols name that appears as a word in the prototypes, and EXTRA_ICONS."""
    words = set(EXTRA_ICONS)
    for path in [PROTOTYPE] + [PROTOTYPE.parent / p for p in EXTRA_PROTOTYPES]:
        words.update(re.findall(r"[a-z][a-z0-9_]{1,40}", path.read_text(encoding="utf-8")))
    return sorted(w for w in words if w in codepoints)


def build_symbols(src: Path) -> None:
    variable = src / "MaterialSymbolsRounded[FILL,GRAD,opsz,wght].ttf"
    codepoints = {}
    for line in (src / "MaterialSymbolsRounded[FILL,GRAD,opsz,wght].codepoints").read_text().splitlines():
        name, hex_code = line.split()
        codepoints[name] = int(hex_code, 16)
    names = used_icon_names(codepoints)
    unicodes = sorted({codepoints[n] for n in names})
    # The weights and optical sizes the prototype loads; grade stays 0. Default: outline, 400, 24.
    font = TTFont(variable)
    subset_font(font, unicodes=unicodes)
    font = instancer.instantiateVariableFont(
        font, {"GRAD": 0, "wght": (300, 400, 600), "opsz": (20, 24, 48)}, updateFontNames=False
    )
    rename(font, "MaterialSymbolsRounded", "MaterialSymbolsRounded-Variable")
    save(font, "MaterialSymbolsRounded-Variable.ttf")
    ICON_MAP.parent.mkdir(parents=True, exist_ok=True)
    entries = ",\n".join(f"  {n}: 0x{codepoints[n]:x}" for n in names)
    ICON_MAP.write_text(
        "// @generated by tools/fonts/build_fonts.py: the Material Symbols the app ships.\n"
        "// To add an icon, name it in the prototype or extend the list, then rebuild the fonts.\n"
        f"export const symbolCodepoints = {{\n{entries},\n}} as const;\n\n"
        "export type SymbolName = keyof typeof symbolCodepoints;\n"
    )
    print(f"  {len(names)} icons → {ICON_MAP.relative_to(ROOT)}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", type=Path, required=True)
    parser.add_argument("--only", choices=["looks"], help="build just the looks' faces")
    args = parser.parse_args()
    src = args.src
    if args.only != "looks":
        print("Bricolage Grotesque"); build_bricolage(src)
        print("Static faces"); build_static(src)
    print("Look faces"); build_look_faces(src)
    if args.only != "looks":
        print("Material Symbols Rounded"); build_symbols(src)
    print(json.dumps({"out": str(OUT.relative_to(ROOT))}))


if __name__ == "__main__":
    main()
